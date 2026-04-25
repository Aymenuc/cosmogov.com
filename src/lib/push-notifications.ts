/**
 * CosmoGov Push Notification Service
 *
 * Handles web push notifications using the Web Push API.
 * Requires VAPID keys to be configured via environment variables.
 *
 * Setup:
 * 1. Generate VAPID keys: npx web-push generate-vapid-keys
 * 2. Set VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY in .env
 * 3. Set VAPID_SUBJECT to your email or URL (e.g., mailto:noreply@cosmogov.app)
 */

import { db } from './db';

// VAPID configuration from environment
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || '';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || '';
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:noreply@cosmogov.app';

export interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  image?: string;
  url?: string;
  tag?: string;
  data?: Record<string, unknown>;
}

/**
 * Check if push notifications are configured and available.
 */
export function isPushConfigured(): boolean {
  return !!(VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY);
}

/**
 * Get the VAPID public key for client-side push subscription.
 */
export function getVapidPublicKey(): string {
  return VAPID_PUBLIC_KEY;
}

/**
 * Send a push notification to a specific user.
 * Looks up all PushSubscription records for the user and sends to each.
 */
export async function sendPushToUser(userId: string, payload: PushNotificationPayload): Promise<{ sent: number; failed: number }> {
  if (!isPushConfigured()) {
    console.log('[PUSH] Push not configured, skipping notification to user:', userId);
    return { sent: 0, failed: 0 };
  }

  const subscriptions = await db.pushSubscription.findMany({
    where: { userId },
  });

  if (subscriptions.length === 0) {
    return { sent: 0, failed: 0 };
  }

  let sent = 0;
  let failed = 0;

  // Dynamic import of web-push to avoid bundling issues in edge runtime
  try {
    const webPush = await import('web-push');

    webPush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

    const pushPayload = JSON.stringify({
      title: payload.title,
      body: payload.body,
      icon: payload.icon || '/icon-192.png',
      badge: payload.badge || '/icon-192.png',
      image: payload.image,
      url: payload.url,
      tag: payload.tag,
      data: payload.data,
    });

    for (const sub of subscriptions) {
      try {
        const pushSubscription = {
          endpoint: sub.endpoint,
          keys: sub.keys ? JSON.parse(sub.keys) : undefined,
        };

        await webPush.sendNotification(pushSubscription, pushPayload);
        sent++;
      } catch (error: unknown) {
        failed++;
        // If subscription is expired or invalid, remove it
        if (
          error &&
          typeof error === 'object' &&
          'statusCode' in error &&
          (error as { statusCode: number }).statusCode === 410
        ) {
          await db.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
        } else {
          console.error('[PUSH] Failed to send to subscription:', sub.id, error);
        }
      }
    }
  } catch (error) {
    console.error('[PUSH] web-push module not available:', error);
    return { sent: 0, failed: subscriptions.length };
  }

  return { sent, failed };
}

/**
 * Send a push notification to multiple users.
 */
export async function sendPushToUsers(userIds: string[], payload: PushNotificationPayload): Promise<{ sent: number; failed: number }> {
  let totalSent = 0;
  let totalFailed = 0;

  for (const userId of userIds) {
    const result = await sendPushToUser(userId, payload);
    totalSent += result.sent;
    totalFailed += result.failed;
  }

  return { sent: totalSent, failed: totalFailed };
}

// ─── Pre-built Push Notification Payloads ───

export function govResponsePushPayload(params: {
  initiativeTitle: string;
  responsePreview: string;
  link: string;
}): PushNotificationPayload {
  return {
    title: 'Government Response Received',
    body: `"${params.initiativeTitle}" — ${params.responsePreview.substring(0, 100)}${params.responsePreview.length > 100 ? '...' : ''}`,
    url: params.link,
    tag: `gov-response-${params.link}`,
    icon: '/icon-192.png',
    data: { type: 'gov_response' },
  };
}

export function legislationUpdatePushPayload(params: {
  legislationTitle: string;
  newStatus: string;
  link: string;
}): PushNotificationPayload {
  return {
    title: 'Legislation Update',
    body: `"${params.legislationTitle}" is now: ${params.newStatus}`,
    url: params.link,
    tag: `legislation-${params.link}`,
    icon: '/icon-192.png',
    data: { type: 'legislation_update' },
  };
}

export function thresholdReachedPushPayload(params: {
  title: string;
  type: 'initiative' | 'binding_proposal';
  link: string;
}): PushNotificationPayload {
  return {
    title: 'Signature Threshold Reached!',
    body: `The ${params.type === 'initiative' ? 'initiative' : 'binding proposal'} "${params.title}" has reached its signature threshold. The government must now respond!`,
    url: params.link,
    tag: `threshold-${params.link}`,
    icon: '/icon-192.png',
    data: { type: 'threshold_reached' },
  };
}
