-- ============================================================
-- MIGRATION: Create Resources Table
-- ============================================================

CREATE TABLE IF NOT EXISTS public.resources (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  mentor_id UUID REFERENCES public.mentors(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES public.students(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  type resource_type NOT NULL DEFAULT 'document',
  subject TEXT NOT NULL,
  url TEXT NOT NULL,
  size TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;

-- 1. Mentors can manage their own resources
DROP POLICY IF EXISTS "Mentors can manage their own resources" ON public.resources;
CREATE POLICY "Mentors can manage their own resources"
  ON public.resources FOR ALL
  USING (mentor_id = auth.uid())
  WITH CHECK (mentor_id = auth.uid());

-- 2. Students can view resources shared directly with them or general resources from their mentors
DROP POLICY IF EXISTS "Students can view resources shared with them" ON public.resources;
CREATE POLICY "Students can view resources shared with them"
  ON public.resources FOR SELECT
  USING (
    student_id = auth.uid() OR
    (student_id IS NULL AND EXISTS (
      SELECT 1 FROM public.bookings b
      LEFT JOIN public.sessions s ON b.session_id = s.id
      LEFT JOIN public.courses c ON b.course_id = c.id
      WHERE b.student_id = auth.uid() 
        AND (s.mentor_id = resources.mentor_id OR c.mentor_id = resources.mentor_id)
    ))
  );

-- 3. Parents can view resources shared with their children
DROP POLICY IF EXISTS "Parents can view resources shared with their children" ON public.resources;
CREATE POLICY "Parents can view resources shared with their children"
  ON public.resources FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.students st
      WHERE st.parent_id = auth.uid() AND (
        st.id = resources.student_id OR
        (resources.student_id IS NULL AND EXISTS (
          SELECT 1 FROM public.bookings b
          LEFT JOIN public.sessions s ON b.session_id = s.id
          LEFT JOIN public.courses c ON b.course_id = c.id
          WHERE b.student_id = st.id 
            AND (s.mentor_id = resources.mentor_id OR c.mentor_id = resources.mentor_id)
        ))
      )
    )
  );

-- 4. Admins can manage all resources
DROP POLICY IF EXISTS "Admins can manage all resources" ON public.resources;
CREATE POLICY "Admins can manage all resources"
  ON public.resources FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
