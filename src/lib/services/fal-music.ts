// fal.ai MiniMax Music API service
// Documentation: https://fal.ai/models/fal-ai/minimax-music/v2/api

import OpenAI from 'openai';

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

interface GenerateLyricsParams {
  honoreeName: string;
  occasion: string;
  relationship: string;
  honoreeDescription?: string | null;
  toneHeartfeltFunny: number;
  toneIntimateAnthem: number;
  toneMinimalLyrical: number;
  submissions: Array<{
    answers: Record<string, string>;
    mustIncludeLines?: string[];
  }>;
  mustIncludeItems: string[];
  topicsToAvoid: string[];
  previousLyrics?: string;
  iterationFeedback?: string;
}

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

function extractSubmissionContent(submissions: GenerateLyricsParams['submissions'], mustIncludeItems: string[]) {
  const memories: string[] = [];
  const traits: string[] = [];
  const quirks: string[] = [];
  const wishes: string[] = [];
  const mustInclude: string[] = [...mustIncludeItems];

  for (const submission of submissions) {
    const answers = submission.answers;
    if (answers.admire) traits.push(answers.admire);
    if (answers.memory) memories.push(answers.memory);
    if (answers.quirk) quirks.push(answers.quirk);
    if (answers.wish) wishes.push(answers.wish);
    if (answers.memory_funny) memories.push(answers.memory_funny);
    if (answers.memory_tender) memories.push(answers.memory_tender);
    if (answers.memory_defining) memories.push(answers.memory_defining);
    if (answers.how_they_show_love) traits.push(answers.how_they_show_love);
    if (answers.what_matters_most) traits.push(answers.what_matters_most);
    if (submission.mustIncludeLines) {
      mustInclude.push(...submission.mustIncludeLines);
    }
  }

  return { memories, traits, quirks, wishes, mustInclude };
}

function describeTone(params: GenerateLyricsParams): string {
  const parts: string[] = [];
  if (params.toneHeartfeltFunny <= 3) parts.push('deeply heartfelt and sincere');
  else if (params.toneHeartfeltFunny >= 7) parts.push('playful, funny, and lighthearted');
  else parts.push('warm with a mix of humor and sincerity');

  if (params.toneIntimateAnthem <= 3) parts.push('intimate and personal');
  else if (params.toneIntimateAnthem >= 7) parts.push('big and anthemic');
  else parts.push('balanced between personal and celebratory');

  if (params.toneMinimalLyrical <= 3) parts.push('minimal lyrics with lots of space');
  else if (params.toneMinimalLyrical >= 7) parts.push('rich and lyrical with detailed storytelling');
  else parts.push('moderate lyric density');

  return parts.join(', ');
}

