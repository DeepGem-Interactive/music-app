import { z } from 'zod';

export const quickModeAnswersSchema = z.object({
  admire: z.string().min(1, 'Please share something you admire').max(500),
  memory: z.string().min(1, 'Please share a memory').max(1000),
  quirk: z.string().min(1, 'Please share a phrase or quirk').max(500),
  wish: z.string().min(1, 'Please share your wish').max(500),
});

export const deepModeAnswersSchema = z.object({
  memory_funny: z.string().min(1, 'Please share a funny memory').max(1000),
  memory_tender: z.string().min(1, 'Please share a tender memory').max(1000),
  memory_defining: z.string().min(1, 'Please share a defining memory').max(1000),
  how_they_show_love: z.string().min(1, 'Please describe how they show love').max(1000),
  current_chapter: z.string().min(1, 'Please describe their current chapter').max(1000),
  what_matters_most: z.string().min(1, 'Please share what matters most to them').max(1000),
  voice_note_transcript: z.string().optional(),
});

export const submissionModeSchema = z.enum(['quick', 'deep']);

export const submitContributionSchema = z.object({
  contributor_name: z.string().min(1, 'Your name is required').max(100),
  submission_mode: submissionModeSchema,
  answers: z.union([quickModeAnswersSchema, deepModeAnswersSchema]),
  voice_note_urls: z.array(z.string().url()).optional().default([]),
});

export type QuickModeAnswersInput = z.infer<typeof quickModeAnswersSchema>;
export type DeepModeAnswersInput = z.infer<typeof deepModeAnswersSchema>;
export type SubmitContributionInput = z.infer<typeof submitContributionSchema>;

export const QUICK_MODE_QUESTIONS = [
  {
    id: 'admire',
    label: 'One thing you admire about them',
    placeholder: 'Their patience, their laugh, their dedication...',
    maxLength: 500,
  },
  {
    id: 'memory',
    label: 'One vivid memory (include a place and moment)',
    placeholder: 'That time at the beach when...',
    maxLength: 1000,
  },
  {
    id: 'quirk',
    label: 'A phrase, quirk, or inside joke',
    placeholder: 'They always say... or They have this habit of...',
    maxLength: 500,
  },
  {
    id: 'wish',
    label: 'One wish for their future',
    placeholder: 'I hope they always...',
    maxLength: 500,
  },
] as const;

export const DEEP_MODE_QUESTIONS = [
  {
    id: 'memory_funny',
    label: 'A funny memory',
    placeholder: 'A time that made everyone laugh...',
    maxLength: 1000,
  },
  {
    id: 'memory_tender',
    label: 'A tender memory',
    placeholder: 'A moment that touched your heart...',
    maxLength: 1000,
  },
  {
    id: 'memory_defining',
    label: 'A defining memory',
    placeholder: 'A moment that captures who they really are...',
    maxLength: 1000,
  },
  {
    id: 'how_they_show_love',
    label: 'How do they show love?',
    placeholder: 'Through their actions, words, presence...',
    maxLength: 1000,
  },
  {
    id: 'current_chapter',
    label: 'What season or chapter are they in now?',
    placeholder: 'Starting a new adventure, finding peace, growing...',
    maxLength: 1000,
  },
  {
    id: 'what_matters_most',
    label: 'Who or what matters most to them?',
    placeholder: 'Their family, their passions, their friends...',
    maxLength: 1000,
  },
] as const;
