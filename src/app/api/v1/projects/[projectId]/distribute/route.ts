import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { distributeSong, generateExportPackage } from '@/lib/services/spotify';
import { z } from 'zod';

const distributeSchema = z.object({
  version_id: z.string().uuid(),
});

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

    // Fetch project with host info
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*, profiles!inner(full_name, email)')
      .eq('id', projectId)
      .eq('host_user_id', user.id)
      .single();

    if (projectError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const body = await request.json();
    const validation = distributeSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation error', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    // Fetch the song version
    const { data: version, error: versionError } = await supabase
      .from('song_versions')
      .select('*')
      .eq('id', validation.data.version_id)
      .eq('project_id', projectId)
      .eq('status', 'completed')
      .single();

    if (versionError || !version) {
      return NextResponse.json({ error: 'Song version not found or not completed' }, { status: 404 });
    }

    // Get all contributors
    const { data: submissions } = await supabase
      .from('submissions')
      .select('contributor_name')
      .eq('project_id', projectId)
      .eq('status', 'approved');

    const contributors = submissions?.map(s => s.contributor_name) || [];
    const artistName = project.profiles?.full_name || project.profiles?.email || 'Unknown Artist';

    // Start distribution
    const { distributionId } = await distributeSong({
      audioUrl: version.audio_wav_url || '',
      coverArtUrl: version.cover_art_url || '',
      title: version.title,
      artist: artistName,
      contributors,
      genre: project.music_genre_preferences?.[0] || 'Pop',
    });

    // Generate export package as fallback
    const exportPackage = generateExportPackage({
      audioWavUrl: version.audio_wav_url || '',
      audioMp3Url: version.audio_mp3_url || '',
      coverArtUrl: version.cover_art_url || '',
      title: version.title,
      artist: artistName,
      contributors,
      genre: project.music_genre_preferences?.[0] || 'Pop',
      lyrics: version.lyrics,
    });

    // Update project status
    await supabase
      .from('projects')
      .update({ status: 'completed' })
      .eq('id', projectId);

    return NextResponse.json({
      distribution_id: distributionId,
      export_package: exportPackage,
    }, { status: 202 });
  } catch (error) {
    console.error('Error distributing song:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
