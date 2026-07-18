-- Add attachment_url column to scheduled_classes table
ALTER TABLE public.scheduled_classes
  ADD COLUMN IF NOT EXISTS attachment_url TEXT;
