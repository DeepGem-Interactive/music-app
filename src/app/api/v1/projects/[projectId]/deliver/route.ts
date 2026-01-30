import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendEmail, buildCompletionEmail } from '@/lib/services/notifications';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ projectId: string }> }
) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { projectId } = await context.params;

    // Get the project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .eq('host_user_id', user.id)
      .single();

    if (projectError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Ensure project is completed
    if (project.status !== 'completed') {
      return NextResponse.json(
        { error: 'Project must be completed before delivery' },
        { status: 400 }
      );
    }

    // Get the latest song version
    const { data: songVersion, error: songError } = await supabase
      .from('song_versions')
      .select('*')
      .eq('project_id', projectId)
      .eq('status', 'completed')
      .order('version_number', { ascending: false })
      .limit(1)
      .single();

    if (songError || !songVersion) {
      return NextResponse.json(
        { error: 'No completed song found for this project' },
        { status: 404 }
      );
    }

    // Check if we have an audio file
    if (!songVersion.audio_wav_url && !songVersion.audio_mp3_url) {
      return NextResponse.json(
        { error: 'Song has no audio file available' },
        { status: 400 }
      );
    }

    // Get recipient email from request body (optional - defaults to host)
    const body = await request.json().catch(() => ({}));
    const recipientEmail = body.recipient_email || user.email;

    if (!recipientEmail) {
      return NextResponse.json(
        { error: 'No recipient email provided' },
        { status: 400 }
      );
    }

    // Build download URL (prefer WAV, fallback to MP3)
    const downloadUrl = songVersion.audio_wav_url || songVersion.audio_mp3_url;

    // Get all invites to send to contributors
    const { data: invites } = await supabase
      .from('invites')
      .select('recipient_contact, channel')
      .eq('project_id', projectId)
      .eq('channel', 'email')
      .eq('status', 'submitted');

    // Build email content
    const emailContent = buildCompletionEmail({
      honoreeName: project.honoree_name,
      downloadUrl,
    });

    // Send email to host
    const hostResult = await sendEmail({
      to: recipientEmail,
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text,
    });

    if (!hostResult.success) {
      return NextResponse.json(
        { error: hostResult.error || 'Failed to send email' },
        { status: 500 }
      );
    }

    // Send emails to contributors who submitted
    const contributorEmails: string[] = [];
    if (invites && invites.length > 0) {
      for (const invite of invites) {
        try {
          await sendEmail({
            to: invite.recipient_contact,
            subject: emailContent.subject,
            html: emailContent.html,
            text: emailContent.text,
          });
          contributorEmails.push(invite.recipient_contact);
        } catch (err) {
          console.error(`Failed to send email to ${invite.recipient_contact}:`, err);
          // Continue sending to other recipients
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Song delivered successfully',
      sent_to: {
        host: recipientEmail,
        contributors: contributorEmails,
      },
      download_url: downloadUrl,
    });
  } catch (error) {
    console.error('Error delivering song:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
