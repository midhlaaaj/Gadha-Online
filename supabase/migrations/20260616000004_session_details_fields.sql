-- Migration to add session detail and timing columns to sessions table

ALTER TABLE public.sessions 
ADD COLUMN IF NOT EXISTS about_session TEXT,
ADD COLUMN IF NOT EXISTS whats_covered TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS inclusions TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS duration_options TEXT DEFAULT '60 or 90 min',
ADD COLUMN IF NOT EXISTS platform TEXT DEFAULT 'Zoom',
ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'English / Hindi',
ADD COLUMN IF NOT EXISTS days TEXT DEFAULT 'Mon – Sat',
ADD COLUMN IF NOT EXISTS reschedule_policy TEXT DEFAULT 'Up to 4 hrs before';
