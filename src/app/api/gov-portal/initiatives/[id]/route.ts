import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { sendEmail, govResponseInitiativeEmail } from '@/lib/email';
import { sendPushToUsers, govResponsePushPayload } from '@/lib/push-notifications';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    if (session.role !== 'gov_official' && session.role !== 'admin' && session.role !== 'super_admin') {
      return NextResponse.json({ error: 'Government portal access required' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { governmentResponse, status } = body;

    if (!governmentResponse || !governmentResponse.trim()) {
      return NextResponse.json({ error: 'Response text is required' }, { status: 400 });
    }

    const initiative = await db.citizenInitiative.findUnique({
      where: { id },
      include: {
        creator: { select: { id: true, name: true, email: true } },
        signatures: {
          select: { userId: true, user: { select: { id: true, name: true, email: true } } },
        },
      },
    });
    if (!initiative) return NextResponse.json({ error: 'Initiative not found' }, { status: 404 });

    if (initiative.status !== 'threshold_reached' && initiative.status !== 'government_response') {
      return NextResponse.json({ error: 'Initiative is not awaiting government response' }, { status: 400 });
    }

    const updated = await db.citizenInitiative.update({
      where: { id },
      data: {
        governmentResponse,
        respondedBy: session.id,
        responseDate: new Date(),
        status: status || 'government_response',
      },
      include: { creator: { select: { id: true, name: true } } },
    });

    // Collect all unique user IDs to notify (creator + all signers)
    const notifiedUserIds = new Set<string>();
    const allRecipients: { id: string; name: string | null; email: string }[] = [];

    // Creator
    notifiedUserIds.add(initiative.creator.id);
    allRecipients.push(initiative.creator);

    // All signers
    for (const sig of initiative.signatures) {
      if (!notifiedUserIds.has(sig.user.id)) {
        notifiedUserIds.add(sig.user.id);
        allRecipients.push(sig.user);
      }
    }

    // Create in-app notifications for all affected users
    const responderName = session.name || 'Government Official';
    const initiativeLink = `/dashboard/participation/initiatives`;

    for (const userId of notifiedUserIds) {
      await db.notification.create({
        data: {
          userId,
          type: 'gov_response',
          title: 'Government Response Received',
          message: `The government has responded to the initiative "${initiative.title}"`,
          link: initiativeLink,
        },
      });
    }

    // Send email notifications (async, non-blocking)
    const emailPayload = govResponseInitiativeEmail({
      initiativeTitle: initiative.title,
      responderName,
      responseText: governmentResponse,
      initiativeLink,
      recipientName: '', // Will be filled per-recipient
    });

    for (const recipient of allRecipients) {
      if (recipient.email) {
        sendEmail({
          ...emailPayload,
          to: recipient.email,
          subject: `Government Response: ${initiative.title}`,
          html: emailPayload.html.replace('Hello ,', `Hello ${recipient.name || 'there'},`),
          text: emailPayload.text?.replace('Hello ,', `Hello ${recipient.name || 'there'},`),
        }).catch((err) => console.error('[EMAIL] Failed to send gov response email:', err));
      }
    }

    // Send push notifications (async, non-blocking)
    sendPushToUsers(
      Array.from(notifiedUserIds),
      govResponsePushPayload({
        initiativeTitle: initiative.title,
        responsePreview: governmentResponse,
        link: initiativeLink,
      })
    ).catch((err) => console.error('[PUSH] Failed to send gov response push:', err));

    return NextResponse.json({ initiative: updated });
  } catch (error) {
    console.error('Error responding to initiative:', error);
    return NextResponse.json({ error: 'Failed to submit response' }, { status: 500 });
  }
}
