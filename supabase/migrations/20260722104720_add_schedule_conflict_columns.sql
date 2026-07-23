-- Adds normalized start-time/duration columns needed for mentor
-- schedule-conflict overlap math (checkMentorScheduleConflict /
-- getMentorBusySlots in src/app/actions.ts).
ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS class_time text,
  ADD COLUMN IF NOT EXISTS duration_minutes integer NOT NULL DEFAULT 60;

ALTER TABLE public.sessions
  ADD COLUMN IF NOT EXISTS duration_minutes integer NOT NULL DEFAULT 60;
