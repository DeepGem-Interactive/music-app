-- Migration: Add creation_mode column to projects table
-- Run this in your Supabase SQL editor if you have existing projects

-- Add the creation_mode column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'projects' AND column_name = 'creation_mode'
    ) THEN
        ALTER TABLE public.projects
        ADD COLUMN creation_mode TEXT DEFAULT 'collaborative'
        CHECK (creation_mode IN ('collaborative', 'instant'));
    END IF;
END $$;

-- Update any existing projects to have 'collaborative' mode (they were created before instant mode existed)
UPDATE public.projects
SET creation_mode = 'collaborative'
WHERE creation_mode IS NULL;
