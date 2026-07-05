-- Migration to add is_repeatable column to sessions table
ALTER TABLE public.sessions 
ADD COLUMN IF NOT EXISTS is_repeatable BOOLEAN DEFAULT FALSE;
