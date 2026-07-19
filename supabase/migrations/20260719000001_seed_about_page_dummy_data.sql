-- Seed dummy data for About Us: Team Members & Achievements

INSERT INTO public.team_members (name, role, bio, photo_url, avatar_bg, avatar_text, display_order, show_on_site) VALUES
('Dr. Vikram Sethi', 'Founder & CEO', 'Ex-IIT Delhi & Stanford Alum with 12+ years in education tech. Passionate about personalized learning for every student.', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80', '#1B3A6B', 'VS', 1, true),
('Ananya Roy', 'Head of Academics', 'M.Ed. Harvard University with 10+ years designing high-impact curricula for competitive exams and STEM education.', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80', '#2F7FE8', 'AR', 2, true),
('Kavita Rao', 'VP of Product', 'Former Lead Product Manager at top edtech platforms. Dedicated to building engaging learning experiences.', 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=400&q=80', '#0F6E56', 'KR', 3, true),
('Rohan Deshmukh', 'Head of Student Success', 'Experienced academic counselor committed to mentor matching, student growth, and career guidance.', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80', '#993556', 'RD', 4, true);

INSERT INTO public.achievements (stat_value, stat_label, image_url, display_order, show_on_site) VALUES
('15,000+', 'Active Learners Guided Across India', 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=600&q=80', 1, true),
('98.4%', 'Exam Qualification & Grade Improvement Rate', 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=600&q=80', 2, true),
('500,000+', 'Hours of 1-on-1 Mentorship Delivered', 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=600&q=80', 3, true),
('50+', 'Top Universities & Dream Companies Placements', 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=600&q=80', 4, true);
