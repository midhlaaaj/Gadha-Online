-- Migration to accommodate course bookings in the database

-- 1. Drop existing NOT NULL constraint on session_id in the bookings table
ALTER TABLE public.bookings ALTER COLUMN session_id DROP NOT NULL;

-- 2. Add course_id column referencing courses table
ALTER TABLE public.bookings ADD COLUMN course_id UUID REFERENCES public.courses(id) ON DELETE RESTRICT;

-- 3. Drop the old unique constraint that enforced student_id & session_id uniqueness
ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS unique_student_session_booking;

-- 4. Re-create the unique constraint for session bookings
ALTER TABLE public.bookings ADD CONSTRAINT unique_student_session_booking UNIQUE (student_id, session_id);

-- 5. Create a new unique constraint for course bookings
ALTER TABLE public.bookings ADD CONSTRAINT unique_student_course_booking UNIQUE (student_id, course_id);

-- 6. Add check constraint to ensure a booking is linked to EXACTLY one target (either a session OR a course)
ALTER TABLE public.bookings ADD CONSTRAINT check_booking_target 
CHECK (
    (session_id IS NOT NULL AND course_id IS NULL) OR 
    (session_id IS NULL AND course_id IS NOT NULL)
);
