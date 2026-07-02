-- Add languages column to courses table
ALTER TABLE public.courses
ADD COLUMN IF NOT EXISTS languages TEXT[] DEFAULT ARRAY['English'];
