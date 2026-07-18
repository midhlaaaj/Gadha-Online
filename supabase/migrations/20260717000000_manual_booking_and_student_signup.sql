-- Manual (admin-mediated) booking workflow + independent student self-signup

-- ============================================================
-- 1. Bookings: manual payment log + mentor confirmation fields
-- ============================================================
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS payment_method TEXT;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS payment_reference TEXT;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS payment_collected_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS payment_collected_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS mentor_confirmed BOOLEAN DEFAULT FALSE NOT NULL;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS mentor_confirmed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS admin_notes TEXT;

-- ============================================================
-- 2. RLS fix: students booking for themselves (parent_id != auth.uid())
--    were never covered by the existing "Parents can create bookings" policy.
-- ============================================================
DROP POLICY IF EXISTS "Students can create own bookings" ON public.bookings;
CREATE POLICY "Students can create own bookings"
  ON public.bookings FOR INSERT
  WITH CHECK (student_id = auth.uid());

-- ============================================================
-- 3. Independent student self-signup: reuse the existing invite path
--    instead of trusting client-supplied role metadata.
-- ============================================================
ALTER TABLE public.student_invitations ALTER COLUMN parent_id DROP NOT NULL;
ALTER TABLE public.students ALTER COLUMN parent_id DROP NOT NULL;

-- Bookings made by an independent (parentless) student have no parent to
-- attribute the booking to.
ALTER TABLE public.bookings ALTER COLUMN parent_id DROP NOT NULL;

-- ============================================================
-- 4. New table: in-app notifications for parents & students
--    (mirrors mentor_notifications below)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.user_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link_url TEXT,
  is_read BOOLEAN DEFAULT FALSE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own notifications" ON public.user_notifications;
CREATE POLICY "Users can view their own notifications"
  ON public.user_notifications FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own notifications" ON public.user_notifications;
CREATE POLICY "Users can update their own notifications"
  ON public.user_notifications FOR UPDATE
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can manage all user notifications" ON public.user_notifications;
CREATE POLICY "Admins can manage all user notifications"
  ON public.user_notifications FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================================
-- 5. mentor_notifications exists only via drift in the live DB (no prior
--    migration defines it, despite being used throughout actions.ts).
--    Define it defensively so fresh environments aren't broken.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.mentor_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  mentor_id UUID REFERENCES public.mentors(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link_url TEXT,
  class_id UUID,
  is_read BOOLEAN DEFAULT FALSE NOT NULL,
  scheduled_for TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.mentor_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Mentors can view their own notifications" ON public.mentor_notifications;
CREATE POLICY "Mentors can view their own notifications"
  ON public.mentor_notifications FOR SELECT
  USING (mentor_id = auth.uid());

DROP POLICY IF EXISTS "Mentors can update their own notifications" ON public.mentor_notifications;
CREATE POLICY "Mentors can update their own notifications"
  ON public.mentor_notifications FOR UPDATE
  USING (mentor_id = auth.uid());

DROP POLICY IF EXISTS "Admins can manage all mentor notifications" ON public.mentor_notifications;
CREATE POLICY "Admins can manage all mentor notifications"
  ON public.mentor_notifications FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );
