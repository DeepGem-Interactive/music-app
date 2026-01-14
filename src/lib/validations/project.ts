import { z } from 'zod';

export const vocalStyleSchema = z.enum(['male', 'female', 'choir']);

export const createProjectSchema = z.object({
  honoree_name: z.string().min(1, 'Honoree name is required').max(100),
  honoree_relationship: z.string().min(1, 'Relationship is required').max(100),
  occasion: z.string().min(1, 'Occasion is required').max(200),
  tone_heartfelt_funny: z.number().min(1).max(10).default(5),
  tone_intimate_anthem: z.number().min(1).max(10).default(5),
  tone_minimal_lyrical: z.number().min(1).max(10).default(5),
  music_genre_preferences: z.array(z.string()).min(1, 'Select at least one genre'),
  music_tempo_preference: z.string().min(1, 'Tempo is required'),
  music_vocal_style: vocalStyleSchema,
  music_instrumental_preferences: z.array(z.string()).default([]),
  must_include_items: z.array(z.string()).default([]),
  topics_to_avoid: z.array(z.string()).default([]),
  deadline_hours: z.number().min(24).max(168).default(72),
});

export const updateProjectSchema = createProjectSchema.partial();

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;

export const GENRE_OPTIONS = [
  'Pop',
  'Rock',
  'Country',
  'R&B/Soul',
  'Folk/Acoustic',
  'Jazz',
  'Classical',
  'Electronic',
  'Hip-Hop',
  'Indie',
] as const;

export const TEMPO_OPTIONS = [
  { value: 'slow', label: 'Slow & Emotional' },
  { value: 'medium', label: 'Medium & Balanced' },
  { value: 'upbeat', label: 'Upbeat & Energetic' },
] as const;

export const INSTRUMENTAL_OPTIONS = [
  'Piano',
  'Acoustic Guitar',
  'Electric Guitar',
  'Strings',
  'Drums',
  'Bass',
  'Synthesizer',
  'Brass',
  'Woodwinds',
] as const;