export async function generateLyrics(params: GenerateLyricsParams): Promise<string> {
  const openrouter = getOpenRouterClient();
  if (!openrouter) {
    console.warn('OPENROUTER_API_KEY not set, using fallback template lyrics');
    return generateLyricsFallback(params);
  }

  const { memories, traits, quirks, wishes, mustInclude } = extractSubmissionContent(params.submissions, params.mustIncludeItems);
  const toneDescription = describeTone(params);

  // Build either a fresh generation prompt or a revision prompt
  let prompt: string;

  if (params.previousLyrics && params.iterationFeedback) {
    // Revision mode — edit existing lyrics based on feedback
    prompt = `You are an expert songwriter. A personalized song has been written for someone special, but the creator wants changes. Revise the lyrics based on their feedback.

CURRENT LYRICS:
${params.previousLyrics}

WHAT THEY WANT CHANGED:
"${params.iterationFeedback}"

CONTEXT:
- Song is for: ${params.honoreeName} (${params.relationship})
- Occasion: ${params.occasion}
${params.honoreeDescription ? `- Description: ${params.honoreeDescription}` : ''}

PERSONAL DETAILS (for reference if needed):
${memories.length > 0 ? `Memories: ${memories.map(m => `"${m}"`).join('; ')}` : ''}
${traits.length > 0 ? `What people admire: ${traits.map(t => `"${t}"`).join('; ')}` : ''}
${quirks.length > 0 ? `Unique traits/quirks: ${quirks.map(q => `"${q}"`).join('; ')}` : ''}
${wishes.length > 0 ? `Wishes for them: ${wishes.map(w => `"${w}"`).join('; ')}` : ''}

REQUIREMENTS:
- Apply the requested changes while keeping what already works
- Maintain the same song structure with section markers ([Verse 1], [Chorus], etc.)
- Keep lines short enough to sing (under 12 words per line)
- Keep total lyrics under 2800 characters
- NEVER include stage directions, mood annotations, or performance notes like (soft), (whispered), (building), (whimsical), etc. — every word in the output will be sung literally by the AI vocalist
- Output ONLY the revised lyrics with section markers, nothing else`;
  } else {
    // Fresh generation
    prompt = `You are an expert songwriter who writes personalized songs for special occasions. Write song lyrics for a song dedicated to someone special.

ABOUT THE HONOREE:
- Name: ${params.honoreeName}
- Relationship to the person giving this gift: ${params.relationship}
- Occasion: ${params.occasion}
${params.honoreeDescription ? `- Description: ${params.honoreeDescription}` : ''}

TONE & STYLE:
${toneDescription}

PERSONAL DETAILS FROM CONTRIBUTORS:
${memories.length > 0 ? `Memories: ${memories.map(m => `"${m}"`).join('; ')}` : ''}
${traits.length > 0 ? `What people admire: ${traits.map(t => `"${t}"`).join('; ')}` : ''}
${quirks.length > 0 ? `Unique traits/quirks: ${quirks.map(q => `"${q}"`).join('; ')}` : ''}
${wishes.length > 0 ? `Wishes for them: ${wishes.map(w => `"${w}"`).join('; ')}` : ''}
${mustInclude.length > 0 ? `Must include these references: ${mustInclude.join(', ')}` : ''}
${params.topicsToAvoid.length > 0 ? `AVOID these topics: ${params.topicsToAvoid.join(', ')}` : ''}

REQUIREMENTS:
- Write lyrics for a ~3 minute song (2:30-3:30 duration)
- Use section markers: [Intro], [Verse 1], [Pre-Chorus], [Chorus], [Verse 2], [Pre-Chorus], [Chorus], [Bridge], [Chorus], [Outro]
- The chorus should be catchy and repeatable — use the honoree's name naturally
- Transform the raw memories and details into poetic, singable lyrics — do NOT copy them verbatim
- Lines should be short enough to sing (under 12 words per line)
- Use rhyme and rhythm that feel natural, not forced
- Weave in specific personal details so the song feels unique to this person
- Keep total lyrics under 2800 characters
- NEVER include stage directions, mood annotations, or performance notes like (soft), (whispered), (building), (whimsical), etc. — every word in the output will be sung literally by the AI vocalist, so only write words meant to be sung
- Output ONLY the lyrics with section markers, nothing else — no commentary or explanation`;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    const response = await openrouter.chat.completions.create({
      model: 'anthropic/claude-haiku-4.5',
      max_tokens: 1500,
      messages: [
        { role: 'user', content: prompt },
      ],
    }, { signal: controller.signal }).finally(() => clearTimeout(timeout));

    let lyrics = response.choices[0]?.message?.content?.trim();
    if (!lyrics || lyrics.length < 50) {
      console.warn('AI lyrics too short or empty, using fallback');
      return generateLyricsFallback(params);
    }

    // Strip parenthetical stage directions that the vocalist would sing literally
    // e.g. (soft), (whispered), (building intensity), (whimsical)
    // Uses a blocklist approach to avoid stripping valid vocal content like (oh, oh, oh)
    const stageDirectionPattern = /\(\s*(?:soft|softly|whispered|whispering|gentle|gently|loud|loudly|building|building intensity|slowly|faster|spoken|speaking|quietly|with [\w\s]+|tender|tenderly|hushed|dramatic|dramatically|crescendo|fading|warmly|playful|playfully|whimsical|dreamy|soaring|upbeat|melancholy|joyful|bittersweet|reflective|triumphant|intimate|anthemic|fade out|repeat \d+ times?)\s*\)\s*/gi;
    lyrics = lyrics.replace(stageDirectionPattern, '').replace(/\n{3,}/g, '\n\n').trim();

    // Enforce fal.ai 3000 char limit
    if (lyrics.length > 3000) {
      return lyrics.substring(0, 2997) + '...';
    }

    return lyrics;
  } catch (error) {
    console.error('AI lyrics generation error:', error);
    return generateLyricsFallback(params);
  }
}

