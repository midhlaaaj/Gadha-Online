-- Add topic_details column to scheduled_classes table
ALTER TABLE public.scheduled_classes
  ADD COLUMN IF NOT EXISTS topic_details TEXT;
