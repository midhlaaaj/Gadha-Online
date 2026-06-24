-- ============================================================
-- STEP 1: Extend the parents table with notification prefs
-- ============================================================
ALTER TABLE public.parents
ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{"booking_confirmations": true, "class_reminders": true, "assignment_updates": true, "mentor_messages": true, "offers_promotions": false}'::JSONB;

-- ============================================================
-- STEP 2: Extend bookings table to support course bookings
-- ============================================================
-- Make session_id nullable (a booking can be for a course)
ALTER TABLE public.bookings ALTER COLUMN session_id DROP NOT NULL;

-- Add course_id column
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS course_id UUID REFERENCES public.courses(id) ON DELETE RESTRICT;

-- Ensure exactly one of session_id or course_id is set
ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS check_booking_target;
ALTER TABLE public.bookings ADD CONSTRAINT check_booking_target CHECK (
    (session_id IS NOT NULL AND course_id IS NULL) OR
    (session_id IS NULL AND course_id IS NOT NULL)
);

-- Unique constraints
ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS unique_student_session_booking;
ALTER TABLE public.bookings ADD CONSTRAINT unique_student_session_booking UNIQUE(student_id, session_id);

ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS unique_student_course_booking;
ALTER TABLE public.bookings ADD CONSTRAINT unique_student_course_booking UNIQUE(student_id, course_id);

-- ============================================================
-- STEP 3: Seed test parent account (parent@tutoboard.com)
-- ============================================================
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data)
VALUES (
    '11111111-1111-1111-1111-111111111111',
    'parent@tutoboard.com',
    'dummy_hash',
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Suresh Kumar","role":"parent"}'
)
ON CONFLICT (id) DO NOTHING;

-- Ensure parent profile has phone number set
UPDATE public.parents
SET phone = '+91 98765 43210'
WHERE id = '11111111-1111-1111-1111-111111111111';

-- ============================================================
-- STEP 4: Seed test student (child of parent above)
-- ============================================================
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data)
VALUES (
    '22222222-2222-2222-2222-222222222222',
    'aarav@gmail.com',
    'dummy_hash',
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Aarav Kumar","role":"student"}'
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.students (id, parent_id, grade_level, school_name)
VALUES (
    '22222222-2222-2222-2222-222222222222',
    '11111111-1111-1111-1111-111111111111',
    'Class 11',
    'Modern Public School'
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- STEP 5: Seed a pending invitation (second child)
-- ============================================================
INSERT INTO public.student_invitations (parent_id, email, full_name, grade_level, school_name, status)
VALUES (
    '11111111-1111-1111-1111-111111111111',
    'preethi@gmail.com',
    'Preethi Kumar',
    'Class 9',
    'Modern Public School',
    'pending'
)
ON CONFLICT (parent_id, email) DO NOTHING;

-- ============================================================
-- STEP 6: Seed test bookings for the student
-- ============================================================
DO $$
DECLARE
    v_parent_id UUID := '11111111-1111-1111-1111-111111111111';
    v_student_id UUID := '22222222-2222-2222-2222-222222222222';
    v_session_id UUID;
    v_course_id UUID;
BEGIN
    SELECT id INTO v_session_id FROM public.sessions WHERE title = 'Statistics & Probability' LIMIT 1;
    IF v_session_id IS NOT NULL THEN
        INSERT INTO public.bookings (parent_id, student_id, session_id, status, payment_status, amount_paid)
        VALUES (v_parent_id, v_student_id, v_session_id, 'confirmed', 'paid', 449.00)
        ON CONFLICT (student_id, session_id) DO NOTHING;
    END IF;

    SELECT id INTO v_session_id FROM public.sessions WHERE title = 'English Essay Writing' LIMIT 1;
    IF v_session_id IS NOT NULL THEN
        INSERT INTO public.bookings (parent_id, student_id, session_id, status, payment_status, amount_paid)
        VALUES (v_parent_id, v_student_id, v_session_id, 'confirmed', 'paid', 399.00)
        ON CONFLICT (student_id, session_id) DO NOTHING;
    END IF;

    SELECT id INTO v_course_id FROM public.courses WHERE title = 'Python for Beginners' LIMIT 1;
    IF v_course_id IS NOT NULL THEN
        INSERT INTO public.bookings (parent_id, student_id, course_id, status, payment_status, amount_paid)
        VALUES (v_parent_id, v_student_id, v_course_id, 'confirmed', 'paid', 3499.00)
        ON CONFLICT (student_id, course_id) DO NOTHING;
    END IF;
END $$;
