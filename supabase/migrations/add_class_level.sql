-- Migration: Add optional class_level column to courses and sessions tables
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS class_level TEXT;
ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS class_level TEXT;
