import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const updateCurationSchema = z.object({
  must_include_lines: z.array(z.string()).optional(),
  exclusion_rules: z.array(z.string()).optional(),
  selected_submission_ids: z.array(z.string().uuid()).optional(),
});

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

    // Verify project ownership
    const { data: project } = await supabase
      .from('projects')
      .select('id')
      .eq('id', projectId)
      .eq('host_user_id', user.id)
      .single();

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const { data: curation, error } = await supabase
      .from('curations')
      .select('*')
      .eq('project_id', projectId)
      .single();

    if (error && error.code !== 'PGRST116') {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(curation || {
      project_id: projectId,
      must_include_lines: [],
      exclusion_rules: [],
      selected_submission_ids: [],
    });
  } catch (error) {
    console.error('Error fetching curation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
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

    // Verify project ownership
    const { data: project } = await supabase
      .from('projects')
      .select('id, status')
      .eq('id', projectId)
      .eq('host_user_id', user.id)
      .single();

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const body = await request.json();
    const validation = updateCurationSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation error', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    // Upsert curation
    const { data: curation, error } = await supabase
      .from('curations')
      .upsert({
        project_id: projectId,
        ...validation.data,
      }, {
        onConflict: 'project_id',
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Update project status to curating if it was collecting
    if (project.status === 'collecting') {
      await supabase
        .from('projects')
        .update({ status: 'curating' })
        .eq('id', projectId);
    }

    // Log the curation update
    await supabase.from('audit_logs').insert({
      project_id: projectId,
      user_id: user.id,
      action_type: 'line_highlighted',
      details: { updated_fields: Object.keys(validation.data) },
    });

    return NextResponse.json(curation);
  } catch (error) {
    console.error('Error updating curation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
