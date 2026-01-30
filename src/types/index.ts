// Core domain types for Sentimental Song Platform

export type ProjectStatus = 'draft' | 'collecting' | 'curating' | 'generating' | 'completed';
export type CreationMode = 'collaborative' | 'instant';
export type InviteStatus = 'pending' | 'sent' | 'opened' | 'submitted' | 'opted_out';
export type SubmissionMode = 'quick' | 'deep';
export type SubmissionStatus = 'pending' | 'approved' | 'excluded';
export type SongVersionStatus = 'generating' | 'completed' | 'failed';
export type InviteChannel = 'sms' | 'email';
export type VocalStyle = 'male' | 'female' | 'choir';
export type MusicInputMode = 'songs' | 'vibe' | 'surprise';
export type AuditActionType =
  | 'submission_flagged'
  | 'submission_approved'
  | 'line_highlighted'
  | 'deadline_extended'
  | 'song_generated'
  | 'revision_requested';

// Database row types
export interface Project {
  id: string;
  host_user_id: string;
  creation_mode: CreationMode;
  honoree_name: string;
  honoree_relationship: string;
  occasion: string;
  personality_traits: string[]; // NEW: Personality traits describing the honoree
  favorite_moments: string | null; // NEW: Free-form text describing favorite moments
  tone_heartfelt_funny: number; // 1-10
  tone_intimate_anthem: number; // 1-10
  tone_minimal_lyrical: number; // 1-10
  music_input_mode: MusicInputMode;
  music_style_references: string | null;
  music_inferred_style: MusicStyleInference | null;
  music_genre_preferences: string[]; // Deprecated: for backward compatibility
  music_tempo_preference: string;
  music_vocal_style: VocalStyle;
  music_instrumental_preferences: string[]; // Deprecated: inferred from style
  honoree_photo_url: string | null;
  honoree_details: HonoreeDetails | null;
  must_include_items: string[];
  topics_to_avoid: string[];
  deadline_timestamp: string;
  status: ProjectStatus;
  created_at: string;
  updated_at: string;
}

export interface Invite {
  id: string;
  project_id: string;
  recipient_name: string;
  recipient_contact: string;
  channel: InviteChannel;
  token: string;
  status: InviteStatus;
  sent_at: string;
  opened_at: string | null;
  submitted_at: string | null;
}

export interface Submission {
  id: string;
  project_id: string;
  invite_id: string | null;
  contributor_name: string;
  submission_mode: SubmissionMode;
  answers_json: QuickModeAnswers | DeepModeAnswers;
  voice_note_urls: string[];
  flags: string[];
  status: SubmissionStatus;
  submitted_at: string;
}

export interface QuickModeAnswers {
  admire: string;
  memory: string;
  quirk: string;
  wish: string;
}

export interface DeepModeAnswers {
  memory_funny: string;
  memory_tender: string;
  memory_defining: string;
  how_they_show_love: string;
  current_chapter: string;
  what_matters_most: string;
  voice_note_transcript?: string;
}

// AI-inferred music style from song/artist references
export interface MusicStyleInference {
  genres: string[];
  mood: string;
  suggestedInstruments: string[];
  tempoHint: 'slow' | 'medium' | 'upbeat';
  styleKeywords: string[];
}

// Personalization details about the honoree
export interface HonoreeDetails {
  bestMemories: string;           // Best memories with this person
  importantPeople: string;        // Names and relationships of important people in their life
  physicalDescription: string;    // What they look like
  energeticDescription: string;   // How you feel when they're around
  importantEvents: string;        // Key life events
}

export interface Curation {
  id: string;
  project_id: string;
  must_include_lines: string[];
  exclusion_rules: string[];
  selected_submission_ids: string[];
  created_at: string;
  updated_at: string;
}

export interface SongVersion {
  id: string;
  project_id: string;
  version_number: number;
  title: string;
  style_prompt: string;
  lyrics: string;
  audio_wav_url: string | null;
  audio_mp3_url: string | null;
  cover_art_url: string | null;
  status: SongVersionStatus;
  generation_metadata: Record<string, unknown>;
  created_at: string;
}

export interface RevisionCredit {
  id: string;
  host_user_id: string;
  project_id: string | null;
  credits_purchased: number;
  credits_used: number;
  purchase_date: string;
  expiration_date: string | null;
}

export interface AuditLog {
  id: string;
  project_id: string;
  user_id: string;
  action_type: AuditActionType;
  details: Record<string, unknown>;
  timestamp: string;
}

export interface User {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
}

// API request/response types
export interface CreateProjectRequest {
  creation_mode?: CreationMode; // defaults to 'collaborative'
  honoree_name: string;
  honoree_relationship: string;
  occasion: string;
  personality_traits?: string[]; // NEW: Personality traits describing the honoree
  favorite_moments?: string; // NEW: Free-form text describing favorite moments
  tone_heartfelt_funny: number;
  tone_intimate_anthem: number;
  tone_minimal_lyrical: number;
  // New music input system
  music_input_mode: MusicInputMode;
  music_style_references?: string; // Song/artist names or vibe description
  music_inferred_style?: MusicStyleInference;
  // Legacy fields (for backward compatibility)
  music_genre_preferences?: string[];
  music_tempo_preference: string;
  music_vocal_style: VocalStyle;
  music_instrumental_preferences?: string[];
  // Personalization
  honoree_details?: HonoreeDetails;
  must_include_items: string[];
  topics_to_avoid: string[];
  deadline_hours?: number; // defaults to 72
  // For instant mode - host provides memories directly
  instant_memories?: QuickModeAnswers;
  // For collaborative mode - list of collaborators to invite
  collaborators?: Array<{
    name: string;
    email?: string;
    phone?: string;
  }>;
}

export interface CreateInvitesRequest {
  contacts: Array<{
    name: string;
    contact: string; // email or phone
    channel: InviteChannel;
  }>;
}

export interface SubmitContributionRequest {
  contributor_name: string;
  submission_mode: SubmissionMode;
  answers: QuickModeAnswers | DeepModeAnswers;
  voice_note_urls?: string[];
}

export interface UpdateCurationRequest {
  must_include_lines?: string[];
  exclusion_rules?: string[];
  selected_submission_ids?: string[];
}

export interface GenerateSongRequest {
  iteration_feedback?: string;
}

export interface DistributeSongRequest {
  version_id: string;
}

// Dashboard stats
export interface ProjectDashboard {
  project: Project;
  invites_sent: number;
  submissions_received: number;
  submissions: Submission[];
  curation: Curation | null;
  latest_version: SongVersion | null;
  revisions_remaining: number;
}

// Contribution page context
export interface ContributionContext {
  project_id: string;
  honoree_name: string;
  honoree_relationship: string;
  occasion: string;
  tone_description: string;
  deadline_timestamp: string;
  host_name: string;
  already_submitted: boolean;
  previous_answers?: QuickModeAnswers | DeepModeAnswers;
}
