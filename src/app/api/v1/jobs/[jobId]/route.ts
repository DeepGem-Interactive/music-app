import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getJobStatus } from '@/lib/services/fal-music';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params;
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get job status from fal.ai
    const status = await getJobStatus(jobId);

    if (!status) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // If job is completed or failed, update the song_version record
    if (status.status === 'completed' || status.status === 'failed') {
      // Find the song version with this job ID
      const { data: version } = await supabase
        .from('song_versions')
        .select('id, project_id')
        .contains('generation_metadata', { job_id: jobId })
        .single();

      if (version) {
        if (status.status === 'completed' && status.audioUrl) {
          // Update version with the audio URL
          await supabase
            .from('song_versions')
            .update({
              status: 'completed',
              audio_mp3_url: status.audioUrl,
              generation_metadata: {
                job_id: jobId,
                completed_at: new Date().toISOString(),
                provider: 'fal-minimax',
              },
            })
            .eq('id', version.id);

          // Update project status
          await supabase
            .from('projects')
            .update({ status: 'completed' })
            .eq('id', version.project_id);
        } else if (status.status === 'failed') {
          // Update version with failure
          await supabase
            .from('song_versions')
            .update({
              status: 'failed',
              generation_metadata: {
                job_id: jobId,
                failed_at: new Date().toISOString(),
                error: status.error,
              },
            })
            .eq('id', version.id);

          // Revert project status to curating so they can try again
          await supabase
            .from('projects')
            .update({ status: 'curating' })
            .eq('id', version.project_id);
        }
      }
    }

    return NextResponse.json({
      job_id: jobId,
      status: status.status,
      audio_mp3_url: status.audioUrl,
      error: status.error,
    });
  } catch (error) {
    console.error('Error fetching job status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
