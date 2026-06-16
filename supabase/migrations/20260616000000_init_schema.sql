-- Create custom types / enums
CREATE TYPE user_role AS ENUM ('admin', 'mentor', 'parent', 'student');
CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'cancelled', 'completed');
CREATE TYPE payment_status AS ENUM ('unpaid', 'paid', 'refunded', 'failed');
CREATE TYPE attendance_status AS ENUM ('present', 'absent', 'excused');
CREATE TYPE resource_type AS ENUM ('pdf', 'video', 'link', 'document');

-- 1. Profiles Table (Linked to Supabase auth.users)
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    avatar_url TEXT,
    role user_role NOT NULL DEFAULT 'parent',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. Parents Table
CREATE TABLE public.parents (
    id UUID REFERENCES public.profiles(id) ON DELETE CASCADE PRIMARY KEY,
    phone TEXT,
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. Students Table
CREATE TABLE public.students (
    id UUID REFERENCES public.profiles(id) ON DELETE CASCADE PRIMARY KEY,
    parent_id UUID REFERENCES public.parents(id) ON DELETE CASCADE NOT NULL,
    date_of_birth DATE,
    grade_level TEXT,
    school_name TEXT,
    interests TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3a. Student Invitations Table
CREATE TABLE public.student_invitations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    parent_id UUID REFERENCES public.parents(id) ON DELETE CASCADE NOT NULL,
    email TEXT NOT NULL,
    full_name TEXT NOT NULL,
    date_of_birth DATE,
    grade_level TEXT,
    school_name TEXT,
    token UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
    status TEXT DEFAULT 'pending' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    CONSTRAINT unique_parent_child_email UNIQUE (parent_id, email)
);

-- 4. Mentors Table
CREATE TABLE public.mentors (
    id UUID REFERENCES public.profiles(id) ON DELETE CASCADE PRIMARY KEY,
    bio TEXT,
    expertise TEXT[] NOT NULL DEFAULT '{}',
    hourly_rate NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    rating NUMERIC(3, 2) DEFAULT 5.0,
    qualification TEXT DEFAULT 'Educator',
    experience INTEGER DEFAULT 1,
    verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 5. Courses Table
CREATE TABLE public.courses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    cover_image_url TEXT,
    subject TEXT NOT NULL,
    format TEXT NOT NULL DEFAULT 'Live batch', -- 'Live batch', 'Recorded', 'Hourly'
    price NUMERIC(10, 2) NOT NULL,
    mentor_id UUID REFERENCES public.mentors(id) ON DELETE SET NULL,
    students_count INTEGER DEFAULT 0 NOT NULL,
    rating NUMERIC(3, 2) DEFAULT 5.0,
    status TEXT DEFAULT 'Draft' NOT NULL, -- 'Active', 'Draft'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 6. Sessions
CREATE TABLE public.sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    mentor_id UUID REFERENCES public.mentors(id) ON DELETE RESTRICT NOT NULL,
    subject TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT '1-on-1', -- '1-on-1', 'Group'
    bookings_count INTEGER DEFAULT 0 NOT NULL,
    price NUMERIC(10, 2) NOT NULL,
    status TEXT DEFAULT 'Active' NOT NULL, -- 'Active', 'Inactive'
    color_bg TEXT,
    icon_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 7. Bookings Table
CREATE TABLE public.bookings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    parent_id UUID REFERENCES public.parents(id) ON DELETE RESTRICT NOT NULL,
    student_id UUID REFERENCES public.students(id) ON DELETE RESTRICT NOT NULL,
    session_id UUID REFERENCES public.sessions(id) ON DELETE RESTRICT NOT NULL,
    status booking_status DEFAULT 'pending' NOT NULL,
    payment_status payment_status DEFAULT 'unpaid' NOT NULL,
    amount_paid NUMERIC(10, 2) DEFAULT 0.00 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    CONSTRAINT unique_student_session_booking UNIQUE(student_id, session_id)
);

-- 8. Testimonials Table
CREATE TABLE public.testimonials (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_name TEXT NOT NULL,
    role TEXT NOT NULL,
    quote TEXT NOT NULL,
    rating INTEGER DEFAULT 5 NOT NULL CHECK (rating >= 1 AND rating <= 5),
    show_on_site BOOLEAN DEFAULT TRUE NOT NULL,
    avatar_bg TEXT DEFAULT '#1B3A6B' NOT NULL,
    avatar_text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 9. Homepage Settings Table
CREATE TABLE public.homepage_settings (
    id INTEGER PRIMARY KEY DEFAULT 1,
    badge_text TEXT DEFAULT '#1 online tutoring platform' NOT NULL,
    headline TEXT DEFAULT 'Learn faster with expert mentors by your side' NOT NULL,
    accented_text TEXT DEFAULT 'expert mentors' NOT NULL,
    subheading TEXT DEFAULT 'Connect with top-rated tutors for 1-on-1 sessions, structured courses, and hourly lessons — all tailored to your pace and goals.' NOT NULL,
    primary_cta TEXT DEFAULT 'Find a mentor' NOT NULL,
    primary_link TEXT DEFAULT '/mentors' NOT NULL,
    secondary_cta TEXT DEFAULT 'Browse courses' NOT NULL,
    secondary_link TEXT DEFAULT '/courses' NOT NULL,
    c1 TEXT DEFAULT '12,400+' NOT NULL,
    cl1 TEXT DEFAULT 'Students enrolled' NOT NULL,
    c2 TEXT DEFAULT '840+' NOT NULL,
    cl2 TEXT DEFAULT 'Expert mentors' NOT NULL,
    c3 TEXT DEFAULT '320+' NOT NULL,
    cl3 TEXT DEFAULT 'Courses available' NOT NULL,
    c4 TEXT DEFAULT '98%' NOT NULL,
    cl4 TEXT DEFAULT 'Satisfaction rate' NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    CONSTRAINT check_single_row CHECK (id = 1)
);

-- Row Level Security (RLS) Configuration
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.homepage_settings ENABLE ROW LEVEL SECURITY;

-- Basic RLS Policies
CREATE POLICY "Public Profiles are readable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Public Courses are readable by everyone" ON public.courses FOR SELECT USING (true);
CREATE POLICY "Admins can manage courses" ON public.courses FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Public Mentors are readable by everyone" ON public.mentors FOR SELECT USING (true);
CREATE POLICY "Admins can manage mentors" ON public.mentors FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Public Sessions are readable by everyone" ON public.sessions FOR SELECT USING (true);
CREATE POLICY "Admins and mentors can manage sessions" ON public.sessions FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'mentor'))
);

