import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createInvitesSchema } from '@/lib/validations/invite';
import { generateToken, getToneDescription } from '@/lib/utils';
import {
  sendSMS,
  sendEmail,
  buildInvitationSMS,
  buildInvitationEmail,
} from '@/lib/services/notifications';

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

    const { data: invites, error } = await supabase
      .from('invites')
      .select('*')
      .eq('project_id', projectId)
      .order('sent_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(invites);
  } catch (error) {
    console.error('Error fetching invites:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

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
    const validation = createInvitesSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation error', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { contacts } = validation.data;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const hostName = project.profiles?.full_name || project.profiles?.email || 'Someone';
    const toneDescription = getToneDescription(
      project.tone_heartfelt_funny,
      project.tone_intimate_anthem,
      project.tone_minimal_lyrical
    );

    const results = await Promise.all(
      contacts.map(async (contact) => {
        const token = generateToken();
        const link = `${appUrl}/contribute/${token}`;

        // Create invite record
        const { data: invite, error: insertError } = await supabase
          .from('invites')
          .insert({
            project_id: projectId,
            recipient_name: contact.name,
            recipient_contact: contact.contact,
            channel: contact.channel,
            token,
            status: 'pending',
          })
          .select()
          .single();

        if (insertError) {
          return { contact, success: false, error: insertError.message };
        }

        // Send notification
        let notificationResult;
        if (contact.channel === 'sms') {
          const message = buildInvitationSMS({
            hostName,
            honoreeName: project.honoree_name,
            link,
            deadline: project.deadline_timestamp,
          });
          notificationResult = await sendSMS({ to: contact.contact, message });
        } else {
          const emailContent = buildInvitationEmail({
            hostName,
            honoreeName: project.honoree_name,
            honoreeRelationship: project.honoree_relationship,
            occasion: project.occasion,
            toneDescription,
            link,
            deadline: project.deadline_timestamp,
            honoreePhotoUrl: project.honoree_photo_url,
          });
          notificationResult = await sendEmail({
            to: contact.contact,
            subject: emailContent.subject,
            html: emailContent.html,
            text: emailContent.text,
          });
        }

        // Update invite status
        if (notificationResult.success) {
          await supabase
            .from('invites')
            .update({ status: 'sent', sent_at: new Date().toISOString() })
            .eq('id', invite.id);
        }

        return {
          invite,
          success: notificationResult.success,
          error: notificationResult.error,
        };
      })
    );

    // Update project status to collecting if it was draft
    if (project.status === 'draft') {
      await supabase
        .from('projects')
        .update({ status: 'collecting' })
        .eq('id', projectId);
    }

    return NextResponse.json(results, { status: 201 });
  } catch (error) {
    console.error('Error creating invites:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
