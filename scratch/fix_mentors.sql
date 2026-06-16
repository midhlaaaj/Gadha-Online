-- 1. Add missing columns to mentors table
ALTER TABLE public.mentors 
ADD COLUMN IF NOT EXISTS qualification TEXT DEFAULT 'Educator',
ADD COLUMN IF NOT EXISTS experience INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT false;

-- 2. Create chat/messaging tables if they do not exist
CREATE TABLE IF NOT EXISTS public.chat_rooms (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.chat_participants (
    chat_room_id UUID REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    PRIMARY KEY (chat_room_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    chat_room_id UUID REFERENCES public.chat_rooms(id) ON DELETE CASCADE NOT NULL,
    sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    file_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. Enable RLS on chat/messaging tables
ALTER TABLE public.chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- 4. Setup RLS Policies safely (dropping them first to prevent conflicts)
DROP POLICY IF EXISTS "Users can view chat rooms they are part of" ON public.chat_rooms;
CREATE POLICY "Users can view chat rooms they are part of" ON public.chat_rooms FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.chat_participants 
    WHERE chat_participants.chat_room_id = chat_rooms.id 
      AND chat_participants.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can view participants in their chat rooms" ON public.chat_participants;
CREATE POLICY "Users can view participants in their chat rooms" ON public.chat_participants FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.chat_participants p 
    WHERE p.chat_room_id = chat_participants.chat_room_id 
      AND p.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can add participants to their chat rooms" ON public.chat_participants;
CREATE POLICY "Users can add participants to their chat rooms" ON public.chat_participants FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.chat_participants p 
    WHERE p.chat_room_id = chat_participants.chat_room_id 
      AND p.user_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  )
);

DROP POLICY IF EXISTS "Users can view messages in their chat rooms" ON public.messages;
CREATE POLICY "Users can view messages in their chat rooms" ON public.messages FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.chat_participants 
    WHERE chat_participants.chat_room_id = messages.chat_room_id 
      AND chat_participants.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can send messages to their chat rooms" ON public.messages;
CREATE POLICY "Users can send messages to their chat rooms" ON public.messages FOR INSERT WITH CHECK (
  sender_id = auth.uid() AND EXISTS (
    SELECT 1 FROM public.chat_participants 
    WHERE chat_participants.chat_room_id = messages.chat_room_id 
      AND chat_participants.user_id = auth.uid()
  )
);

-- 5. Make the handle_new_user trigger much safer
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    v_role public.user_role;
    v_has_invite BOOLEAN := FALSE;
    v_invite_id UUID;
    v_invite_name TEXT;
    v_invite_parent UUID;
    v_invite_dob DATE;
    v_invite_grade TEXT;
    v_invite_school TEXT;
    v_meta_role TEXT;
    v_meta_name TEXT;
    v_meta_avatar TEXT;
BEGIN
    -- Extract meta data safely
    IF new.raw_user_meta_data IS NOT NULL THEN
        v_meta_role := new.raw_user_meta_data->>'role';
        v_meta_name := new.raw_user_meta_data->>'full_name';
        v_meta_avatar := new.raw_user_meta_data->>'avatar_url';
    END IF;

    -- Check for invitations
    SELECT id, full_name, parent_id, date_of_birth, grade_level, school_name 
    INTO v_invite_id, v_invite_name, v_invite_parent, v_invite_dob, v_invite_grade, v_invite_school
    FROM public.student_invitations 
    WHERE email = new.email AND status = 'pending'
    LIMIT 1;

    IF FOUND THEN
        v_has_invite := TRUE;
    END IF;

    -- Determine role safely
    IF v_has_invite THEN
        v_role := 'student'::public.user_role;
    ELSIF v_meta_role IN ('admin', 'mentor', 'parent', 'student') THEN
        v_role := v_meta_role::public.user_role;
    ELSE
        v_role := 'parent'::public.user_role;
    END IF;

    -- Insert Profile
    INSERT INTO public.profiles (id, email, full_name, role, avatar_url)
    VALUES (
        new.id,
        new.email,
        COALESCE(v_meta_name, v_invite_name, 'New User'),
        v_role,
        v_meta_avatar
    );
    
    -- Insert into matching role table
    IF v_role = 'parent' THEN
        INSERT INTO public.parents (id) VALUES (new.id);
    ELSIF v_role = 'mentor' THEN
        INSERT INTO public.mentors (id, hourly_rate, expertise) VALUES (new.id, 0.00, ARRAY[]::TEXT[]);
    ELSIF v_role = 'student' THEN
        INSERT INTO public.students (id, parent_id, date_of_birth, grade_level, school_name)
        VALUES (new.id, v_invite_parent, v_invite_dob, v_invite_grade, v_invite_school);
        
        UPDATE public.student_invitations SET status = 'accepted' WHERE id = v_invite_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
