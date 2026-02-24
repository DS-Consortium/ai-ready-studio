import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, content-type",
};

interface EmailRequest {
  to: string;
  subject: string;
  template: string;
  data?: Record<string, any>;
  from?: string;
}

const EMAIL_TEMPLATES: Record<string, (data: Record<string, any>) => string> = {
  "video-submission": (data) => `
    <h2>Your AI-Ready Video Has Been Submitted</h2>
    <p>Hi,</p>
    <p>Thank you for submitting your video: <strong>${data.videoTitle}</strong></p>
    <p>Your video is now being reviewed by our moderation team. You'll receive an update within 24 hours.</p>
    <p><a href="${data.dashboardUrl}">View your dashboard</a></p>
  `,
  "video-approved": (data) => `
    <h2>Your AI-Ready Video Has Been Approved!</h2>
    <p>Hi,</p>
    <p>Congratulations! Your video <strong>${data.videoTitle}</strong> has been approved and is now live in our gallery.</p>
    <p><a href="${data.galleryUrl}">View your video in the gallery</a></p>
  `,
  "video-rejected": (data) => `
    <h2>Your AI-Ready Video Needs Review</h2>
    <p>Hi,</p>
    <p>Your video <strong>${data.videoTitle}</strong> didn't pass our content guidelines.</p>
    <p><strong>Reason:</strong> ${data.reason}</p>
    <p><a href="${data.supportUrl}">Contact support for help</a></p>
  `,
  "event-registration": (data) => `
    <h2>Event Registration Confirmed</h2>
    <p>Hi,</p>
    <p>You're registered for: <strong>${data.eventTitle}</strong></p>
    <p><strong>Date:</strong> ${data.eventDate}</p>
    <p><a href="${data.calendarUrl}">Add to your calendar</a></p>
  `,
};

async function sendEmail(req: EmailRequest): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const template = EMAIL_TEMPLATES[req.template];
    if (!template) {
      return { success: false, error: "Template not found" };
    }

    const htmlContent = template(req.data || {});
    
    // Here you would integrate with your email service (SendGrid, Mailgun, etc.)
    // For now, we'll log and return success
    console.log(`Email sent to ${req.to} with subject: ${req.subject}`);
    
    return {
      success: true,
      messageId: `msg_${Date.now()}`,
    };
  } catch (error) {
    console.error("Email error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Email send failed",
    };
  }
}

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const emailReq = (await req.json()) as EmailRequest;
    const result = await sendEmail(emailReq);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: result.success ? 200 : 400,
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: "Invalid request" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