CREATE POLICY "Public Testimonials are readable by everyone" ON public.testimonials FOR SELECT USING (true);
CREATE POLICY "Admins can manage testimonials" ON public.testimonials FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Public Homepage Settings are readable by everyone" ON public.homepage_settings FOR SELECT USING (true);
CREATE POLICY "Admins can update homepage settings" ON public.homepage_settings FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Trigger to auto-create profile when a user signs up via Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    v_role public.user_role;
    v_has_invite BOOLEAN := FALSE;
    v_invite_id UUID;
    v_invite_name TEXT;
    v_invite_parent UUID;
    v_invite_dob DATE;
    v_invite_grade TEXT;
    v_invite_school TEXT;
    v_meta_role TEXT;
    v_meta_name TEXT;
    v_meta_avatar TEXT;
BEGIN
    -- Extract meta data safely
    IF new.raw_user_meta_data IS NOT NULL THEN
        v_meta_role := new.raw_user_meta_data->>'role';
        v_meta_name := new.raw_user_meta_data->>'full_name';
        v_meta_avatar := new.raw_user_meta_data->>'avatar_url';
    END IF;

    -- Check if there is an active student invitation for this email
    SELECT id, full_name, parent_id, date_of_birth, grade_level, school_name 
    INTO v_invite_id, v_invite_name, v_invite_parent, v_invite_dob, v_invite_grade, v_invite_school
    FROM public.student_invitations 
    WHERE email = new.email AND status = 'pending'
    LIMIT 1;

    IF FOUND THEN
        v_has_invite := TRUE;
    END IF;

    -- Determine role safely
    IF v_has_invite THEN
        v_role := 'student'::public.user_role;
    ELSIF v_meta_role IN ('admin', 'mentor', 'parent', 'student') THEN
        v_role := v_meta_role::public.user_role;
    ELSE
        v_role := 'parent'::public.user_role;
    END IF;

    -- Insert Profile
    INSERT INTO public.profiles (id, email, full_name, role, avatar_url)
    VALUES (
        new.id,
        new.email,
        COALESCE(v_meta_name, v_invite_name, 'New User'),
        v_role,
        v_meta_avatar
    );
    
    -- Insert into matching role table
    IF v_role = 'parent' THEN
        INSERT INTO public.parents (id) VALUES (new.id);
    ELSIF v_role = 'mentor' THEN
        INSERT INTO public.mentors (id, hourly_rate, expertise) VALUES (new.id, 0.00, ARRAY[]::TEXT[]);
    ELSIF v_role = 'student' THEN
        INSERT INTO public.students (id, parent_id, date_of_birth, grade_level, school_name)
        VALUES (new.id, v_invite_parent, v_invite_dob, v_invite_grade, v_invite_school);
        
        -- Update invitation status
        UPDATE public.student_invitations
        SET status = 'accepted'
        WHERE id = v_invite_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Seeding Mock Users inside auth.users to bootstrap local deployment
