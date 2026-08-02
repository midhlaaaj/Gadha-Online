ALTER TABLE public.mentor_notifications DROP CONSTRAINT IF EXISTS mentor_notifications_type_check;
ALTER TABLE public.mentor_notifications ADD CONSTRAINT mentor_notifications_type_check
  CHECK (type = ANY (ARRAY['new_booking'::text, 'reminder_3h'::text, 'reminder_1h'::text, 'new_message'::text, 'booking_cancelled'::text]));
