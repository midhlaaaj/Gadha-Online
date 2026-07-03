-- ============================================================
-- MIGRATION: Add Module Name Column to Course Units
-- ============================================================

ALTER TABLE public.course_units ADD COLUMN IF NOT EXISTS module_name TEXT;
