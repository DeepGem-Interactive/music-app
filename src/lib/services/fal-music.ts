// fal.ai MiniMax Music API service
// Documentation: https://fal.ai/models/fal-ai/minimax-music/v2/api

// Submission endpoint includes version, status endpoint does not
const FAL_QUEUE_SUBMIT = 'https://queue.fal.run/fal-ai/minimax-music/v2';
const FAL_QUEUE_STATUS = 'https://queue.fal.run/fal-ai/minimax-music';

interface GenerateSongParams {
  stylePrompt: string;
  lyrics: string;
  instrumentalTags?: string[];
}

interface SongGenerationResult {
  jobId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  audioUrl?: string;
  error?: string;
}

interface FalMusicResponse {
  audio: {
    url: string;
    content_type: string;
    file_name: string;
    file_size: number;
  };
}

interface FalQueueResponse {
  request_id: string;
  status: 'IN_QUEUE' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  response_url?: string;
}

interface FalStatusResponse {
  status: 'IN_QUEUE' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  response?: FalMusicResponse;
  error?: string;
}

function getFalApiKey(): string {
  const apiKey = process.env.FAL_KEY;
  if (!apiKey) {
    throw new Error('FAL_KEY environment variable is not set');
  }
  return apiKey;
}

export async function generateSong(params: GenerateSongParams): Promise<{ jobId: string }> {
  const apiKey = getFalApiKey();

  // Build the style prompt (10-300 chars)
  let prompt = params.stylePrompt;
  if (prompt.length > 300) {
    prompt = prompt.substring(0, 297) + '...';
  }
  if (prompt.length < 10) {
    prompt = prompt + ', professional quality music';
  }

  // Build lyrics prompt (10-3000 chars)
  let lyricsPrompt = params.lyrics;
  if (lyricsPrompt.length > 3000) {
    lyricsPrompt = lyricsPrompt.substring(0, 2997) + '...';
  }
  if (lyricsPrompt.length < 10) {
    lyricsPrompt = lyricsPrompt + '\n[Outro]\nThank you';
  }

  // Use queue endpoint for async processing
  const response = await fetch(FAL_QUEUE_SUBMIT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Key ${apiKey}`,
    },
    body: JSON.stringify({
      prompt,
      lyrics_prompt: lyricsPrompt,
      audio_setting: {
        sample_rate: 44100,
        bitrate: 256000,
        format: 'mp3',
      },
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error('fal.ai API error:', response.status, errorData);

    if (response.status === 401 || response.status === 403) {
      throw new Error('Invalid fal.ai API key. Please check your FAL_KEY configuration.');
    }
    if (response.status === 402) {
      throw new Error('Insufficient credits. Please add credits to your fal.ai account.');
    }
    if (response.status === 429) {
      throw new Error('Rate limit exceeded. Please wait a moment and try again.');
    }

    throw new Error(errorData.detail || errorData.message || `Music generation failed (${response.status})`);
  }

  const data: FalQueueResponse = await response.json();

  return { jobId: data.request_id };
}

export async function getJobStatus(jobId: string): Promise<SongGenerationResult | null> {
  const apiKey = getFalApiKey();

  // First check the status endpoint
  const statusResponse = await fetch(`${FAL_QUEUE_STATUS}/requests/${jobId}/status`, {
    method: 'GET',
    headers: {
      'Authorization': `Key ${apiKey}`,
    },
  });

  if (!statusResponse.ok) {
    if (statusResponse.status === 404) {
      return null;
    }
    const errorData = await statusResponse.json().catch(() => ({}));
    throw new Error(errorData.detail || `fal.ai API error: ${statusResponse.status}`);
  }

  const statusData = await statusResponse.json();

  // Map fal.ai status to our status format
  let status: SongGenerationResult['status'];
  switch (statusData.status) {
    case 'IN_QUEUE':
      status = 'queued';
      break;
    case 'IN_PROGRESS':
      status = 'processing';
      break;
    case 'COMPLETED':
      status = 'completed';
      break;
    case 'FAILED':
      status = 'failed';
      break;
    default:
      status = 'processing';
  }

  const result: SongGenerationResult = {
    jobId,
    status,
  };

  // If completed, fetch the actual result from the response URL
  if (status === 'completed' && statusData.response_url) {
    const resultResponse = await fetch(statusData.response_url, {
      method: 'GET',
      headers: {
        'Authorization': `Key ${apiKey}`,
      },
    });

    if (resultResponse.ok) {
      const resultData: FalMusicResponse = await resultResponse.json();
      if (resultData.audio?.url) {
        result.audioUrl = resultData.audio.url;
      }
    }
  }

  if (statusData.error) {
    result.error = statusData.error;
  }

  return result;
}

interface MusicStyleInference {
  genres: string[];
  mood: string;
  suggestedInstruments: string[];
  tempoHint: 'slow' | 'medium' | 'upbeat';
  styleKeywords: string[];
}

export function buildStylePrompt(params: {
  genres: string[];
  tempo: string;
  vocalStyle: string;
  instrumentals: string[];
  toneHeartfeltFunny: number;
  toneIntimateAnthem: number;
  toneMinimalLyrical: number;
  // New: use AI-inferred style if available
  inferredStyle?: MusicStyleInference | null;
}): string {
  // Style prompt must be SOUND-FIRST, not story-first
  // Template: Genre + mood + tempo, Drum feel + bass style, Harmony palette,
  // Vocal style, Structure & length, Avoid list
  const parts: string[] = [];

  // Use inferred style if available, otherwise fall back to legacy fields
  const genres = params.inferredStyle?.genres ?? params.genres;
  const instrumentals = params.inferredStyle?.suggestedInstruments ?? params.instrumentals;
  const styleKeywords = params.inferredStyle?.styleKeywords ?? [];
  const mood = params.inferredStyle?.mood;

  // 1. Genre + mood
  if (genres.length > 0) {
    parts.push(genres.join(', '));
  }

  // Add mood from inference if available
  if (mood) {
    parts.push(`${mood} mood`);
  }

  // Add style keywords from inference
  if (styleKeywords.length > 0) {
    parts.push(styleKeywords.slice(0, 3).join(', '));
  }

  // 2. Tempo with BPM range
  // Prefer manual selection, but use inference hint as fallback
  const tempo = params.tempo || params.inferredStyle?.tempoHint || 'medium';
  switch (tempo) {
    case 'slow':
      parts.push('60-80 BPM, slow ballad feel, spacious arrangement');
      break;
    case 'medium':
      parts.push('90-110 BPM, steady groove, relaxed pocket');
      break;
    case 'upbeat':
      parts.push('120-140 BPM, driving energy, uplifting feel');
      break;
  }

  // 3. Drum feel + bass style based on genre
  const isMinimal = params.toneMinimalLyrical <= 4;
  if (isMinimal) {
    parts.push('minimal drums, soft percussion, subtle bass');
  } else if (params.toneIntimateAnthem >= 7) {
    parts.push('powerful drums, driving bass, stadium sound');
  } else {
    parts.push('natural drum kit, warm bass, balanced mix');
  }

  // 4. Instrumentation
  if (instrumentals.length > 0) {
    parts.push(`featuring ${instrumentals.join(', ')}`);
  }

  // 5. Vocal style with texture
  switch (params.vocalStyle) {
    case 'male':
      parts.push('warm male vocals, natural delivery');
      break;
    case 'female':
      parts.push('clear female vocals, emotive delivery');
      break;
    case 'choir':
      parts.push('layered choir harmonies, group vocals on chorus');
      break;
  }

  // 6. Mood/tone modifiers
  if (params.toneHeartfeltFunny <= 3) {
    parts.push('sincere emotional delivery, heartfelt');
  } else if (params.toneHeartfeltFunny >= 7) {
    parts.push('playful delivery, lighthearted energy');
  }

  if (params.toneIntimateAnthem <= 3) {
    parts.push('intimate acoustic feel, personal');
  } else if (params.toneIntimateAnthem >= 7) {
    parts.push('anthemic build, powerful dynamics');
  }

  // 7. Structure hints
  if (isMinimal) {
    parts.push('2:30-3:30 duration, spacious arrangement');
  } else {
    parts.push('2:30-3:30 duration, full arrangement with intro and outro fade');
  }

  // 8. Avoid list
  parts.push('avoid abrupt ending, avoid mumbling, clear pronunciation');

  // Keep within 300 char limit for fal.ai
  let prompt = parts.join(', ');
  if (prompt.length > 300) {
    prompt = prompt.substring(0, 297) + '...';
  }

  return prompt;
}

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
  // Goal: 3 sensory details, 2 signature behaviors, specific memories
  const memories: string[] = [];
  const traits: string[] = [];
  const quirks: string[] = [];
  const wishes: string[] = [];
  const mustInclude: string[] = [...params.mustIncludeItems];

  for (const submission of params.submissions) {
    const answers = submission.answers;

    // Quick mode answers
    if (answers.admire) traits.push(answers.admire);
    if (answers.memory) memories.push(answers.memory);
    if (answers.quirk) quirks.push(answers.quirk);
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

  // Density control: Minimal (6-12 lines), Medium (standard), Dense (more bars)
  const isMinimal = params.toneMinimalLyrical <= 3;
  const isDense = params.toneMinimalLyrical >= 8;

  // Helper to truncate and clean text for lyrics
  const cleanLine = (text: string, maxLen: number = 60): string => {
    // Remove line breaks, trim, and truncate
    let clean = text.replace(/[\r\n]+/g, ' ').trim();
    if (clean.length > maxLen) {
      clean = clean.substring(0, maxLen - 3) + '...';
    }
    return clean;
  };

  // Build proper song structure for ~3 minute duration
  // More sections = longer song. Target: Intro, Verse 1, Pre-Chorus, Chorus,
  // Verse 2, Pre-Chorus, Chorus, Bridge, Instrumental, Final Chorus x2, Outro
  let lyrics = '';

  // [Intro] - 8 bars instrumental
  lyrics += `[Intro]\n`;
  lyrics += `La la la, la la la\n`;
  lyrics += `Here we go\n`;

  // [Verse 1] - 16 bars, set the scene with specific details
  lyrics += `\n[Verse 1]\n`;
  if (memories.length > 0) {
    lyrics += `${cleanLine(memories[0], 80)}\n`;
  }
  if (traits.length > 0) {
    lyrics += `${cleanLine(traits[0], 60)}\n`;
  }
  if (quirks.length > 0) {
    lyrics += `${cleanLine(quirks[0], 60)}\n`;
  }
  // Add filler lines to extend verse
  lyrics += `Every moment with you is a treasure\n`;
  lyrics += `Every memory we hold so dear\n`;

  // [Pre-Chorus] - Build anticipation
  lyrics += `\n[Pre-Chorus]\n`;
  lyrics += `And now we gather here today\n`;
  lyrics += `To show you in every way\n`;

  // [Chorus] - 4 lines, memorable hook, repeatable
  lyrics += `\n[Chorus]\n`;
  lyrics += `${params.honoreeName}, this one's for you\n`;
  lyrics += `On your ${params.occasion}\n`;
  lyrics += `We celebrate everything you do\n`;
  lyrics += `${params.honoreeName}, we love you\n`;

  // [Verse 2] - More specific details
  lyrics += `\n[Verse 2]\n`;
  if (memories.length > 1) {
    lyrics += `${cleanLine(memories[1], 80)}\n`;
  } else if (memories.length > 0) {
    lyrics += `${cleanLine(memories[0], 60)}\n`;
  }
  if (traits.length > 1) {
    lyrics += `${cleanLine(traits[1], 60)}\n`;
  } else if (traits.length > 0) {
    lyrics += `${cleanLine(traits[0], 60)}\n`;
  }
  if (quirks.length > 1) {
    lyrics += `${cleanLine(quirks[1], 60)}\n`;
  }
  if (mustInclude.length > 0) {
    lyrics += `${cleanLine(mustInclude[0], 60)}\n`;
  }
  lyrics += `You light up every room you enter\n`;

  // [Pre-Chorus] - Repeat
  lyrics += `\n[Pre-Chorus]\n`;
  lyrics += `And now we gather here today\n`;
  lyrics += `To show you in every way\n`;

  // [Chorus] - Repeat
  lyrics += `\n[Chorus]\n`;
  lyrics += `${params.honoreeName}, this one's for you\n`;
  lyrics += `On your ${params.occasion}\n`;
  lyrics += `We celebrate everything you do\n`;
  lyrics += `${params.honoreeName}, we love you\n`;

  // [Bridge] - Emotional shift, wish/vow for future
  lyrics += `\n[Bridge]\n`;
  if (wishes.length > 0) {
    lyrics += `${cleanLine(wishes[0], 80)}\n`;
  }
  if (wishes.length > 1) {
    lyrics += `${cleanLine(wishes[1], 60)}\n`;
  }
  lyrics += `Here's to all the years ahead\n`;
  lyrics += `Here's to all the love we share\n`;

  // [Instrumental Break] - 8-16 bars
  lyrics += `\n[Instrumental]\n`;
  lyrics += `Oh oh oh, oh oh oh\n`;
  lyrics += `Yeah yeah yeah\n`;

  // [Chorus] - Build energy
  lyrics += `\n[Chorus]\n`;
  lyrics += `${params.honoreeName}, this one's for you\n`;
  lyrics += `On your ${params.occasion}\n`;
  lyrics += `We celebrate everything you do\n`;
  lyrics += `${params.honoreeName}, we love you\n`;

  // [Final Chorus] - Lift with harmonies, extended
  lyrics += `\n[Chorus]\n`;
  lyrics += `${params.honoreeName}, this one's for you\n`;
  lyrics += `This one's for you\n`;
  lyrics += `On your ${params.occasion}\n`;
  lyrics += `We celebrate everything you do\n`;
  lyrics += `Everything you do\n`;
  lyrics += `${params.honoreeName}, we love you\n`;
  lyrics += `We love you so much\n`;

  // [Outro] - Fade with repeated hook
  lyrics += `\n[Outro]\n`;
  lyrics += `${params.honoreeName}\n`;
  lyrics += `We love you\n`;
  lyrics += `${params.honoreeName}\n`;
  lyrics += `La la la, la la la\n`;

  return lyrics;
}
