-- Create contact_messages table to store contact form submissions
CREATE TABLE public.contact_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    subject TEXT NOT NULL,
    phone TEXT,
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable Row-Level Security (RLS)
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- Allow admins to view contact messages
CREATE POLICY "Admins can view contact messages" ON public.contact_messages FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Allow anyone to insert/submit contact messages (public submissions)
CREATE POLICY "Anyone can insert contact messages" ON public.contact_messages FOR INSERT WITH CHECK (true);

-- Extend mentors table schema to support UI fields
ALTER TABLE public.mentors ADD COLUMN IF NOT EXISTS qualification TEXT;
ALTER TABLE public.mentors ADD COLUMN IF NOT EXISTS experience INTEGER DEFAULT 1;
ALTER TABLE public.mentors ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT TRUE;

-- Create chat_rooms table
CREATE TABLE IF NOT EXISTS public.chat_rooms (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create chat_participants table
CREATE TABLE IF NOT EXISTS public.chat_participants (
    chat_room_id UUID REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    PRIMARY KEY (chat_room_id, user_id)
);

-- Create messages table
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    chat_room_id UUID REFERENCES public.chat_rooms(id) ON DELETE CASCADE NOT NULL,
    sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    file_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS and add policies for chat and messaging tables
ALTER TABLE public.chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Policies for Chat Rooms
CREATE POLICY "Users can view chat rooms they are part of" ON public.chat_rooms FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.chat_participants 
    WHERE chat_participants.chat_room_id = chat_rooms.id 
      AND chat_participants.user_id = auth.uid()
  )
);

-- Policies for Chat Participants
CREATE POLICY "Users can view participants in their chat rooms" ON public.chat_participants FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.chat_participants p 
    WHERE p.chat_room_id = chat_participants.chat_room_id 
      AND p.user_id = auth.uid()
  )
);

CREATE POLICY "Users can add participants to their chat rooms" ON public.chat_participants FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.chat_participants p 
    WHERE p.chat_room_id = chat_participants.chat_room_id 
      AND p.user_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Policies for Messages
CREATE POLICY "Users can view messages in their chat rooms" ON public.messages FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.chat_participants 
    WHERE chat_participants.chat_room_id = messages.chat_room_id 
      AND chat_participants.user_id = auth.uid()
  )
);

CREATE POLICY "Users can send messages to their chat rooms" ON public.messages FOR INSERT WITH CHECK (
  sender_id = auth.uid() AND EXISTS (
    SELECT 1 FROM public.chat_participants 
    WHERE chat_participants.chat_room_id = messages.chat_room_id 
      AND chat_participants.user_id = auth.uid()
  )
);
