/**
 * CosmoGov Email Service
 *
 * Provides email notification capabilities for key platform events:
 * - Government responses to initiatives and binding proposals
 * - Legislation status updates
 * - Welcome emails
 * - Password reset
 *
 * Delivery is chosen by EMAIL_PROVIDER:
 * - unset or "stub": emails are only logged (nothing is sent)
 * - "resend": sent through Resend with RESEND_API_KEY
 * - "smtp": sent through nodemailer with the SMTP_* variables
 *
 * The sender comes from EMAIL_FROM (or RESEND_FROM_EMAIL); its domain must be
 * verified with the provider. Links in emails are made absolute with APP_URL.
 *
 * Callers in route handlers should send from `after()` (next/server) so the
 * request can respond first without the platform freezing the send midway.
 */

export interface EmailPayload {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
}

const DEFAULT_FROM =
  process.env.EMAIL_FROM?.trim() ||
  process.env.RESEND_FROM_EMAIL?.trim() ||
  'CosmoGov <noreply@cosmogov.com>';

const APP_URL = (process.env.APP_URL?.trim() || 'https://www.cosmogov.com').replace(/\/+$/, '');

/** Turn an in-app path such as `/dashboard` into a link that works from an inbox. */
export function absoluteUrl(link: string): string {
  return link.startsWith('/') ? `${APP_URL}${link}` : link;
}

/** Escape text written by users before it is placed inside email HTML. */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

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

// ─── Email templates ───
//
// Same visual language as the site (see DESIGN.md): warm cream paper, ink text,
// vivid violet controls, tinted panels and bold Manrope. The "sticker" card
// (ink edge + solid shadow) is kept for welcome moments; replies and updates use
// a quiet card. Table layout and inline styles keep it intact across inboxes;
// clients without web fonts or box-shadow fall back gracefully.

const C = {
  paper: '#fffdf7',
  card: '#ffffff',
  ink: '#29223d',
  muted: '#706779',
  line: '#e6e0ee',
  violet: '#6741d9',
  coral: '#ff785f',
  lilac: '#eee6ff',
  lilacInk: '#5932c4',
  mint: '#dff5e8',
  mintInk: '#28745b',
  sky: '#e1f3ff',
  skyInk: '#226784',
  sun: '#fff0c3',
  sunInk: '#7b570c',
} as const;

const FONT = "Manrope, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
const SUPPORT_EMAIL = 'support@cosmogov.com';

const P = `margin:0 0 16px;font-family:${FONT};font-size:16px;line-height:1.6;color:${C.ink};`;

/** First word of a name, for a friendly greeting ("Hey, Ana."). */
function firstName(name: string): string {
  const first = name.trim().split(/\s+/)[0] || '';
  return first.toLowerCase() === 'there' ? '' : first;
}

function greeting(name: string, punctuation: ',' | '.' = ','): string {
  const first = firstName(name);
  return first ? `Hi ${escapeHtml(first)}${punctuation}` : `Hi there${punctuation}`;
}

