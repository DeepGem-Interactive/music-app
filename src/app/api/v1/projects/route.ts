import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createProjectSchema } from '@/lib/validations/project';
import { getDeadlineFromHours } from '@/lib/utils';

export async function GET() {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: projects, error } = await supabase
      .from('projects')
      .select('*')
      .eq('host_user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(projects);
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user profile for name
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, email')
      .eq('id', user.id)
      .single();

    const body = await request.json();
    const validation = createProjectSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation error', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const {
      deadline_hours,
      instant_memories,
      creation_mode,
      // Extract new fields that may not exist in DB yet
      music_input_mode,
      music_style_references,
      music_inferred_style,
      honoree_details,
      ...projectData
    } = validation.data;
    const isInstant = creation_mode === 'instant';

    // For instant mode, deadline is now (not needed)
    // For collaborative mode, calculate from hours
    const deadlineTimestamp = isInstant
      ? new Date().toISOString()
      : getDeadlineFromHours(deadline_hours);

    // Build insert data
    // NOTE: New columns (music_input_mode, music_style_references, music_inferred_style, honoree_details)
    // are excluded until migration is run. Run: supabase/migrations/002_add_music_input_mode.sql
    const insertData: Record<string, unknown> = {
      ...projectData,
      creation_mode,
      host_user_id: user.id,
      deadline_timestamp: deadlineTimestamp,
      status: isInstant ? 'curating' : 'draft',
    };

    // Create the project
    const { data: project, error } = await supabase
      .from('projects')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // For instant mode, create a submission from the host's memories
    if (isInstant && instant_memories) {
      const hostName = profile?.full_name || profile?.email || 'Host';

      const { error: submissionError } = await supabase
        .from('submissions')
        .insert({
          project_id: project.id,
          invite_id: null, // No invite for host submission
          contributor_name: hostName,
          submission_mode: 'quick',
          answers_json: instant_memories,
          voice_note_urls: [],
          flags: [],
          status: 'approved', // Auto-approve host's submission
        });

      if (submissionError) {
        console.error('Error creating instant submission:', submissionError);
        // Don't fail the whole request, project is created
      }
    }

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
