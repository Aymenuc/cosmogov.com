/**
 * CosmoGov Email Service
 *
 * Provides email notification capabilities for key platform events:
 * - Government responses to initiatives and binding proposals
 * - Legislation status updates
 * - Welcome emails
 * - Password reset
 *
 * Currently uses a stub/logging implementation. To enable real email delivery,
 * configure the SMTP environment variables and set EMAIL_PROVIDER=smtp.
 * Alternatively, set EMAIL_PROVIDER=resend and add your Resend API key.
 */

export interface EmailPayload {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
}

const DEFAULT_FROM = 'CosmoGov <noreply@cosmogov.app>';

/**
 * Send an email notification.
 * In development/stub mode, logs the email payload instead of sending.
 * In production with SMTP configured, sends via nodemailer.
 * With Resend API key configured, sends via Resend API.
 */
export async function sendEmail(payload: EmailPayload): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const provider = process.env.EMAIL_PROVIDER || 'stub';

  // Stub mode — just log
  if (provider === 'stub') {
    const recipients = Array.isArray(payload.to) ? payload.to.join(', ') : payload.to;
    console.log(`[EMAIL STUB] To: ${recipients} | Subject: ${payload.subject}`);
    if (process.env.NODE_ENV === 'development') {
      console.log(`[EMAIL STUB] Body preview: ${payload.text || payload.html.substring(0, 200)}...`);
    }
    return { success: true, messageId: `stub-${Date.now()}` };
  }

  // Resend API mode
  if (provider === 'resend') {
    return sendViaResend(payload);
  }

  // SMTP mode
  if (provider === 'smtp') {
    return sendViaSmtp(payload);
  }

  console.warn(`[EMAIL] Unknown provider: ${provider}. Falling back to stub.`);
  return { success: true, messageId: `stub-${Date.now()}` };
}

/**
 * Send via Resend API (https://resend.com)
 */
async function sendViaResend(payload: EmailPayload): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error('[EMAIL] RESEND_API_KEY not configured');
    return { success: false, error: 'Resend API key not configured' };
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: payload.from || DEFAULT_FROM,
        to: Array.isArray(payload.to) ? payload.to : [payload.to],
        subject: payload.subject,
        html: payload.html,
        text: payload.text,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('[EMAIL] Resend API error:', error);
      return { success: false, error: `Resend API error: ${response.status}` };
    }

    const data = await response.json();
    return { success: true, messageId: data.id };
  } catch (error) {
    console.error('[EMAIL] Resend send failed:', error);
    return { success: false, error: 'Failed to send via Resend' };
  }
}

/**
 * Send via SMTP (using nodemailer)
 */
async function sendViaSmtp(payload: EmailPayload): Promise<{ success: boolean; messageId?: string; error?: string }> {
  // Dynamic import to avoid bundling nodemailer in edge runtime
  try {
    const nodemailer = await import('nodemailer');
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'localhost',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const result = await transporter.sendMail({
      from: payload.from || DEFAULT_FROM,
      to: Array.isArray(payload.to) ? payload.to.join(', ') : payload.to,
      subject: payload.subject,
      html: payload.html,
      text: payload.text,
    });

    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('[EMAIL] SMTP send failed:', error);
    return { success: false, error: 'Failed to send via SMTP' };
  }
}

// ─── Pre-built Email Templates ───

/**
 * Government Response to Citizen Initiative
 */
