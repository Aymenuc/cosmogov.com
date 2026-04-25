import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

/**
 * POST /api/push/subscribe
 * Register a push notification subscription for the current user.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

    const body = await request.json();
    const { endpoint, keys } = body;

    if (!endpoint) {
      return NextResponse.json({ error: 'Endpoint is required' }, { status: 400 });
    }

    // Upsert the subscription (update if exists, create if not)
    const existing = await db.pushSubscription.findUnique({
      where: { endpoint },
    });

    if (existing) {
      // Update the existing subscription with new keys
      await db.pushSubscription.update({
        where: { endpoint },
        data: {
          userId: session.id,
          p256dh: keys?.p256dh || existing.p256dh,
          auth: keys?.auth || existing.auth,
          keys: keys ? JSON.stringify(keys) : existing.keys,
        },
      });
    } else {
      await db.pushSubscription.create({
        data: {
          userId: session.id,
          endpoint,
          p256dh: keys?.p256dh || '',
          auth: keys?.auth || '',
          keys: keys ? JSON.stringify(keys) : null,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving push subscription:', error);
    return NextResponse.json({ error: 'Failed to save subscription' }, { status: 500 });
  }
}

/**
 * DELETE /api/push/subscribe
 * Remove a push notification subscription.
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

    const body = await request.json();
    const { endpoint } = body;

    if (!endpoint) {
      return NextResponse.json({ error: 'Endpoint is required' }, { status: 400 });
    }

    await db.pushSubscription.deleteMany({
      where: { endpoint, userId: session.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing push subscription:', error);
    return NextResponse.json({ error: 'Failed to remove subscription' }, { status: 500 });
  }
}
