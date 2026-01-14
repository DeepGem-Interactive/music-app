import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { submitContributionSchema } from '@/lib/validations/contribution';
import { getToneDescription, isDeadlinePassed } from '@/lib/utils';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const supabase = await createClient();

    // Find invite by token
    const { data: invite, error: inviteError } = await supabase
      .from('invites')
      .select('*, projects!inner(*, profiles!inner(full_name))')
      .eq('token', token)
      .single();

    if (inviteError || !invite) {
      return NextResponse.json({ error: 'Invalid or expired link' }, { status: 404 });
    }

    const project = invite.projects as {
      id: string;
      honoree_name: string;
      honoree_relationship: string;
      occasion: string;
      tone_heartfelt_funny: number;
      tone_intimate_anthem: number;
      tone_minimal_lyrical: number;
      deadline_timestamp: string;
      profiles: { full_name: string };
    };

    // Check if deadline passed
    if (isDeadlinePassed(project.deadline_timestamp)) {
      return NextResponse.json({ error: 'Deadline has passed' }, { status: 410 });
    }

    // Update invite status to opened
    if (invite.status === 'sent') {
      await supabase
        .from('invites')
        .update({ status: 'opened', opened_at: new Date().toISOString() })
        .eq('id', invite.id);
    }

    // Check if already submitted
    const { data: existingSubmission } = await supabase
      .from('submissions')
      .select('*')
      .eq('invite_id', invite.id)
      .single();

    const toneDescription = getToneDescription(
      project.tone_heartfelt_funny,
      project.tone_intimate_anthem,
      project.tone_minimal_lyrical
    );

    return NextResponse.json({
      project_id: project.id,
      honoree_name: project.honoree_name,
      honoree_relationship: project.honoree_relationship,
      occasion: project.occasion,
      tone_description: toneDescription,
      deadline_timestamp: project.deadline_timestamp,
      host_name: project.profiles?.full_name || 'Someone',
      already_submitted: !!existingSubmission,
      previous_answers: existingSubmission?.answers_json,
    });
  } catch (error) {
    console.error('Error fetching contribution context:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const supabase = await createClient();

    // Find invite by token
    const { data: invite, error: inviteError } = await supabase
      .from('invites')
      .select('*, projects!inner(deadline_timestamp)')
      .eq('token', token)
      .single();

    if (inviteError || !invite) {
      return NextResponse.json({ error: 'Invalid or expired link' }, { status: 404 });
    }

    const project = invite.projects as { deadline_timestamp: string };

    // Check if deadline passed
    if (isDeadlinePassed(project.deadline_timestamp)) {
      return NextResponse.json({ error: 'Deadline has passed' }, { status: 410 });
    }

    const body = await request.json();
    const validation = submitContributionSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation error', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    // Check for existing submission
    const { data: existingSubmission } = await supabase
      .from('submissions')
      .select('id')
      .eq('invite_id', invite.id)
      .single();

    if (existingSubmission) {
      // Update existing submission
      const { data: submission, error } = await supabase
        .from('submissions')
        .update({
          contributor_name: validation.data.contributor_name,
          submission_mode: validation.data.submission_mode,
          answers_json: validation.data.answers,
          voice_note_urls: validation.data.voice_note_urls,
        })
        .eq('id', existingSubmission.id)
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json(submission);
    }

    // Create new submission
    const { data: submission, error } = await supabase
      .from('submissions')
      .insert({
        project_id: invite.project_id,
        invite_id: invite.id,
        contributor_name: validation.data.contributor_name,
        submission_mode: validation.data.submission_mode,
        answers_json: validation.data.answers,
        voice_note_urls: validation.data.voice_note_urls,
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Update invite status
    await supabase
      .from('invites')
      .update({ status: 'submitted', submitted_at: new Date().toISOString() })
      .eq('id', invite.id);

    return NextResponse.json(submission, { status: 201 });
  } catch (error) {
    console.error('Error submitting contribution:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
