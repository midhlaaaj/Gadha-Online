ALTER TABLE public.assignments
  ADD COLUMN IF NOT EXISTS submission_url TEXT,
  ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ;
