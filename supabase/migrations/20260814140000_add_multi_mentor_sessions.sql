-- Allows a single session listing to be taught by more than one mentor,
-- with the student picking which mentor they want at booking time.
CREATE TABLE IF NOT EXISTS public.session_mentors (
  session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  mentor_id UUID NOT NULL REFERENCES public.mentors(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (session_id, mentor_id)
);

ALTER TABLE public.session_mentors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read session mentors" ON public.session_mentors
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage session mentors" ON public.session_mentors
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Backfill: every existing session's single mentor becomes its one row here.
INSERT INTO public.session_mentors (session_id, mentor_id)
SELECT id, mentor_id FROM public.sessions WHERE mentor_id IS NOT NULL
ON CONFLICT DO NOTHING;

-- Records which mentor was actually assigned to a given booking. Needed once
-- a session can have multiple eligible mentors — the session's own mentor_id
-- is then just "default/primary", not the truth for any specific booking.
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS mentor_id UUID REFERENCES public.mentors(id) ON DELETE SET NULL;

-- Backfill existing bookings from their course/session's mentor.
UPDATE public.bookings b
SET mentor_id = c.mentor_id
FROM public.courses c
WHERE b.course_id = c.id AND b.mentor_id IS NULL;

UPDATE public.bookings b
SET mentor_id = s.mentor_id
FROM public.sessions s
WHERE b.session_id = s.id AND b.mentor_id IS NULL;
