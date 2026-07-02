-- Migration to add availability column to mentors table for weekly scheduling slots configuration
ALTER TABLE public.mentors ADD COLUMN IF NOT EXISTS availability JSONB DEFAULT '{}'::jsonb;
