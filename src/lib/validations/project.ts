import { z } from 'zod';

export const vocalStyleSchema = z.enum(['male', 'female', 'choir']);
export const creationModeSchema = z.enum(['collaborative', 'instant']);
export const musicInputModeSchema = z.enum(['songs', 'vibe', 'surprise']);

// Schema for instant memories (same as quick mode answers)
export const instantMemoriesSchema = z.object({
  admire: z.string().min(1, 'Please share what you admire about them'),
  memory: z.string().min(1, 'Please share a favorite memory'),
  quirk: z.string().min(1, 'Please share a unique trait'),
  wish: z.string().min(1, 'Please share your wish for them'),
});

// Schema for AI-inferred music style
export const musicStyleInferenceSchema = z.object({
  genres: z.array(z.string()),
  mood: z.string(),
  suggestedInstruments: z.array(z.string()),
  tempoHint: z.enum(['slow', 'medium', 'upbeat']),
  styleKeywords: z.array(z.string()),
});

// Schema for honoree personalization details
export const honoreeDetailsSchema = z.object({
  bestMemories: z.string().max(1000).default(''),
  importantPeople: z.string().max(1000).default(''),
  physicalDescription: z.string().max(500).default(''),
  energeticDescription: z.string().max(500).default(''),
  importantEvents: z.string().max(1000).default(''),
});

// Schema for collaborator invites
export const collaboratorSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email').optional(),
  phone: z.string().optional(),
}).refine(
  (data) => data.email || data.phone,
  {
    message: 'Either email or phone is required',
  }
);

// Base schema without refinements (for .partial())
const baseProjectSchema = z.object({
  creation_mode: creationModeSchema.default('collaborative'),
  honoree_name: z.string().min(1, 'Honoree name is required').max(100),
  honoree_relationship: z.string().min(1, 'Relationship is required').max(100),
  occasion: z.string().min(1, 'Occasion is required').max(200),
  personality_traits: z.array(z.string()).default([]), // NEW: Personality traits
  favorite_moments: z.string().max(1000).optional(), // NEW: Favorite moments
  tone_heartfelt_funny: z.number().min(1).max(10).default(5),
  tone_intimate_anthem: z.number().min(1).max(10).default(5),
  tone_minimal_lyrical: z.number().min(1).max(10).default(5),
  // New music input system
  music_input_mode: musicInputModeSchema.default('songs'),
  music_style_references: z.string().max(500).optional(), // Song/artist names or vibe description
  music_inferred_style: musicStyleInferenceSchema.optional(),
  // Legacy fields (for backward compatibility)
  music_genre_preferences: z.array(z.string()).default([]),
  music_tempo_preference: z.string().min(1, 'Tempo is required'),
  music_vocal_style: vocalStyleSchema,
  music_instrumental_preferences: z.array(z.string()).default([]),
  // Personalization
  honoree_details: honoreeDetailsSchema.optional(),
  must_include_items: z.array(z.string()).default([]),
  topics_to_avoid: z.array(z.string()).default([]),
  deadline_hours: z.number().min(24).max(168).default(72),
  // For instant mode - host provides memories directly
  instant_memories: instantMemoriesSchema.optional(),
  // For collaborative mode - list of collaborators to invite
  collaborators: z.array(collaboratorSchema).optional(),
});

// Full create schema with refinement for instant mode validation
export const createProjectSchema = baseProjectSchema.refine(
  (data) => {
    // If instant mode, require instant_memories
    if (data.creation_mode === 'instant') {
      return data.instant_memories !== undefined;
    }
    return true;
  },
  {
    message: 'Memories are required for instant song creation',
    path: ['instant_memories'],
  }
);

export const updateProjectSchema = baseProjectSchema.partial();

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;

export const TEMPO_OPTIONS = [
  { value: 'slow', label: 'Slow & Emotional' },
  { value: 'medium', label: 'Medium & Balanced' },
  { value: 'upbeat', label: 'Upbeat & Energetic' },
] as const;
