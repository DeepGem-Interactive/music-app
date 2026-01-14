// Mock Suno API service
// In production, replace with actual Suno API calls

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

// Simulated job storage (in production, this would be in a database)
const jobs = new Map<string, SongGenerationResult>();

export async function generateSong(params: GenerateSongParams): Promise<{ jobId: string }> {
  const jobId = `suno_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Validate style prompt length
  if (params.stylePrompt.length > 1000) {
    throw new Error('Style prompt must be 1000 characters or less');
  }

  // Store initial job status
  jobs.set(jobId, {
    jobId,
    status: 'queued',
  });

  // Simulate async processing
  setTimeout(() => {
    jobs.set(jobId, {
      jobId,
      status: 'processing',
    });

    // Simulate completion after 5-10 seconds
    const processingTime = 5000 + Math.random() * 5000;
    setTimeout(() => {
      // 90% success rate simulation
      if (Math.random() > 0.1) {
        jobs.set(jobId, {
          jobId,
          status: 'completed',
          audioUrl: `/api/mock/audio/${jobId}.mp3`,
        });
      } else {
        jobs.set(jobId, {
          jobId,
          status: 'failed',
          error: 'Generation failed. Please try again.',
        });
      }
    }, processingTime);
  }, 1000);

  return { jobId };
}

export async function getJobStatus(jobId: string): Promise<SongGenerationResult | null> {
  return jobs.get(jobId) || null;
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

  // Limit to 1000 characters
  let prompt = parts.join(', ');
  if (prompt.length > 1000) {
    prompt = prompt.substring(0, 997) + '...';
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
