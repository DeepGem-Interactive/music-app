-- Migration: Add personality_traits and favorite_moments to projects table
-- Run this manually in Supabase SQL editor

ALTER TABLE public.projects 
  ADD COLUMN IF NOT EXISTS personality_traits JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS favorite_moments TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.projects.personality_traits IS 'Array of personality trait strings describing the honoree';
COMMENT ON COLUMN public.projects.favorite_moments IS 'Free-form text describing favorite moments with the honoree';
