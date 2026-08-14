CREATE TABLE IF NOT EXISTS public.platform_settings (
  id INT PRIMARY KEY DEFAULT 1,
  commission_rate NUMERIC(5,2) NOT NULL DEFAULT 15,
  allow_signups BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT single_row CHECK (id = 1)
);

INSERT INTO public.platform_settings (id, commission_rate, allow_signups)
VALUES (1, 15, true)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read platform settings" ON public.platform_settings
  FOR SELECT USING (true);

CREATE POLICY "Admins can update platform settings" ON public.platform_settings
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );
