-- ============================================================
-- MIGRATION: Parent Dashboard Support Tables & Missing Columns
-- ============================================================

-- 1. Add missing columns to the parents table
ALTER TABLE public.parents
  ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{
    "booking_confirmations": true,
    "class_reminders": true,
    "assignment_updates": true,
    "mentor_messages": true,
    "offers_promotions": false
  }'::JSONB;

-- 2. RLS policies for parents table
DROP POLICY IF EXISTS "Parents can view own record" ON public.parents;
CREATE POLICY "Parents can view own record"
  ON public.parents FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Parents can update own record" ON public.parents;
CREATE POLICY "Parents can update own record"
  ON public.parents FOR UPDATE
  USING (auth.uid() = id);

-- 3. RLS policies for students table
DROP POLICY IF EXISTS "Parents can view their children" ON public.students;
CREATE POLICY "Parents can view their children"
  ON public.students FOR SELECT
  USING (parent_id = auth.uid());

DROP POLICY IF EXISTS "Students can view own record" ON public.students;
CREATE POLICY "Students can view own record"
  ON public.students FOR SELECT
  USING (auth.uid() = id);

-- 4. RLS policies for student_invitations
DROP POLICY IF EXISTS "Parents can view their invitations" ON public.student_invitations;
CREATE POLICY "Parents can view their invitations"
  ON public.student_invitations FOR SELECT
  USING (parent_id = auth.uid());

DROP POLICY IF EXISTS "Parents can create invitations" ON public.student_invitations;
CREATE POLICY "Parents can create invitations"
  ON public.student_invitations FOR INSERT
  WITH CHECK (parent_id = auth.uid());

DROP POLICY IF EXISTS "Parents can update their invitations" ON public.student_invitations;
CREATE POLICY "Parents can update their invitations"
  ON public.student_invitations FOR UPDATE
  USING (parent_id = auth.uid());

DROP POLICY IF EXISTS "Parents can delete their invitations" ON public.student_invitations;
CREATE POLICY "Parents can delete their invitations"
  ON public.student_invitations FOR DELETE
  USING (parent_id = auth.uid());

-- 5. RLS policies for bookings table
DROP POLICY IF EXISTS "Parents can view their bookings" ON public.bookings;
CREATE POLICY "Parents can view their bookings"
  ON public.bookings FOR SELECT
  USING (parent_id = auth.uid());

DROP POLICY IF EXISTS "Parents can create bookings" ON public.bookings;
CREATE POLICY "Parents can create bookings"
  ON public.bookings FOR INSERT
  WITH CHECK (parent_id = auth.uid());

DROP POLICY IF EXISTS "Students can view their bookings" ON public.bookings;
CREATE POLICY "Students can view their bookings"
  ON public.bookings FOR SELECT
  USING (student_id = auth.uid());

DROP POLICY IF EXISTS "Admins can manage all bookings" ON public.bookings;
CREATE POLICY "Admins can manage all bookings"
  ON public.bookings FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================================
-- 6. NEW: scheduled_classes table
-- ============================================================
CREATE TABLE IF NOT EXISTS public.scheduled_classes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
  mentor_id UUID REFERENCES public.mentors(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  subject TEXT NOT NULL,
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_minutes INTEGER DEFAULT 60 NOT NULL,
  status TEXT DEFAULT 'scheduled' NOT NULL,
  join_url TEXT,
  recording_url TEXT,
  icon_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.scheduled_classes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Parents can view classes for their students" ON public.scheduled_classes;
CREATE POLICY "Parents can view classes for their students"
  ON public.scheduled_classes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.students
      WHERE students.id = scheduled_classes.student_id
        AND students.parent_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Students can view own scheduled classes" ON public.scheduled_classes;
CREATE POLICY "Students can view own scheduled classes"
  ON public.scheduled_classes FOR SELECT
  USING (student_id = auth.uid());

DROP POLICY IF EXISTS "Admins and mentors can manage scheduled classes" ON public.scheduled_classes;
CREATE POLICY "Admins and mentors can manage scheduled classes"
  ON public.scheduled_classes FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'mentor')
    )
  );

-- ============================================================
-- 7. NEW: attendance_records table
-- ============================================================
CREATE TABLE IF NOT EXISTS public.attendance_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
  scheduled_class_id UUID REFERENCES public.scheduled_classes(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  session_date DATE NOT NULL,
  subject TEXT NOT NULL,
  status attendance_status DEFAULT 'present' NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Parents can view attendance for their students" ON public.attendance_records;
CREATE POLICY "Parents can view attendance for their students"
  ON public.attendance_records FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.students
      WHERE students.id = attendance_records.student_id
        AND students.parent_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Students can view own attendance" ON public.attendance_records;
CREATE POLICY "Students can view own attendance"
  ON public.attendance_records FOR SELECT
  USING (student_id = auth.uid());

DROP POLICY IF EXISTS "Admins and mentors can manage attendance" ON public.attendance_records;
CREATE POLICY "Admins and mentors can manage attendance"
  ON public.attendance_records FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'mentor')
    )
  );

-- ============================================================
-- 8. NEW: assignments table
-- ============================================================
CREATE TABLE IF NOT EXISTS public.assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  course_id UUID REFERENCES public.courses(id) ON DELETE SET NULL,
  session_id UUID REFERENCES public.sessions(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  subject TEXT NOT NULL,
  due_date DATE,
  status TEXT DEFAULT 'pending' NOT NULL,
  score NUMERIC(5, 2),
  feedback TEXT,
  created_by UUID REFERENCES public.mentors(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Parents can view assignments for their students" ON public.assignments;
CREATE POLICY "Parents can view assignments for their students"
  ON public.assignments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.students
      WHERE students.id = assignments.student_id
        AND students.parent_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Students can view own assignments" ON public.assignments;
CREATE POLICY "Students can view own assignments"
  ON public.assignments FOR SELECT
  USING (student_id = auth.uid());

DROP POLICY IF EXISTS "Admins and mentors can manage assignments" ON public.assignments;
CREATE POLICY "Admins and mentors can manage assignments"
  ON public.assignments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'mentor')
    )
  );
