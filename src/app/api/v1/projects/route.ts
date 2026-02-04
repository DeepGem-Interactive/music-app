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
      collaborators,
      // Extract new fields that may not exist in DB yet
      music_input_mode,
      music_style_references,
      music_inferred_style,
      honoree_details,
      personality_traits,
      favorite_moments,
      honoree_description,
      ...projectData
    } = validation.data;
    const isInstant = creation_mode === 'instant';

    // For instant mode, deadline is now (not needed)
    // For collaborative mode, calculate from hours
    const deadlineTimestamp = isInstant
      ? new Date().toISOString()
      : getDeadlineFromHours(deadline_hours);

    // Build insert data - include new fields
    const insertData: Record<string, unknown> = {
      ...projectData,
      creation_mode,
      host_user_id: user.id,
      deadline_timestamp: deadlineTimestamp,
      status: isInstant ? 'curating' : 'draft',
      personality_traits: personality_traits || [],
      favorite_moments: favorite_moments || null,
      music_input_mode,
      music_style_references: music_style_references || null,
      music_inferred_style: music_inferred_style || null,
      honoree_details: honoree_details || null,
      honoree_description: honoree_description || null,
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

    // For collaborative mode (or instant with collaborators), create invites
    if (collaborators && collaborators.length > 0) {
      const crypto = await import('crypto');
      const invitesToCreate = collaborators.map((collab) => ({
        project_id: project.id,
        recipient_name: collab.name,
        recipient_contact: collab.email || collab.phone || '',
        channel: collab.email ? 'email' : 'sms',
        token: crypto.randomBytes(32).toString('hex'),
        status: 'pending',
      }));

      const { data: invites, error: invitesError } = await supabase
        .from('invites')
        .insert(invitesToCreate)
        .select();

      if (invitesError) {
        console.error('Error creating invites:', invitesError);
        // Don't fail the whole request
      } else {
        // TODO: Send invitation emails/SMS
        // This will be implemented in Feature #6 (Real Email/SMS Implementation)
        console.log(`Created ${invites?.length || 0} invites for project ${project.id}`);

        // Update project status to 'collecting' if we have invites
        if (!isInstant && invites && invites.length > 0) {
          const { data: updatedProject } = await supabase
            .from('projects')
            .update({ status: 'collecting' })
            .eq('id', project.id)
            .select()
            .single();

          // Return updated project with correct status
          if (updatedProject) {
            return NextResponse.json(updatedProject, { status: 201 });
          }
        }
      }
    }

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
