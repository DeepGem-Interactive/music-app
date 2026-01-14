-- Supabase Schema for Sentimental Song Platform
-- Run this in your Supabase SQL editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Projects table
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  host_user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  honoree_name TEXT NOT NULL,
  honoree_relationship TEXT NOT NULL,
  occasion TEXT NOT NULL,
  tone_heartfelt_funny INTEGER DEFAULT 5 CHECK (tone_heartfelt_funny >= 1 AND tone_heartfelt_funny <= 10),
  tone_intimate_anthem INTEGER DEFAULT 5 CHECK (tone_intimate_anthem >= 1 AND tone_intimate_anthem <= 10),
  tone_minimal_lyrical INTEGER DEFAULT 5 CHECK (tone_minimal_lyrical >= 1 AND tone_minimal_lyrical <= 10),
  music_genre_preferences JSONB DEFAULT '[]'::jsonb NOT NULL,
  music_tempo_preference TEXT NOT NULL,
  music_vocal_style TEXT NOT NULL CHECK (music_vocal_style IN ('male', 'female', 'choir')),
  music_instrumental_preferences JSONB DEFAULT '[]'::jsonb NOT NULL,
  honoree_photo_url TEXT,
  must_include_items JSONB DEFAULT '[]'::jsonb NOT NULL,
  topics_to_avoid JSONB DEFAULT '[]'::jsonb NOT NULL,
  deadline_timestamp TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'collecting', 'curating', 'generating', 'completed')),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Invites table
CREATE TABLE IF NOT EXISTS public.invites (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  recipient_name TEXT NOT NULL,
  recipient_contact TEXT NOT NULL,
  channel TEXT NOT NULL CHECK (channel IN ('sms', 'email')),
  token TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'opened', 'submitted', 'opted_out')),
  sent_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Submissions table
CREATE TABLE IF NOT EXISTS public.submissions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  invite_id UUID REFERENCES public.invites(id) ON DELETE SET NULL,
  contributor_name TEXT NOT NULL,
  submission_mode TEXT NOT NULL CHECK (submission_mode IN ('quick', 'deep')),
  answers_json JSONB NOT NULL,
  voice_note_urls JSONB DEFAULT '[]'::jsonb NOT NULL,
  flags JSONB DEFAULT '[]'::jsonb NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'excluded')),
  submitted_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Curations table
CREATE TABLE IF NOT EXISTS public.curations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE UNIQUE NOT NULL,
  must_include_lines JSONB DEFAULT '[]'::jsonb NOT NULL,
  exclusion_rules JSONB DEFAULT '[]'::jsonb NOT NULL,
  selected_submission_ids JSONB DEFAULT '[]'::jsonb NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Song versions table
CREATE TABLE IF NOT EXISTS public.song_versions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  version_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  style_prompt TEXT NOT NULL CHECK (LENGTH(style_prompt) <= 1000),
  lyrics TEXT NOT NULL,
  audio_wav_url TEXT,
  audio_mp3_url TEXT,
  cover_art_url TEXT,
  status TEXT DEFAULT 'generating' CHECK (status IN ('generating', 'completed', 'failed')),
  generation_metadata JSONB DEFAULT '{}'::jsonb NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(project_id, version_number)
);

-- Revision credits table
CREATE TABLE IF NOT EXISTS public.revision_credits (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  host_user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  credits_purchased INTEGER NOT NULL CHECK (credits_purchased > 0),
  credits_used INTEGER DEFAULT 0 NOT NULL CHECK (credits_used >= 0),
  purchase_date TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  expiration_date TIMESTAMPTZ
);

