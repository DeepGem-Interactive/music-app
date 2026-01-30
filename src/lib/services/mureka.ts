// Mureka API service for AI music generation
// API documentation: https://api.mureka.ai

const MUREKA_API_BASE = 'https://api.mureka.ai/v1';

// Target song duration in seconds (3.5 minutes = 210 seconds)
// This ensures we generate full-length songs (3-4 minutes) instead of short clips (90 seconds)
const TARGET_SONG_DURATION_SECONDS = 210;

interface GenerateSongParams {
  stylePrompt: string;
  lyrics: string;
  instrumentalTags?: string[];
}

interface SongGenerationResult {
  jobId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  audioUrl?: string;
  songs?: Array<{
    id: string;
    audioUrl: string;
    duration: number;
  }>;
  error?: string;
}

interface MurekaGenerateResponse {
  id: string;
  created_at: number;
  model: string;
  status: string;
}

interface MurekaQueryResponse {
  task_id: string;
  status: 'pending' | 'running' | 'success' | 'failed';
  songs?: Array<{
    song_id: string;
    audio_url: string;
    duration: number;
    title?: string;
  }>;
  error_message?: string;
}

interface MurekaLyricsResponse {
  lyrics: string;
  title?: string;
}

function getMurekaApiKey(): string {
  const apiKey = process.env.MUREKA_API_KEY;
  if (!apiKey) {
    throw new Error('MUREKA_API_KEY environment variable is not set');
  }
  return apiKey;
}

