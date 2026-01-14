import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateSong, buildStylePrompt, generateLyrics } from '@/lib/services/suno';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch project with all related data
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .eq('host_user_id', user.id)
      .single();

    if (projectError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Check revision limit
    const { count: versionCount } = await supabase
      .from('song_versions')
      .select('*', { count: 'exact', head: true })
      .eq('project_id', projectId);

    const { data: credits } = await supabase
      .from('revision_credits')
      .select('credits_purchased, credits_used')
      .eq('project_id', projectId);

    const purchasedCredits = credits?.reduce(
      (sum, c) => sum + (c.credits_purchased - c.credits_used),
      0
    ) || 0;

    const baseRevisions = 3;
    const usedRevisions = versionCount || 0;
    const revisionsRemaining = baseRevisions - usedRevisions + purchasedCredits;

    if (revisionsRemaining <= 0) {
      return NextResponse.json(
        { error: 'Revision limit exceeded. Purchase additional credits.' },
        { status: 403 }
      );
    }

    // Fetch submissions
    const { data: submissions } = await supabase
      .from('submissions')
      .select('*')
      .eq('project_id', projectId)
      .eq('status', 'approved');

    // Fetch curation
    const { data: curation } = await supabase
      .from('curations')
      .select('*')
      .eq('project_id', projectId)
      .single();

    // Parse iteration feedback from request body
    const body = await request.json().catch(() => ({}));
    const iterationFeedback = body.iteration_feedback;

    // Build style prompt
    const stylePrompt = buildStylePrompt({
      genres: project.music_genre_preferences || [],
      tempo: project.music_tempo_preference,
      vocalStyle: project.music_vocal_style,
      instrumentals: project.music_instrumental_preferences || [],
      toneHeartfeltFunny: project.tone_heartfelt_funny,
      toneIntimateAnthem: project.tone_intimate_anthem,
      toneMinimalLyrical: project.tone_minimal_lyrical,
    });

    // Generate lyrics
    const lyrics = generateLyrics({
      honoreeName: project.honoree_name,
      occasion: project.occasion,
      submissions: (submissions || []).map(s => ({
        answers: s.answers_json as Record<string, string>,
        mustIncludeLines: curation?.must_include_lines,
      })),
      mustIncludeItems: project.must_include_items || [],
      topicsToAvoid: project.topics_to_avoid || [],
      toneMinimalLyrical: project.tone_minimal_lyrical,
    });

    // Create song version record
    const newVersionNumber = (usedRevisions || 0) + 1;
    const songTitle = `For ${project.honoree_name} - ${project.occasion}`;

    const { data: songVersion, error: versionError } = await supabase
      .from('song_versions')
      .insert({
        project_id: projectId,
        version_number: newVersionNumber,
        title: songTitle,
        style_prompt: stylePrompt,
        lyrics,
        status: 'generating',
        generation_metadata: {
          iteration_feedback: iterationFeedback,
          submissions_count: submissions?.length || 0,
        },
      })
      .select()
      .single();

    if (versionError) {
      return NextResponse.json({ error: versionError.message }, { status: 500 });
    }

    // Start generation job
    const { jobId } = await generateSong({
      stylePrompt,
      lyrics,
      instrumentalTags: project.music_instrumental_preferences,
    });

    // Update project status
    await supabase
      .from('projects')
      .update({ status: 'generating' })
      .eq('id', projectId);

    // Log the generation
    await supabase.from('audit_logs').insert({
      project_id: projectId,
      user_id: user.id,
      action_type: 'song_generated',
      details: {
        version_number: newVersionNumber,
        job_id: jobId,
        iteration_feedback: iterationFeedback,
      },
    });

    return NextResponse.json({
      job_id: jobId,
      version_id: songVersion.id,
      version_number: newVersionNumber,
      title: songTitle,
      revisions_remaining: revisionsRemaining - 1,
    }, { status: 202 });
  } catch (error) {
    console.error('Error generating song:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
