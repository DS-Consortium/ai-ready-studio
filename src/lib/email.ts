import { supabase } from '@/integrations/supabase/client';

const EMAIL_CONFIG = {
  apiEndpoint: import.meta.env.VITE_EMAIL_API_ENDPOINT || '/api/email',
  fromEmail: import.meta.env.VITE_EMAIL_FROM || 'noreply@dsconsortium.org',
};

export interface EmailPayload {
  to: string;
  subject: string;
  template: string;
  data?: Record<string, any>;
}

export interface EmailResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Send email via API
 */
export async function sendEmail(payload: EmailPayload): Promise<EmailResponse> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('User not authenticated');

    const response = await fetch(EMAIL_CONFIG.apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        ...payload,
        from: EMAIL_CONFIG.fromEmail,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Email send failed');
    }

    const data = await response.json();
    return { success: true, messageId: data.messageId };
  } catch (error) {
    console.error('Email send error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send email',
    };
  }
}

/**
 * Send video submission confirmation email
 */
export async function sendVideoSubmissionEmail(userEmail: string, videoTitle: string, videoId: string): Promise<EmailResponse> {
  return sendEmail({
    to: userEmail,
    subject: 'Your AI-Ready Video Has Been Submitted',
    template: 'video-submission',
    data: {
      videoTitle,
      videoId,
      dashboardUrl: `${window.location.origin}/dashboard`,
    },
  });
}

/**
 * Send video approval email
 */
export async function sendVideoApprovalEmail(userEmail: string, videoTitle: string, videoId: string): Promise<EmailResponse> {
  return sendEmail({
    to: userEmail,
    subject: 'Your AI-Ready Video Has Been Approved!',
    template: 'video-approved',
    data: {
      videoTitle,
      videoId,
      galleryUrl: `${window.location.origin}/gallery`,
    },
  });
}

/**
 * Send video rejection email
 */
export async function sendVideoRejectionEmail(userEmail: string, videoTitle: string, reason: string): Promise<EmailResponse> {
  return sendEmail({
    to: userEmail,
    subject: 'Your AI-Ready Video Needs Review',
    template: 'video-rejected',
    data: {
      videoTitle,
      reason,
      supportUrl: `${window.location.origin}/support`,
    },
  });
}

/**
 * Send event registration confirmation
 */
export async function sendEventRegistrationEmail(userEmail: string, eventTitle: string, eventDate: string): Promise<EmailResponse> {
  return sendEmail({
    to: userEmail,
    subject: `Confirmed: ${eventTitle}`,
    template: 'event-registration',
    data: {
      eventTitle,
      eventDate,
      calendarUrl: `${window.location.origin}/dashboard?tab=events`,
    },
  });
}

/**
 * Get email configuration
 */
export function getEmailConfig() {
  return EMAIL_CONFIG;
}

/**
 * Validate email configuration
 */
export function validateEmailConfig(): { valid: boolean; missing: string[] } {
  const missing: string[] = [];

  if (!EMAIL_CONFIG.apiEndpoint) missing.push('VITE_EMAIL_API_ENDPOINT');
  if (!EMAIL_CONFIG.fromEmail) missing.push('VITE_EMAIL_FROM');

  return {
    valid: missing.length === 0,
    missing,
  };
}
