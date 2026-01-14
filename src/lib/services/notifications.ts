// Mock notification services (Twilio SMS + SendGrid Email)
// In production, replace with actual API calls

interface SendSMSParams {
  to: string;
  message: string;
}

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

interface NotificationResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

// SMS Templates
export function buildInvitationSMS(params: {
  hostName: string;
  honoreeName: string;
  link: string;
  deadline: string;
}): string {
  const countdown = getCountdownText(params.deadline);
  return `${params.hostName} created a song for ${params.honoreeName}! Share your memories: ${params.link} Deadline: ${countdown}`;
}

export function buildReminderSMS(params: {
  honoreeName: string;
  link: string;
  reminderType: '24h' | '48h' | '68h';
}): string {
  switch (params.reminderType) {
    case '24h':
      return `Quick reminder: Share a memory for ${params.honoreeName}'s song. ${params.link}`;
    case '48h':
      return `Last day to contribute to ${params.honoreeName}'s song! ${params.link}`;
    case '68h':
      return `Final hours! One line is enough. ${params.link}`;
  }
}

// Email Templates
export function buildInvitationEmail(params: {
  hostName: string;
  honoreeName: string;
  honoreeRelationship: string;
  occasion: string;
  toneDescription: string;
  link: string;
  deadline: string;
  honoreePhotoUrl?: string;
}): { subject: string; html: string; text: string } {
  const countdown = getCountdownText(params.deadline);

  const subject = `${params.hostName} invited you to create a song for ${params.honoreeName}`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h1 style="color: #1a1a1a; font-size: 24px; margin-bottom: 24px;">
    You're invited to contribute to a special song
  </h1>

  <p style="color: #4a4a4a; font-size: 16px; line-height: 1.6;">
    <strong>${params.hostName}</strong> is creating a personalized song for
    <strong>${params.honoreeName}</strong> (${params.honoreeRelationship})
    for their <strong>${params.occasion}</strong>.
  </p>

  ${params.honoreePhotoUrl ? `
  <div style="text-align: center; margin: 24px 0;">
    <img src="${params.honoreePhotoUrl}" alt="${params.honoreeName}"
         style="max-width: 200px; border-radius: 12px;">
  </div>
  ` : ''}

  <p style="color: #4a4a4a; font-size: 16px; line-height: 1.6;">
    The song will be <strong>${params.toneDescription}</strong>.
  </p>

  <p style="color: #4a4a4a; font-size: 16px; line-height: 1.6;">
    Share your favorite memories, inside jokes, and wishes. It only takes 60-90 seconds!
  </p>

  <div style="text-align: center; margin: 32px 0;">
    <a href="${params.link}"
       style="display: inline-block; background-color: #4F46E5; color: white;
              padding: 14px 32px; text-decoration: none; border-radius: 8px;
              font-weight: 600; font-size: 16px;">
      Share Your Memories
    </a>
  </div>

  <p style="color: #6b7280; font-size: 14px; text-align: center;">
    Deadline: <strong>${countdown}</strong>
  </p>

  <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;">

  <p style="color: #9ca3af; font-size: 12px; text-align: center;">
    Don't want to receive reminders?
    <a href="${params.link}?opt_out=true" style="color: #6b7280;">Unsubscribe</a>
  </p>
</body>
</html>
  `.trim();

  const text = `
${params.hostName} invited you to create a song for ${params.honoreeName}

${params.hostName} is creating a personalized song for ${params.honoreeName} (${params.honoreeRelationship}) for their ${params.occasion}.

The song will be ${params.toneDescription}.

Share your favorite memories, inside jokes, and wishes. It only takes 60-90 seconds!

Click here to contribute: ${params.link}

Deadline: ${countdown}
  `.trim();

  return { subject, html, text };
}

export function buildCompletionEmail(params: {
  honoreeName: string;
  spotifyUrl?: string;
  downloadUrl: string;
}): { subject: string; html: string; text: string } {
  const subject = `${params.honoreeName}'s song is ready!`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h1 style="color: #1a1a1a; font-size: 24px; margin-bottom: 24px; text-align: center;">
    The song is ready!
  </h1>

  <p style="color: #4a4a4a; font-size: 16px; line-height: 1.6; text-align: center;">
    Thanks to everyone who contributed, ${params.honoreeName}'s personalized song has been created.
  </p>

  <div style="text-align: center; margin: 32px 0;">
    ${params.spotifyUrl ? `
    <a href="${params.spotifyUrl}"
       style="display: inline-block; background-color: #1DB954; color: white;
              padding: 14px 32px; text-decoration: none; border-radius: 8px;
              font-weight: 600; font-size: 16px; margin-right: 12px;">
      Listen on Spotify
    </a>
    ` : ''}
    <a href="${params.downloadUrl}"
       style="display: inline-block; background-color: #4F46E5; color: white;
              padding: 14px 32px; text-decoration: none; border-radius: 8px;
              font-weight: 600; font-size: 16px;">
      Download Song
    </a>
  </div>

  <p style="color: #6b7280; font-size: 14px; text-align: center;">
    Thank you for being part of this special gift!
  </p>
</body>
</html>
  `.trim();

  const text = `
The song is ready!

Thanks to everyone who contributed, ${params.honoreeName}'s personalized song has been created.

${params.spotifyUrl ? `Listen on Spotify: ${params.spotifyUrl}\n` : ''}
Download: ${params.downloadUrl}

Thank you for being part of this special gift!
  `.trim();

  return { subject, html, text };
}

// Mock send functions
export async function sendSMS(params: SendSMSParams): Promise<NotificationResult> {
  console.log('[Mock SMS]', { to: params.to, message: params.message });

  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 100));

  // 95% success rate
  if (Math.random() > 0.05) {
    return {
      success: true,
      messageId: `sms_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
  }

  return {
    success: false,
    error: 'Failed to send SMS. Please try again.',
  };
}

export async function sendEmail(params: SendEmailParams): Promise<NotificationResult> {
  console.log('[Mock Email]', { to: params.to, subject: params.subject });

  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 200));

  // 98% success rate
  if (Math.random() > 0.02) {
    return {
      success: true,
      messageId: `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
  }

  return {
    success: false,
    error: 'Failed to send email. Please try again.',
  };
}

// Helper function
function getCountdownText(deadline: string): string {
  const now = new Date();
  const deadlineDate = new Date(deadline);
  const diffMs = deadlineDate.getTime() - now.getTime();

  if (diffMs <= 0) return 'Deadline passed';

  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  if (hours >= 24) {
    const days = Math.floor(hours / 24);
    return `${days} day${days > 1 ? 's' : ''} left`;
  }

  return `${hours} hour${hours > 1 ? 's' : ''} left`;
}
