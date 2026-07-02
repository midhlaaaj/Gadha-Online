-- Add live individual course parameters to courses table
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS duration_days INTEGER DEFAULT 30;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS total_sessions INTEGER DEFAULT 10;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS sessions_per_week INTEGER DEFAULT 2;

-- Add group session scheduling fields to sessions table
ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS session_date DATE;
ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS session_time TEXT;