-- Audit logs table
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action_type TEXT NOT NULL CHECK (action_type IN (
    'submission_flagged', 'submission_approved', 'line_highlighted',
    'deadline_extended', 'song_generated', 'revision_requested'
  )),
  details JSONB DEFAULT '{}'::jsonb NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_projects_host_user_id ON public.projects(host_user_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects(status);
CREATE INDEX IF NOT EXISTS idx_invites_project_id ON public.invites(project_id);
CREATE INDEX IF NOT EXISTS idx_invites_token ON public.invites(token);
CREATE INDEX IF NOT EXISTS idx_submissions_project_id ON public.submissions(project_id);
CREATE INDEX IF NOT EXISTS idx_submissions_invite_id ON public.submissions(invite_id);
CREATE INDEX IF NOT EXISTS idx_song_versions_project_id ON public.song_versions(project_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_project_id ON public.audit_logs(project_id);

-- Row Level Security Policies

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.curations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.song_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.revision_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Projects policies
CREATE POLICY "Hosts can view their own projects"
  ON public.projects FOR SELECT
  USING (auth.uid() = host_user_id);

CREATE POLICY "Hosts can create projects"
  ON public.projects FOR INSERT
  WITH CHECK (auth.uid() = host_user_id);

CREATE POLICY "Hosts can update their own projects"
  ON public.projects FOR UPDATE
  USING (auth.uid() = host_user_id);

-- Invites policies
CREATE POLICY "Hosts can view invites for their projects"
  ON public.invites FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = invites.project_id
      AND projects.host_user_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can view invites by token"
  ON public.invites FOR SELECT
  USING (true); -- Token-based access is validated in application code

CREATE POLICY "Hosts can create invites for their projects"
  ON public.invites FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = project_id
      AND projects.host_user_id = auth.uid()
    )
  );

CREATE POLICY "Hosts can update invites for their projects"
  ON public.invites FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = invites.project_id
      AND projects.host_user_id = auth.uid()
    )
  );

-- Submissions policies
CREATE POLICY "Hosts can view submissions for their projects"
  ON public.submissions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = submissions.project_id
      AND projects.host_user_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can create submissions"
  ON public.submissions FOR INSERT
  WITH CHECK (true); -- Token-based access validated in application

CREATE POLICY "Hosts can update submissions for their projects"
  ON public.submissions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = submissions.project_id
      AND projects.host_user_id = auth.uid()
    )
  );

-- Curations policies
CREATE POLICY "Hosts can manage curations for their projects"
  ON public.curations FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = curations.project_id
      AND projects.host_user_id = auth.uid()
    )
  );

-- Song versions policies
CREATE POLICY "Hosts can manage song versions for their projects"
  ON public.song_versions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = song_versions.project_id
      AND projects.host_user_id = auth.uid()
    )
  );

-- Revision credits policies
CREATE POLICY "Users can view their own credits"
  ON public.revision_credits FOR SELECT
  USING (auth.uid() = host_user_id);

CREATE POLICY "Users can create their own credits"
  ON public.revision_credits FOR INSERT
  WITH CHECK (auth.uid() = host_user_id);

-- Audit logs policies
CREATE POLICY "Hosts can view audit logs for their projects"
  ON public.audit_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = audit_logs.project_id
      AND projects.host_user_id = auth.uid()
    )
  );

-- Functions

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_curations_updated_at
  BEFORE UPDATE ON public.curations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Handle new user registration
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user registration
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Function to get project dashboard stats
CREATE OR REPLACE FUNCTION get_project_dashboard(p_project_id UUID)
RETURNS TABLE (
  invites_sent BIGINT,
  submissions_received BIGINT,
  revisions_used BIGINT,
  revisions_remaining BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM public.invites WHERE project_id = p_project_id AND status != 'pending') as invites_sent,
    (SELECT COUNT(*) FROM public.submissions WHERE project_id = p_project_id) as submissions_received,
    (SELECT COUNT(*) FROM public.song_versions WHERE project_id = p_project_id) as revisions_used,
    (3 - (SELECT COUNT(*) FROM public.song_versions WHERE project_id = p_project_id) +
      COALESCE((SELECT SUM(credits_purchased - credits_used) FROM public.revision_credits
        WHERE project_id = p_project_id), 0)) as revisions_remaining;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