-- Note: These run on local instances and bypass password triggers
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data)
VALUES 
('00000000-0000-0000-0000-000000000000', 'admin@tutoboard.com', 'dummy_hash', NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"Admin User","role":"admin"}'),
('00000000-0000-0000-0000-000000000001', 'arjun@tutoboard.com', 'dummy_hash', NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"Arjun Kapoor","role":"mentor"}'),
('00000000-0000-0000-0000-000000000002', 'priya@tutoboard.com', 'dummy_hash', NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"Priya Sharma","role":"mentor"}'),
('00000000-0000-0000-0000-000000000003', 'rahul@tutoboard.com', 'dummy_hash', NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"Rahul Nair","role":"mentor"}'),
('00000000-0000-0000-0000-000000000004', 'sneha@tutoboard.com', 'dummy_hash', NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"Sneha Mehta","role":"mentor"}'),
('00000000-0000-0000-0000-000000000005', 'vikram@tutoboard.com', 'dummy_hash', NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"Vikram Khanna","role":"mentor"}')
ON CONFLICT (id) DO NOTHING;

-- Populate mentor specialties and stats
UPDATE public.mentors SET hourly_rate = 499.00, expertise = ARRAY['Mathematics', 'Physics'] WHERE id = '00000000-0000-0000-0000-000000000001';
UPDATE public.mentors SET hourly_rate = 399.00, expertise = ARRAY['English', 'Literature'] WHERE id = '00000000-0000-0000-0000-000000000002';
UPDATE public.mentors SET hourly_rate = 549.00, expertise = ARRAY['Computer Science', 'Programming'] WHERE id = '00000000-0000-0000-0000-000000000003';
UPDATE public.mentors SET hourly_rate = 449.00, expertise = ARRAY['Chemistry', 'Biology'] WHERE id = '00000000-0000-0000-0000-000000000004';
UPDATE public.mentors SET hourly_rate = 459.00, expertise = ARRAY['Mathematics', 'Statistics'] WHERE id = '00000000-0000-0000-0000-000000000005';

-- Seed courses
INSERT INTO public.courses (title, subject, format, price, mentor_id, students_count, rating, status)
VALUES
('Advanced Calculus & Algebra', 'Mathematics', 'Live batch', 4999.00, '00000000-0000-0000-0000-000000000001', 1240, 4.9, 'Active'),
('Python for Beginners', 'Programming', 'Live batch', 3499.00, '00000000-0000-0000-0000-000000000003', 892, 4.8, 'Active'),
('Chemistry: Class 11 & 12', 'Science', 'Live batch', 3999.00, '00000000-0000-0000-0000-000000000004', 643, 4.7, 'Active'),
('English Essay Writing', 'English', 'Recorded', 999.00, '00000000-0000-0000-0000-000000000002', 410, 4.6, 'Draft'),
('NEET Biology Crash Course', 'Science', 'Live batch', 6499.00, '00000000-0000-0000-0000-000000000004', 780, 4.9, 'Active');

-- Seed sessions
INSERT INTO public.sessions (title, mentor_id, subject, type, bookings_count, price, status, color_bg, icon_name, description)
VALUES
('English Essay Writing', '00000000-0000-0000-0000-000000000002', 'English', '1-on-1', 98, 399.00, 'Active', '#ede9fe', 'writing', 'Improve essay structure, argumentation and grammar with live feedback and doubt-clearing.'),
('Statistics & Probability', '00000000-0000-0000-0000-000000000001', 'Mathematics', '1-on-1', 115, 449.00, 'Active', '#dbeafe', 'calculator', 'Confidence intervals, hypothesis testing and data interpretation for JEE & board exams.'),
('Python Doubt-Solving', '00000000-0000-0000-0000-000000000003', 'Programming', 'Group', 203, 549.00, 'Active', '#dcfce7', 'code', 'Live code reviews, debugging help and concept clarification for Python learners of all levels.'),
('Physics Problem-Solving', '00000000-0000-0000-0000-000000000001', 'Science', '1-on-1', 154, 499.00, 'Inactive', '#dbeafe', 'science', 'Mechanics, electrostatics and optics problem-sets worked through in real time.'),
('Chemistry Concept Clarification', '00000000-0000-0000-0000-000000000004', 'Science', '1-on-1', 86, 449.00, 'Active', '#fef9c3', 'flask', 'Organic and inorganic chemistry explained simply for NEET and Class 12 students.');

-- Seed homepage settings and testimonials
INSERT INTO public.homepage_settings (id) VALUES (1) ON CONFLICT DO NOTHING;

INSERT INTO public.testimonials (student_name, role, quote, rating, show_on_site, avatar_bg, avatar_text)
VALUES 
('Rohan Agarwal', 'JEE Advanced 2024 — AIR 412', 'Tutoboard helped me crack JEE Advanced. Arjun sir''s sessions were incredibly structured and the doubt-clearing was instant.', 5, true, '#1B3A6B', 'RA'),
('Aisha Naik', 'Class 12, CBSE Board 2024', 'I improved my English essay score from a C to an A in just 6 sessions. Priya ma''am really knows her craft.', 5, true, '#993556', 'AN'),
('Karan Patel', 'Placed at Google, 2025', 'Rahul sir made DSA feel like a breeze. Got placed at my dream company within 3 months of starting the course.', 5, false, '#0F6E56', 'KP'),
('Maya Verma', 'Class 10, ICSE 2024', 'The live math classes were amazing. I could ask questions directly and practice worksheets were really detailed.', 4, true, '#534AB7', 'MV');
