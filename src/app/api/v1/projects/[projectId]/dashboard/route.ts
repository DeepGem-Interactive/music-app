import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
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

    // Fetch project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .eq('host_user_id', user.id)
      .single();

    if (projectError) {
      if (projectError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Project not found' }, { status: 404 });
      }
      return NextResponse.json({ error: projectError.message }, { status: 500 });
    }

    // Fetch invites
    const { data: invites, error: invitesError } = await supabase
      .from('invites')
      .select('*')
      .eq('project_id', projectId);

    if (invitesError) {
      return NextResponse.json({ error: invitesError.message }, { status: 500 });
    }

    // Fetch submissions
    const { data: submissions, error: submissionsError } = await supabase
      .from('submissions')
      .select('*')
      .eq('project_id', projectId)
      .order('submitted_at', { ascending: false });

    if (submissionsError) {
      return NextResponse.json({ error: submissionsError.message }, { status: 500 });
    }

    // Fetch curation
    const { data: curation } = await supabase
      .from('curations')
      .select('*')
      .eq('project_id', projectId)
      .single();

    // Fetch latest song version
    const { data: latestVersion } = await supabase
      .from('song_versions')
      .select('*')
      .eq('project_id', projectId)
      .order('version_number', { ascending: false })
      .limit(1)
      .single();

    // Count versions for revision tracking
    const { count: versionCount } = await supabase
      .from('song_versions')
      .select('*', { count: 'exact', head: true })
      .eq('project_id', projectId);

    // Check for purchased credits
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
    const revisionsRemaining = Math.max(0, baseRevisions - usedRevisions + purchasedCredits);

    const invitesSent = invites?.filter(i => i.status !== 'pending').length || 0;

    return NextResponse.json({
      project,
      invites_sent: invitesSent,
      submissions_received: submissions?.length || 0,
      submissions: submissions || [],
      curation: curation || null,
      latest_version: latestVersion || null,
      revisions_remaining: revisionsRemaining,
    });
  } catch (error) {
    console.error('Error fetching dashboard:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
