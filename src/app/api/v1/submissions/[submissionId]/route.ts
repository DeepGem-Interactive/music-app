import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const updateSubmissionSchema = z.object({
  status: z.enum(['pending', 'approved', 'excluded']),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ submissionId: string }> }
) {
  try {
    const { submissionId } = await params;
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validation = updateSubmissionSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation error', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    // Verify submission exists and user owns the project
    const { data: submission, error: fetchError } = await supabase
      .from('submissions')
      .select('*, projects!inner(host_user_id)')
      .eq('id', submissionId)
      .single();

    if (fetchError || !submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }

    const project = submission.projects as { host_user_id: string };
    if (project.host_user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Update submission
    const { data: updatedSubmission, error } = await supabase
      .from('submissions')
      .update({ status: validation.data.status })
      .eq('id', submissionId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Log the action
    await supabase.from('audit_logs').insert({
      project_id: submission.project_id,
      user_id: user.id,
      action_type: validation.data.status === 'approved' ? 'submission_approved' : 'submission_flagged',
      details: { submission_id: submissionId },
    });

    return NextResponse.json(updatedSubmission);
  } catch (error) {
    console.error('Error updating submission:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
