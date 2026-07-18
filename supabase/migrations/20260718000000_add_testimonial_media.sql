-- Add optional media attachment to testimonials (image or video review)
ALTER TABLE public.testimonials
  ADD COLUMN IF NOT EXISTS media_url TEXT,
  ADD COLUMN IF NOT EXISTS media_type TEXT CHECK (media_type IN ('image', 'video'));