export function govResponseInitiativeEmail(params: {
  initiativeTitle: string;
  responderName: string;
  responseText: string;
  initiativeLink: string;
  recipientName: string;
}): EmailPayload {
  return {
    subject: `Government Response: ${params.initiativeTitle}`,
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; background: #0B1022; color: #e2e8f0; padding: 32px; border-radius: 16px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #38bdf8; margin: 0; font-size: 20px;">CosmoGov</h1>
          <p style="color: #94a3b8; font-size: 14px;">Government Response Received</p>
        </div>
        <div style="background: rgba(56,189,248,0.05); border: 1px solid rgba(56,189,248,0.15); border-radius: 12px; padding: 20px; margin-bottom: 20px;">
          <p style="margin: 0 0 8px; font-size: 14px; color: #94a3b8;">Hello ${params.recipientName},</p>
          <p style="margin: 0 0 16px; font-size: 14px;">
            <strong style="color: #38bdf8;">${params.responderName}</strong> has submitted an official government response to the initiative:
          </p>
          <h2 style="color: #ffffff; font-size: 16px; margin: 0 0 12px;">${params.initiativeTitle}</h2>
          <div style="background: rgba(255,255,255,0.05); border-radius: 8px; padding: 16px; margin-bottom: 16px;">
            <p style="margin: 0; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">${params.responseText}</p>
          </div>
        </div>
        <div style="text-align: center;">
          <a href="${params.initiativeLink}" style="display: inline-block; background: linear-gradient(135deg, #38bdf8, #8b5cf6); color: #ffffff; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">
            View Full Response
          </a>
        </div>
        <p style="text-align: center; color: #64748b; font-size: 12px; margin-top: 24px;">
          You received this because you signed or created this initiative on CosmoGov.
        </p>
      </div>
    `,
    text: `Government Response: ${params.initiativeTitle}\n\nHello ${params.recipientName},\n\n${params.responderName} has responded to the initiative "${params.initiativeTitle}":\n\n${params.responseText}\n\nView the full response: ${params.initiativeLink}`,
  };
}

/**
 * Government Response to Binding Proposal
 */
export function govResponseBindingProposalEmail(params: {
  proposalTitle: string;
  responderName: string;
  responseText: string;
  proposalLink: string;
  recipientName: string;
  voteDate?: string;
}): EmailPayload {
  const voteDateSection = params.voteDate
    ? `<p style="margin: 12px 0 0; font-size: 14px; color: #f59e0b;"><strong>Scheduled Vote:</strong> ${params.voteDate}</p>`
    : '';

  return {
    subject: `Government Response: ${params.proposalTitle}`,
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; background: #0B1022; color: #e2e8f0; padding: 32px; border-radius: 16px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #f43f5e; margin: 0; font-size: 20px;">CosmoGov</h1>
          <p style="color: #94a3b8; font-size: 14px;">Binding Proposal — Government Response</p>
        </div>
        <div style="background: rgba(244,63,94,0.05); border: 1px solid rgba(244,63,94,0.15); border-radius: 12px; padding: 20px; margin-bottom: 20px;">
          <p style="margin: 0 0 8px; font-size: 14px; color: #94a3b8;">Hello ${params.recipientName},</p>
          <p style="margin: 0 0 16px; font-size: 14px;">
            <strong style="color: #f43f5e;">${params.responderName}</strong> has submitted an official government response to the binding proposal:
          </p>
          <h2 style="color: #ffffff; font-size: 16px; margin: 0 0 12px;">${params.proposalTitle}</h2>
          <div style="background: rgba(255,255,255,0.05); border-radius: 8px; padding: 16px; margin-bottom: 16px;">
            <p style="margin: 0; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">${params.responseText}</p>
          </div>
          ${voteDateSection}
        </div>
        <div style="text-align: center;">
          <a href="${params.proposalLink}" style="display: inline-block; background: linear-gradient(135deg, #f43f5e, #8b5cf6); color: #ffffff; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">
            View Full Response
          </a>
        </div>
        <p style="text-align: center; color: #64748b; font-size: 12px; margin-top: 24px;">
          You received this because you signed this binding proposal on CosmoGov.
        </p>
      </div>
    `,
    text: `Government Response: ${params.proposalTitle}\n\nHello ${params.recipientName},\n\n${params.responderName} has responded to the binding proposal "${params.proposalTitle}":\n\n${params.responseText}\n${params.voteDate ? `\nScheduled Vote: ${params.voteDate}\n` : ''}\nView the full response: ${params.proposalLink}`,
  };
}

/**
 * Legislation Status Update Email
 */
