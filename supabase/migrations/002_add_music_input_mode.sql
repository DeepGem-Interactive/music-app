-- Migration: Add music input mode and honoree details
-- This migration adds columns for the new flexible music style input system
-- and personalization details about the honoree

-- Add music_input_mode column (songs, vibe, or surprise)
ALTER TABLE public.projects
ADD COLUMN IF NOT EXISTS music_input_mode TEXT DEFAULT 'songs'
  CHECK (music_input_mode IN ('songs', 'vibe', 'surprise'));

-- Add music_style_references column (song/artist names or vibe description)
ALTER TABLE public.projects
ADD COLUMN IF NOT EXISTS music_style_references TEXT;

-- Add music_inferred_style column (AI-inferred style from references)
ALTER TABLE public.projects
ADD COLUMN IF NOT EXISTS music_inferred_style JSONB;

-- Add honoree_details column (personalization info)
ALTER TABLE public.projects
ADD COLUMN IF NOT EXISTS honoree_details JSONB;

-- Add comment for documentation
COMMENT ON COLUMN public.projects.music_input_mode IS 'How user specified music preferences: songs (artist/song names), vibe (description), or surprise (defaults)';
COMMENT ON COLUMN public.projects.music_style_references IS 'Raw user input for songs/artists or vibe description';
COMMENT ON COLUMN public.projects.music_inferred_style IS 'AI-inferred style: {genres, mood, suggestedInstruments, tempoHint, styleKeywords}';
COMMENT ON COLUMN public.projects.honoree_details IS 'Personalization: {bestMemories, importantPeople, physicalDescription, energeticDescription, importantEvents}';
