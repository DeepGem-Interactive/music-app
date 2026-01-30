// AI Music Style Inference Service
// Uses OpenRouter to infer music style from song/artist references or vibe descriptions

import OpenAI from 'openai';
import type { MusicStyleInference } from '@/types';

// Check for API key at runtime
function getOpenRouterClient(): OpenAI | null {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey || apiKey.trim() === '') {
    return null;
  }
  return new OpenAI({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey,
  });
}

interface InferMusicStyleParams {
  mode: 'songs' | 'vibe';
  input: string;
  occasion?: string;
}

export async function inferMusicStyle(params: InferMusicStyleParams): Promise<MusicStyleInference> {
  const { mode, input, occasion } = params;

  // Get client at runtime - if no API key, return defaults
  const openrouter = getOpenRouterClient();
  if (!openrouter) {
    console.warn('OPENROUTER_API_KEY not set, using default music style');
    return getDefaultStyle(occasion);
  }

  const prompt = mode === 'songs'
    ? `You are a music expert. Given these song/artist references, infer the musical style.

References: "${input}"

Analyze these references and return a JSON object with:
- genres: array of 1-3 most relevant genres (from: Pop, Rock, Country, R&B/Soul, Folk/Acoustic, Jazz, Classical, Electronic, Hip-Hop, Indie)
- mood: single word or short phrase describing the overall mood (e.g., "uplifting", "romantic", "energetic", "nostalgic")
- suggestedInstruments: array of 2-4 instruments that fit this style
- tempoHint: one of "slow", "medium", or "upbeat" based on the typical tempo of these artists/songs
- styleKeywords: array of 3-5 keywords that describe the sound (e.g., "acoustic", "layered harmonies", "electronic beats")

Return ONLY valid JSON, no markdown or explanation.`
    : `You are a music expert. Given this vibe description, suggest an appropriate musical style.

Vibe description: "${input}"
${occasion ? `Occasion: ${occasion}` : ''}

Based on this description, return a JSON object with:
- genres: array of 1-3 most fitting genres (from: Pop, Rock, Country, R&B/Soul, Folk/Acoustic, Jazz, Classical, Electronic, Hip-Hop, Indie)
- mood: single word or short phrase capturing the described mood
- suggestedInstruments: array of 2-4 instruments that would create this vibe
- tempoHint: one of "slow", "medium", or "upbeat" based on the described energy
- styleKeywords: array of 3-5 keywords that describe the desired sound

Return ONLY valid JSON, no markdown or explanation.`;

  try {
    const response = await openrouter.chat.completions.create({
      model: 'anthropic/claude-3.5-haiku',
      max_tokens: 500,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const text = response.choices[0]?.message?.content || '';

    // Parse JSON from response (handle potential markdown wrapping)
    let jsonStr = text.trim();
    if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/```json?\n?/g, '').replace(/```$/g, '').trim();
    }

    const parsed = JSON.parse(jsonStr);

    // Validate and normalize the response
    return {
      genres: Array.isArray(parsed.genres) ? parsed.genres.slice(0, 3) : ['Pop'],
      mood: typeof parsed.mood === 'string' ? parsed.mood : 'uplifting',
      suggestedInstruments: Array.isArray(parsed.suggestedInstruments)
        ? parsed.suggestedInstruments.slice(0, 4)
        : ['Piano', 'Acoustic Guitar'],
      tempoHint: ['slow', 'medium', 'upbeat'].includes(parsed.tempoHint)
        ? parsed.tempoHint
        : 'medium',
      styleKeywords: Array.isArray(parsed.styleKeywords)
        ? parsed.styleKeywords.slice(0, 5)
        : ['warm', 'personal'],
    };
  } catch (error) {
    console.error('AI inference error:', error);
    // Return sensible defaults on error
    return getDefaultStyle(occasion);
  }
}

// Get default style based on occasion (for "surprise" mode or fallback)
export function getDefaultStyle(occasion?: string): MusicStyleInference {
  const occasionLower = (occasion || '').toLowerCase();

  if (occasionLower.includes('birthday')) {
    return {
      genres: ['Pop', 'R&B/Soul'],
      mood: 'celebratory',
      suggestedInstruments: ['Piano', 'Drums', 'Bass', 'Synthesizer'],
      tempoHint: 'upbeat',
      styleKeywords: ['upbeat', 'joyful', 'celebratory', 'feel-good'],
    };
  }

  if (occasionLower.includes('wedding') || occasionLower.includes('anniversary')) {
    return {
      genres: ['Pop', 'R&B/Soul'],
      mood: 'romantic',
      suggestedInstruments: ['Piano', 'Strings', 'Acoustic Guitar'],
      tempoHint: 'slow',
      styleKeywords: ['romantic', 'heartfelt', 'intimate', 'timeless'],
    };
  }

  if (occasionLower.includes('retirement') || occasionLower.includes('farewell')) {
    return {
      genres: ['Folk/Acoustic', 'Rock'],
      mood: 'nostalgic',
      suggestedInstruments: ['Acoustic Guitar', 'Piano', 'Harmonica'],
      tempoHint: 'medium',
      styleKeywords: ['reflective', 'nostalgic', 'warm', 'sincere'],
    };
  }

  if (occasionLower.includes('graduation')) {
    return {
      genres: ['Pop', 'Indie'],
      mood: 'hopeful',
      suggestedInstruments: ['Piano', 'Drums', 'Electric Guitar'],
      tempoHint: 'upbeat',
      styleKeywords: ['uplifting', 'inspiring', 'hopeful', 'energetic'],
    };
  }

  if (occasionLower.includes('memorial') || occasionLower.includes('tribute') || occasionLower.includes('remembrance')) {
    return {
      genres: ['Folk/Acoustic', 'Classical'],
      mood: 'tender',
      suggestedInstruments: ['Piano', 'Strings', 'Acoustic Guitar'],
      tempoHint: 'slow',
      styleKeywords: ['gentle', 'tender', 'emotional', 'reverent'],
    };
  }

  // Generic default for unknown occasions
  return {
    genres: ['Pop', 'Folk/Acoustic'],
    mood: 'heartfelt',
    suggestedInstruments: ['Piano', 'Acoustic Guitar', 'Strings'],
    tempoHint: 'medium',
    styleKeywords: ['warm', 'personal', 'heartfelt', 'sincere'],
  };
}
