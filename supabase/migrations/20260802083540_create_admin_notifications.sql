CREATE TABLE public.admin_notifications (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type = ANY (ARRAY['new_booking_request'::text, 'new_lead'::text, 'new_support_ticket'::text, 'mentor_invite_accepted'::text])),
  title text not null,
  message text not null,
  link_url text,
  is_read boolean not null default false,
  created_at timestamptz not null default timezone('utc'::text, now())
);

ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view admin notifications" ON public.admin_notifications
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can update admin notifications" ON public.admin_notifications
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE INDEX admin_notifications_created_at_idx ON public.admin_notifications (created_at DESC);