export function legislationStatusUpdateEmail(params: {
  legislationTitle: string;
  newStatus: string;
  governmentNote?: string;
  legislationLink: string;
  recipientName: string;
}): EmailPayload {
  return {
    subject: `Legislation Update: ${params.legislationTitle}`,
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; background: #0B1022; color: #e2e8f0; padding: 32px; border-radius: 16px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #8b5cf6; margin: 0; font-size: 20px;">CosmoGov</h1>
          <p style="color: #94a3b8; font-size: 14px;">Legislation Status Update</p>
        </div>
        <div style="background: rgba(139,92,246,0.05); border: 1px solid rgba(139,92,246,0.15); border-radius: 12px; padding: 20px; margin-bottom: 20px;">
          <p style="margin: 0 0 8px; font-size: 14px; color: #94a3b8;">Hello ${params.recipientName},</p>
          <p style="margin: 0 0 16px; font-size: 14px;">
            The legislation <strong style="color: #8b5cf6;">${params.legislationTitle}</strong> has been updated:
          </p>
          <div style="background: rgba(255,255,255,0.05); border-radius: 8px; padding: 16px;">
            <p style="margin: 0; font-size: 14px;"><strong>New Status:</strong> <span style="color: #38bdf8;">${params.newStatus}</span></p>
            ${params.governmentNote ? `<p style="margin: 8px 0 0; font-size: 14px;"><strong>Government Note:</strong> ${params.governmentNote}</p>` : ''}
          </div>
        </div>
        <div style="text-align: center;">
          <a href="${params.legislationLink}" style="display: inline-block; background: linear-gradient(135deg, #8b5cf6, #38bdf8); color: #ffffff; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">
            View Legislation
          </a>
        </div>
      </div>
    `,
    text: `Legislation Update: ${params.legislationTitle}\n\nNew Status: ${params.newStatus}\n${params.governmentNote ? `Note: ${params.governmentNote}\n` : ''}\nView: ${params.legislationLink}`,
  };
}

/**
 * Welcome Email
 */
export function welcomeEmail(params: { recipientName: string; role: string }): EmailPayload {
  const roleLabel = params.role === 'gov_official' ? 'Government Official' : params.role;
  const dashboardLink = params.role === 'gov_official' ? '/dashboard/gov-portal' : '/dashboard';

  return {
    subject: 'Welcome to CosmoGov — Your Cosmic Civic Platform',
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; background: #0B1022; color: #e2e8f0; padding: 32px; border-radius: 16px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="background: linear-gradient(135deg, #38bdf8, #8b5cf6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin: 0; font-size: 28px;">CosmoGov</h1>
          <p style="color: #94a3b8; font-size: 14px;">Interstellar Civic OS</p>
        </div>
        <div style="background: rgba(255,255,255,0.03); border-radius: 12px; padding: 20px; margin-bottom: 20px;">
          <p style="margin: 0 0 16px; font-size: 16px;">Welcome, <strong style="color: #38bdf8;">${params.recipientName}</strong>!</p>
          <p style="margin: 0 0 16px; font-size: 14px; line-height: 1.6;">
            You have joined CosmoGov as a <strong style="color: #f59e0b;">${roleLabel}</strong>. 
            Your account is ready to participate in governance, propose changes, and make your voice heard.
          </p>
          <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #94a3b8;">
            ${params.role === 'gov_official' 
              ? 'As a government official, you can review and respond to citizen initiatives and binding proposals through the Government Portal.'
              : 'Explore participatory processes, sign initiatives, vote on proposals, and track legislation — all from your dashboard.'}
          </p>
        </div>
        <div style="text-align: center;">
          <a href="${dashboardLink}" style="display: inline-block; background: linear-gradient(135deg, #38bdf8, #8b5cf6); color: #ffffff; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">
            Go to ${params.role === 'gov_official' ? 'Government Portal' : 'Dashboard'}
          </a>
        </div>
      </div>
    `,
    text: `Welcome to CosmoGov!\n\nHello ${params.recipientName},\n\nYou have joined as a ${roleLabel}. ${params.role === 'gov_official' ? 'Access the Government Portal to review and respond to citizen initiatives.' : 'Explore participatory processes, sign initiatives, and vote on proposals.'}\n\nGet started: ${dashboardLink}`,
  };
}
