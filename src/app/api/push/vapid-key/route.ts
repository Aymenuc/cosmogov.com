import { NextResponse } from 'next/server';
import { getVapidPublicKey, isPushConfigured } from '@/lib/push-notifications';

/**
 * GET /api/push/vapid-key
 * Returns the VAPID public key for client-side push subscription registration.
 */
export async function GET() {
  const publicKey = getVapidPublicKey();
  return NextResponse.json({
    publicKey,
    configured: isPushConfigured(),
  });
}