export async function generateSong(params: GenerateSongParams): Promise<{ jobId: string }> {
  const apiKey = getMurekaApiKey();

  // Build the prompt for Mureka
  const prompt = params.stylePrompt;

  // Request body with duration parameter for 3-4 minute songs
  // Most music generation APIs support 'duration' or 'length' parameters
  const requestBody: Record<string, unknown> = {
    prompt,
    lyrics: params.lyrics,
    model: 'auto', // Required field - uses latest model
    // Duration in seconds - targeting 3-4 minute songs (180-240 seconds)
    duration: TARGET_SONG_DURATION_SECONDS,
    // Some APIs use 'extend' or 'clip_duration' instead
    // If Mureka API uses different parameter names, adjust accordingly
    extend: true, // Request extended/full-length song
  };

  const response = await fetch(`${MUREKA_API_BASE}/song/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error('Mureka API error:', response.status, errorData);

    // Handle specific error codes with user-friendly messages
    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After');
      const waitTime = retryAfter ? ` Please wait ${retryAfter} seconds.` : ' Please wait a moment and try again.';
      throw new Error(`Rate limit exceeded.${waitTime} You may need to add credits to your Mureka account.`);
    }
    if (response.status === 401 || response.status === 403) {
      throw new Error('Invalid Mureka API key. Please check your configuration.');
    }
    if (response.status === 402) {
      throw new Error('Insufficient credits. Please add credits to your Mureka account.');
    }

    throw new Error(errorData.message || errorData.error || `Music generation failed (${response.status})`);
  }

  const data: MurekaGenerateResponse = await response.json();

  return { jobId: data.id };
}

export async function getJobStatus(jobId: string): Promise<SongGenerationResult | null> {
  const apiKey = getMurekaApiKey();

  const response = await fetch(`${MUREKA_API_BASE}/song/query/${jobId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
    },
  });

  if (!response.ok) {
    if (response.status === 404) {
      return null;
    }
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Mureka API error: ${response.status}`);
  }

  const data: MurekaQueryResponse = await response.json();

  // Map Mureka status to our status format
  let status: SongGenerationResult['status'];
  switch (data.status) {
    case 'pending':
      status = 'queued';
      break;
    case 'running':
      status = 'processing';
      break;
    case 'success':
      status = 'completed';
      break;
    case 'failed':
      status = 'failed';
      break;
    default:
      status = 'processing';
  }

  const result: SongGenerationResult = {
    jobId,
    status,
  };

  if (data.songs && data.songs.length > 0) {
    result.audioUrl = data.songs[0].audio_url;
    result.songs = data.songs.map(song => ({
      id: song.song_id,
      audioUrl: song.audio_url,
      duration: song.duration,
    }));
  }

  if (data.error_message) {
    result.error = data.error_message;
  }

  return result;
}

export function buildStylePrompt(params: {
  genres: string[];
  tempo: string;
  vocalStyle: string;
  instrumentals: string[];
  toneHeartfeltFunny: number;
  toneIntimateAnthem: number;
  toneMinimalLyrical: number;
}): string {
  const parts: string[] = [];

  // Genres
  if (params.genres.length > 0) {
    parts.push(params.genres.join(', '));
  }

  // Tempo
  switch (params.tempo) {
    case 'slow':
      parts.push('slow tempo, emotional ballad');
      break;
    case 'medium':
      parts.push('medium tempo, steady rhythm');
      break;
    case 'upbeat':
      parts.push('upbeat, energetic tempo');
      break;
  }

  // Vocal style
  switch (params.vocalStyle) {
    case 'male':
      parts.push('male vocals');
      break;
    case 'female':
      parts.push('female vocals');
      break;
    case 'choir':
      parts.push('choir vocals, harmonies');
      break;
  }

  // Instruments
  if (params.instrumentals.length > 0) {
    parts.push(`featuring ${params.instrumentals.join(', ')}`);
  }

  // Tone modifiers
  if (params.toneHeartfeltFunny <= 3) {
    parts.push('heartfelt, sincere');
  } else if (params.toneHeartfeltFunny >= 7) {
    parts.push('playful, lighthearted');
  }

  if (params.toneIntimateAnthem <= 3) {
    parts.push('intimate, personal');
  } else if (params.toneIntimateAnthem >= 7) {
    parts.push('anthemic, powerful');
  }

  // Mureka supports longer prompts
  const prompt = parts.join(', ');

  return prompt;
}

export async function generateLyricsWithAI(params: {
  honoreeName: string;
  occasion: string;
  theme?: string;
  style?: string;
}): Promise<string> {
  const apiKey = getMurekaApiKey();

  const prompt = `Write song lyrics for ${params.honoreeName} on their ${params.occasion}. ${params.theme || ''} ${params.style || ''}`.trim();

  const response = await fetch(`${MUREKA_API_BASE}/lyrics/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      prompt,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Mureka lyrics API error: ${response.status}`);
  }

  const data: MurekaLyricsResponse = await response.json();
  return data.lyrics;
}

// Keep the local lyrics generation for cases where we want more control
export function generateLyrics(params: {
  honoreeName: string;
  occasion: string;
  submissions: Array<{
    answers: Record<string, string>;
    mustIncludeLines?: string[];
  }>;
  mustIncludeItems: string[];
  topicsToAvoid: string[];
  toneMinimalLyrical: number;
}): string {
  // Extract meaningful content from submissions
  const memories: string[] = [];
  const traits: string[] = [];
  const wishes: string[] = [];
  const mustInclude: string[] = [...params.mustIncludeItems];

  for (const submission of params.submissions) {
    const answers = submission.answers;

    // Quick mode answers
    if (answers.admire) traits.push(answers.admire);
    if (answers.memory) memories.push(answers.memory);
    if (answers.quirk) traits.push(answers.quirk);
    if (answers.wish) wishes.push(answers.wish);

    // Deep mode answers
    if (answers.memory_funny) memories.push(answers.memory_funny);
    if (answers.memory_tender) memories.push(answers.memory_tender);
    if (answers.memory_defining) memories.push(answers.memory_defining);
    if (answers.how_they_show_love) traits.push(answers.how_they_show_love);
    if (answers.what_matters_most) traits.push(answers.what_matters_most);

    if (submission.mustIncludeLines) {
      mustInclude.push(...submission.mustIncludeLines);
    }
  }

  // Build lyrics structure
  const isMinimal = params.toneMinimalLyrical <= 4;

  let lyrics = `[Verse 1]\n`;

  if (memories.length > 0) {
    // Use the first memory, keeping it specific
    const memory = memories[0].substring(0, 200);
    lyrics += `${memory}\n`;
  }

  if (traits.length > 0) {
    lyrics += `${traits[0].substring(0, 100)}\n`;
  }

  lyrics += `\n[Chorus]\n`;
  lyrics += `This is for you, ${params.honoreeName}\n`;

  if (!isMinimal && mustInclude.length > 0) {
    lyrics += `${mustInclude[0]}\n`;
  }

  lyrics += `On this ${params.occasion}\n`;
  lyrics += `We celebrate you\n`;

  if (memories.length > 1 || traits.length > 1) {
    lyrics += `\n[Verse 2]\n`;
    if (memories.length > 1) {
      lyrics += `${memories[1].substring(0, 200)}\n`;
    }
    if (traits.length > 1) {
      lyrics += `${traits[1].substring(0, 100)}\n`;
    }
  }

  lyrics += `\n[Chorus]\n`;
  lyrics += `This is for you, ${params.honoreeName}\n`;
  lyrics += `On this ${params.occasion}\n`;
  lyrics += `We celebrate you\n`;

  if (wishes.length > 0) {
    lyrics += `\n[Bridge]\n`;
    lyrics += `${wishes[0].substring(0, 150)}\n`;
  }

  lyrics += `\n[Outro]\n`;
  lyrics += `${params.honoreeName}, we love you\n`;

  return lyrics;
}
