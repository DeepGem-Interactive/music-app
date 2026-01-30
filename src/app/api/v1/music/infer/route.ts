import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { inferMusicStyle, getDefaultStyle } from '@/lib/services/ai-inference';

const inferRequestSchema = z.object({
  mode: z.enum(['songs', 'vibe', 'surprise']),
  input: z.string().max(500).optional(),
  occasion: z.string().max(200).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = inferRequestSchema.parse(body);

    // For "surprise" mode, return defaults based on occasion
    if (validated.mode === 'surprise') {
      const defaultStyle = getDefaultStyle(validated.occasion);
      return NextResponse.json({
        success: true,
        style: defaultStyle,
        source: 'default',
      });
    }

    // For songs/vibe modes, require input
    if (!validated.input || validated.input.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Input is required for songs and vibe modes' },
        { status: 400 }
      );
    }

    // Call AI to infer style
    const inferredStyle = await inferMusicStyle({
      mode: validated.mode,
      input: validated.input,
      occasion: validated.occasion,
    });

    return NextResponse.json({
      success: true,
      style: inferredStyle,
      source: 'ai',
    });
  } catch (error) {
    console.error('Music inference error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid request', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to infer music style' },
      { status: 500 }
    );
  }
}
