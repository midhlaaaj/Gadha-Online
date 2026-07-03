-- Migration to add inclusions_enabled column to sessions table
ALTER TABLE public.sessions 
ADD COLUMN IF NOT EXISTS inclusions_enabled BOOLEAN[] DEFAULT '{true,true,true,true,true}';
