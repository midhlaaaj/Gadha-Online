-- Leads: mark contact form submissions as resolved/unresolved
ALTER TABLE public.contact_messages ADD COLUMN IF NOT EXISTS is_resolved BOOLEAN DEFAULT FALSE NOT NULL;

-- Admin management: invite-gated admin accounts
CREATE TABLE public.admin_invitations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    invited_by UUID REFERENCES public.profiles(id),
    status TEXT DEFAULT 'pending' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.admin_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage admin invitations" ON public.admin_invitations FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Security fix: previously, ANY signup could pass `role: 'admin'` in the
-- client-supplied auth metadata and self-promote to a full admin account.
-- Admin role assignment now requires a matching pending admin_invitations
-- row for that email (mirrors the existing student/mentor invite pattern);
-- mentor/parent/student self-declared roles are unchanged.
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

    v_has_mentor_invite BOOLEAN := FALSE;
    v_mentor_invite_id UUID;
    v_mentor_invite_name TEXT;
    v_mentor_invite_hourly_rate NUMERIC(10, 2);
    v_mentor_invite_expertise TEXT[];
    v_mentor_invite_qualification TEXT;
    v_mentor_invite_experience INTEGER;

    v_has_admin_invite BOOLEAN := FALSE;
    v_admin_invite_id UUID;
    v_admin_invite_name TEXT;

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

    -- Check if there is an active student invitation for this email
    SELECT id, full_name, parent_id, date_of_birth, grade_level, school_name
    INTO v_invite_id, v_invite_name, v_invite_parent, v_invite_dob, v_invite_grade, v_invite_school
    FROM public.student_invitations
    WHERE email = new.email AND status = 'pending'
    LIMIT 1;

    IF FOUND THEN
        v_has_invite := TRUE;
    END IF;

    -- Check if there is an active mentor invitation for this email
    SELECT id, full_name, hourly_rate, expertise, qualification, experience
    INTO v_mentor_invite_id, v_mentor_invite_name, v_mentor_invite_hourly_rate, v_mentor_invite_expertise, v_mentor_invite_qualification, v_mentor_invite_experience
    FROM public.mentor_invitations
    WHERE email = new.email AND status = 'pending'
    LIMIT 1;

    IF FOUND THEN
        v_has_mentor_invite := TRUE;
    END IF;

    -- Check if there is an active admin invitation for this email
    SELECT id, full_name
    INTO v_admin_invite_id, v_admin_invite_name
    FROM public.admin_invitations
    WHERE email = new.email AND status = 'pending'
    LIMIT 1;

    IF FOUND THEN
        v_has_admin_invite := TRUE;
    END IF;

    -- Determine role safely. Admin is ONLY granted via a matching invite —
    -- v_meta_role is never trusted for 'admin', unlike mentor/parent/student.
    IF v_has_invite THEN
        v_role := 'student'::public.user_role;
    ELSIF v_has_mentor_invite THEN
        v_role := 'mentor'::public.user_role;
    ELSIF v_has_admin_invite THEN
        v_role := 'admin'::public.user_role;
    ELSIF v_meta_role IN ('mentor', 'parent', 'student') THEN
        v_role := v_meta_role::public.user_role;
    ELSE
        v_role := 'parent'::public.user_role;
    END IF;

    -- Insert Profile
    INSERT INTO public.profiles (id, email, full_name, role, avatar_url)
    VALUES (
        new.id,
        new.email,
        COALESCE(v_meta_name, v_invite_name, v_mentor_invite_name, v_admin_invite_name, 'New User'),
        v_role,
        v_meta_avatar
    );

    -- Insert into matching role table
    IF v_role = 'parent' THEN
        INSERT INTO public.parents (id) VALUES (new.id);
    ELSIF v_role = 'mentor' THEN
        IF v_has_mentor_invite THEN
            INSERT INTO public.mentors (id, hourly_rate, expertise, qualification, experience, verified)
            VALUES (
                new.id,
                v_mentor_invite_hourly_rate,
                v_mentor_invite_expertise,
                v_mentor_invite_qualification,
                v_mentor_invite_experience,
                true
            );

            -- Update invitation status
            UPDATE public.mentor_invitations
            SET status = 'accepted'
            WHERE id = v_mentor_invite_id;
        ELSE
            INSERT INTO public.mentors (id, hourly_rate, expertise)
            VALUES (new.id, 0.00, ARRAY[]::TEXT[]);
        END IF;
    ELSIF v_role = 'student' THEN
        INSERT INTO public.students (id, parent_id, date_of_birth, grade_level, school_name)
        VALUES (new.id, v_invite_parent, v_invite_dob, v_invite_grade, v_invite_school);

        -- Update invitation status
        UPDATE public.student_invitations
        SET status = 'accepted'
        WHERE id = v_invite_id;
    ELSIF v_role = 'admin' THEN
        UPDATE public.admin_invitations
        SET status = 'accepted'
        WHERE id = v_admin_invite_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
