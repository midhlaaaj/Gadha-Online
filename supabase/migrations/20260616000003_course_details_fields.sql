-- Migration to add course detail and timing columns to courses table

ALTER TABLE public.courses 
ADD COLUMN IF NOT EXISTS about_course TEXT,
ADD COLUMN IF NOT EXISTS learning_outcomes TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS curriculum JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS inclusions TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS batch_start_date TEXT,
ADD COLUMN IF NOT EXISTS batch_end_date TEXT,
ADD COLUMN IF NOT EXISTS class_days TEXT,
ADD COLUMN IF NOT EXISTS class_timing TEXT;
