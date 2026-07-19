-- About page: vision/mission singleton, team members, achievements

CREATE TABLE public.about_page_settings (
    id INTEGER PRIMARY KEY DEFAULT 1,
    hero_title TEXT DEFAULT 'About Tutoboard' NOT NULL,
    hero_subtitle TEXT DEFAULT 'Connecting students with expert mentors since day one.' NOT NULL,
    vision_title TEXT DEFAULT 'Our Vision' NOT NULL,
    vision_text TEXT DEFAULT 'To make quality, personalized education accessible to every student, everywhere.' NOT NULL,
    mission_title TEXT DEFAULT 'Our Mission' NOT NULL,
    mission_text TEXT DEFAULT 'We connect students with verified, expert mentors for 1-on-1 sessions and structured courses tailored to their pace and goals.' NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    CONSTRAINT check_single_row CHECK (id = 1)
);

INSERT INTO public.about_page_settings (id) VALUES (1);

CREATE TABLE public.team_members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    bio TEXT DEFAULT '' NOT NULL,
    photo_url TEXT DEFAULT '' NOT NULL,
    avatar_bg TEXT DEFAULT '#1B3A6B' NOT NULL,
    avatar_text TEXT NOT NULL,
    display_order INTEGER DEFAULT 0 NOT NULL,
    show_on_site BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE TABLE public.achievements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    stat_value TEXT NOT NULL,
    stat_label TEXT NOT NULL,
    image_url TEXT DEFAULT '' NOT NULL,
    display_order INTEGER DEFAULT 0 NOT NULL,
    show_on_site BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.about_page_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public About Settings are readable by everyone" ON public.about_page_settings FOR SELECT USING (true);
CREATE POLICY "Admins can update about settings" ON public.about_page_settings FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Public Team Members are readable by everyone" ON public.team_members FOR SELECT USING (true);
CREATE POLICY "Admins can manage team members" ON public.team_members FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Public Achievements are readable by everyone" ON public.achievements FOR SELECT USING (true);
CREATE POLICY "Admins can manage achievements" ON public.achievements FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