/** A tinted reading panel with a small label, for quoted text written by people. */
function panel(label: string, bodyHtml: string, bg: string, labelInk: string): string {
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 20px;">
      <tr><td style="background:${bg};border-radius:14px;padding:18px 20px;">
        <p style="margin:0 0 8px;font-family:${FONT};font-size:12px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;color:${labelInk};">${label}</p>
        <p style="margin:0;font-family:${FONT};font-size:15px;line-height:1.65;color:${C.ink};white-space:pre-wrap;">${bodyHtml}</p>
      </td></tr>
    </table>`;
}

/** A rounded tag, e.g. a status or a date. */
function tag(textHtml: string, bg: string, ink: string): string {
  return `<span style="display:inline-block;background:${bg};color:${ink};border-radius:999px;padding:6px 14px;font-family:${FONT};font-size:14px;font-weight:800;">${textHtml}</span>`;
}

interface LayoutParts {
  /** Plain text shown as the inbox preview line. */
  preheader: string;
  /** HTML-safe strings below. */
  eyebrow: string;
  dot: string;
  heading: string;
  body: string;
  button: { label: string; href: string };
  footnote: string;
  /** "sticker" for welcome moments; "quiet" for replies and updates. */
  tone: 'sticker' | 'quiet';
}

function layout(p: LayoutParts): string {
  const sticker = p.tone === 'sticker';
  const cardEdge = sticker
    ? `border:2px solid ${C.ink};box-shadow:5px 6px 0 ${C.ink};`
    : `border:1px solid ${C.line};`;
  const buttonShadow = sticker ? `box-shadow:3px 4px 0 ${C.ink};` : '';

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>${p.heading}</title>
<link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;600;800&display=swap" rel="stylesheet">
</head>
<body style="margin:0;padding:0;background:${C.paper};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${escapeHtml(p.preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${C.paper};">
  <tr><td align="center" style="padding:32px 16px 40px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;">
      <tr><td style="padding:0 4px 20px;">
        <a href="${APP_URL}" style="text-decoration:none;">
          <img src="${APP_URL}/icon-192.png" width="36" height="36" alt="" style="display:inline-block;vertical-align:middle;border:0;border-radius:10px;">
          <span style="display:inline-block;vertical-align:middle;padding-left:10px;font-family:${FONT};font-size:20px;font-weight:800;letter-spacing:-0.01em;color:${C.ink};">Cosmogov</span>
        </a>
      </td></tr>
      <tr><td style="background:${C.card};${cardEdge}border-radius:20px;padding:32px 28px;">
        <p style="margin:0 0 14px;font-family:${FONT};font-size:12px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;color:${C.ink};">
          <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${p.dot};margin-right:8px;vertical-align:middle;"></span>${p.eyebrow}
        </p>
        <h1 style="margin:0 0 18px;font-family:${FONT};font-size:26px;line-height:1.25;font-weight:800;letter-spacing:-0.02em;color:${C.ink};">${p.heading}</h1>
        ${p.body}
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-top:8px;">
          <tr><td style="background:${C.violet};border:2px solid ${C.ink};border-radius:999px;${buttonShadow}">
            <a href="${p.button.href}" style="display:inline-block;padding:13px 26px;font-family:${FONT};font-size:16px;font-weight:800;color:#ffffff;text-decoration:none;border-radius:999px;">${p.button.label}</a>
          </td></tr>
        </table>
      </td></tr>
      <tr><td style="padding:22px 6px 0;font-family:${FONT};font-size:12px;line-height:1.7;color:${C.muted};">
        ${p.footnote}<br>
        Questions? Write to <a href="mailto:${SUPPORT_EMAIL}" style="color:${C.muted};">${SUPPORT_EMAIL}</a> · <a href="${APP_URL}" style="color:${C.muted};">cosmogov.com</a>
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;
}

/** Plain-text footer shared by every email. */
function textFooter(footnote: string): string {
  return `\n\n—\n${footnote}\nQuestions? Write to ${SUPPORT_EMAIL} · ${APP_URL}`;
}

const RESPONSE_NOTE =
  'An official response is a reply on the record. It is not, by itself, an approval or a decision.';

/**
 * Government Response to Citizen Initiative
 */
export function govResponseInitiativeEmail(params: {
  initiativeTitle: string;
  responderName: string;
  responseText: string;
  initiativeLink: string;
  recipientName: string;
}): Omit<EmailPayload, "to"> {
  const title = escapeHtml(params.initiativeTitle);
  const responder = escapeHtml(params.responderName);
  const link = absoluteUrl(params.initiativeLink);
  const footnote = 'You’re getting this because you signed or started this initiative on Cosmogov.';

  return {
    subject: `An official replied to “${params.initiativeTitle}”`,
    html: layout({
      preheader: `${params.responderName} responded to an initiative you support.`,
      eyebrow: 'An official replied',
      dot: C.violet,
      heading: `“${title}” has an official response`,
      body: `
        <p style="${P}">${greeting(params.recipientName)} <strong>${responder}</strong> responded to this initiative.</p>
        ${panel('Their response', escapeHtml(params.responseText), C.lilac, C.lilacInk)}
        <p style="${P}font-size:14px;color:${C.muted};">${RESPONSE_NOTE}</p>`,
      button: { label: 'Read the full response', href: link },
      footnote,
      tone: 'quiet',
    }),
    text:
      `${firstName(params.recipientName) ? `Hi ${firstName(params.recipientName)},` : 'Hi there,'}\n\n` +
      `${params.responderName} responded to the initiative “${params.initiativeTitle}”:\n\n` +
      `${params.responseText}\n\n${RESPONSE_NOTE}\n\nRead the full response: ${link}` +
      textFooter(footnote),
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
}): Omit<EmailPayload, "to"> {
  const title = escapeHtml(params.proposalTitle);
  const responder = escapeHtml(params.responderName);
  const link = absoluteUrl(params.proposalLink);
  const footnote = 'You’re getting this because you signed or started this binding proposal on Cosmogov.';
  const vote = params.voteDate
    ? `<p style="margin:0 0 20px;">${tag(`Vote scheduled: ${escapeHtml(params.voteDate)}`, C.sun, C.sunInk)}</p>`
    : '';

  return {
    subject: `An official replied to “${params.proposalTitle}”`,
    html: layout({
      preheader: `${params.responderName} responded to a binding proposal you support.`,
      eyebrow: 'Binding proposal update',
      dot: C.coral,
      heading: `“${title}” has an official response`,
      body: `
        <p style="${P}">${greeting(params.recipientName)} <strong>${responder}</strong> responded to this binding proposal.</p>
        ${panel('Their response', escapeHtml(params.responseText), C.lilac, C.lilacInk)}
        ${vote}
        <p style="${P}font-size:14px;color:${C.muted};">${RESPONSE_NOTE}</p>`,
      button: { label: 'Read the full response', href: link },
      footnote,
      tone: 'quiet',
    }),
    text:
      `${firstName(params.recipientName) ? `Hi ${firstName(params.recipientName)},` : 'Hi there,'}\n\n` +
      `${params.responderName} responded to the binding proposal “${params.proposalTitle}”:\n\n` +
      `${params.responseText}\n` +
      `${params.voteDate ? `\nVote scheduled: ${params.voteDate}\n` : ''}` +
      `\n${RESPONSE_NOTE}\n\nRead the full response: ${link}` +
      textFooter(footnote),
  };
}

const LEGISLATION_STATUS: Record<string, string> = {
  draft: 'a draft',
  proposed: 'proposed',
  public_comment: 'open for public comment',
  passed: 'passed',
  enacted: 'enacted',
  rejected: 'rejected',
};

function legislationStatusLabel(status: string): string {
  return LEGISLATION_STATUS[status] ?? status.replace(/_/g, ' ');
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
}): Omit<EmailPayload, "to"> {
  const title = escapeHtml(params.legislationTitle);
  const label = legislationStatusLabel(params.newStatus);
  const labelCap = label.charAt(0).toUpperCase() + label.slice(1);
  const link = absoluteUrl(params.legislationLink);
  const footnote = 'You’re getting this because you created this legislation on Cosmogov.';

  return {
    subject: `Update: “${params.legislationTitle}” is now ${label}`,
    html: layout({
      preheader: `“${params.legislationTitle}” is now ${label}.`,
      eyebrow: 'Legislation update',
      dot: C.mintInk,
      heading: `“${title}” moved to a new stage`,
      body: `
        <p style="${P}">${greeting(params.recipientName)} the legislation you created has a new status.</p>
        <p style="margin:0 0 20px;">${tag(`Now: ${escapeHtml(labelCap)}`, C.mint, C.mintInk)}</p>
        ${params.governmentNote ? panel('Note from the government', escapeHtml(params.governmentNote), C.sky, C.skyInk) : ''}`,
      button: { label: 'View the legislation', href: link },
      footnote,
      tone: 'quiet',
    }),
    text:
      `${firstName(params.recipientName) ? `Hi ${firstName(params.recipientName)},` : 'Hi there,'}\n\n` +
      `“${params.legislationTitle}” is now ${label}.\n` +
      `${params.governmentNote ? `\nNote from the government: ${params.governmentNote}\n` : ''}` +
      `\nView the legislation: ${link}` +
      textFooter(footnote),
  };
}

/**
 * Welcome Email
 */
export function welcomeEmail(params: { recipientName: string; role: string }): Omit<EmailPayload, "to"> {
  const official = params.role === 'gov_official';
  const link = absoluteUrl(official ? '/dashboard/gov-portal' : '/dashboard');
  const first = firstName(params.recipientName);
  const hey = first ? `Hey, ${escapeHtml(first)}.` : 'Hey there.';
  const footnote = 'You’re getting this because a Cosmogov account was created with this address. If that wasn’t you, write to us and we’ll sort it out.';

  const step = (dot: string, textHtml: string) => `
    <tr>
      <td width="22" valign="top" style="padding:7px 0 0;"><span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${dot};"></span></td>
      <td style="padding:0 0 12px;font-family:${FONT};font-size:15px;line-height:1.6;color:${C.ink};">${textHtml}</td>
    </tr>`;

  const body = official
    ? `
      <p style="${P}">Your official account is ready. From the government portal you can read citizen initiatives and binding proposals and reply on the record.</p>
      <p style="${P}">Replies carry your name, and the people who signed are told when you respond. The decisions stay with the people and the process.</p>`
    : `
      <p style="${P}">Your civic desk is ready. It’s where you’ll find what’s being decided, the missions you’re part of and the ideas you follow.</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:4px 0 16px;">
        ${step(C.violet, '<strong>Start a mission.</strong> Bring a big idea; your AI team drafts a first plan for people to review.')}
        ${step(C.coral, '<strong>Find your community.</strong> Join the groups working on things you care about.')}
        ${step(C.mintInk, '<strong>Have your say.</strong> Weigh in on the proposals that are open right now.')}
      </table>`;

  return {
    subject: official ? 'Welcome to Cosmogov: your official account is ready' : 'Welcome to Cosmogov: your civic desk is ready',
    html: layout({
      preheader: official
        ? 'Read citizen initiatives and binding proposals, and reply on the record.'
        : 'Start a mission, find your community and have your say.',
      eyebrow: 'Welcome to Cosmogov',
      dot: C.coral,
      heading: `${hey} Let’s make a little change.`,
      body,
      button: { label: official ? 'Open the government portal' : 'Open your civic desk', href: link },
      footnote,
      tone: 'sticker',
    }),
    text:
      `${first ? `Hey, ${first}.` : 'Hey there.'} Let’s make a little change.\n\n` +
      (official
        ? 'Your official account is ready. From the government portal you can read citizen initiatives and binding proposals and reply on the record.\n\n'
        : 'Your civic desk is ready. It’s where you’ll find what’s being decided, the missions you’re part of and the ideas you follow.\n\n' +
          '- Start a mission: bring a big idea; your AI team drafts a first plan for people to review.\n' +
          '- Find your community: join the groups working on things you care about.\n' +
          '- Have your say: weigh in on the proposals that are open right now.\n\n') +
      `${official ? 'Open the government portal' : 'Open your civic desk'}: ${link}` +
      textFooter(footnote),
  };
}