function generateLyricsFallback(params: GenerateLyricsParams): string {
  const { memories, traits, quirks, wishes, mustInclude } = extractSubmissionContent(params.submissions, params.mustIncludeItems);

  const cleanLine = (text: string, maxLen: number = 60): string => {
    let clean = text.replace(/[\r\n]+/g, ' ').trim();
    if (clean.length > maxLen) {
      clean = clean.substring(0, maxLen - 3) + '...';
    }
    return clean;
  };

  let lyrics = '';
  lyrics += `[Intro]\nLa la la, la la la\nHere we go\n`;
  lyrics += `\n[Verse 1]\n`;
  if (memories.length > 0) lyrics += `${cleanLine(memories[0], 80)}\n`;
  if (traits.length > 0) lyrics += `${cleanLine(traits[0], 60)}\n`;
  if (quirks.length > 0) lyrics += `${cleanLine(quirks[0], 60)}\n`;
  lyrics += `Every moment with you is a treasure\nEvery memory we hold so dear\n`;
  lyrics += `\n[Pre-Chorus]\nAnd now we gather here today\nTo show you in every way\n`;
  lyrics += `\n[Chorus]\n${params.honoreeName}, this one's for you\nOn your ${params.occasion}\nWe celebrate everything you do\n${params.honoreeName}, we love you\n`;
  lyrics += `\n[Verse 2]\n`;
  if (memories.length > 1) lyrics += `${cleanLine(memories[1], 80)}\n`;
  else if (memories.length > 0) lyrics += `${cleanLine(memories[0], 60)}\n`;
  if (traits.length > 1) lyrics += `${cleanLine(traits[1], 60)}\n`;
  else if (traits.length > 0) lyrics += `${cleanLine(traits[0], 60)}\n`;
  if (quirks.length > 1) lyrics += `${cleanLine(quirks[1], 60)}\n`;
  if (mustInclude.length > 0) lyrics += `${cleanLine(mustInclude[0], 60)}\n`;
  lyrics += `You light up every room you enter\n`;
  lyrics += `\n[Pre-Chorus]\nAnd now we gather here today\nTo show you in every way\n`;
  lyrics += `\n[Chorus]\n${params.honoreeName}, this one's for you\nOn your ${params.occasion}\nWe celebrate everything you do\n${params.honoreeName}, we love you\n`;
  lyrics += `\n[Bridge]\n`;
  if (wishes.length > 0) lyrics += `${cleanLine(wishes[0], 80)}\n`;
  if (wishes.length > 1) lyrics += `${cleanLine(wishes[1], 60)}\n`;
  lyrics += `Here's to all the years ahead\nHere's to all the love we share\n`;
  lyrics += `\n[Chorus]\n${params.honoreeName}, this one's for you\nOn your ${params.occasion}\nWe celebrate everything you do\n${params.honoreeName}, we love you\n`;
  lyrics += `\n[Outro]\n${params.honoreeName}\nWe love you\nLa la la, la la la\n`;

  return lyrics;
}
