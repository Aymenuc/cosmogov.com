import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { sendEmail, legislationStatusUpdateEmail } from '@/lib/email';
import { sendPushToUser, legislationUpdatePushPayload } from '@/lib/push-notifications';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    if (session.role !== 'gov_official' && session.role !== 'admin' && session.role !== 'super_admin') {
      return NextResponse.json({ error: 'Government portal access required' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { status, governmentNote } = body;

    const legislation = await db.legislation.findUnique({
      where: { id },
      include: { creator: { select: { id: true, name: true, email: true } } },
    });
    if (!legislation) return NextResponse.json({ error: 'Legislation not found' }, { status: 404 });

    const data: Record<string, unknown> = {};
    if (status) data.status = status;

    const updated = await db.legislation.update({
      where: { id },
      data,
      include: { creator: { select: { id: true, name: true } } },
    });

    // Notify creator if status changed
    if (status && status !== legislation.status) {
      const legislationLink = `/dashboard/participation/legislation/${id}`;

      // In-app notification
      await db.notification.create({
        data: {
          userId: legislation.createdBy,
          type: 'gov_response',
          title: 'Legislation Status Updated',
          message: `The legislation "${legislation.title}" has been updated to: ${status}${governmentNote ? `. Note: ${governmentNote}` : ''}`,
          link: legislationLink,
        },
      });

      // Email notification (async, non-blocking)
      if (legislation.creator.email) {
        sendEmail(
          legislationStatusUpdateEmail({
            legislationTitle: legislation.title,
            newStatus: status,
            governmentNote,
            legislationLink,
            recipientName: legislation.creator.name || 'there',
          })
        ).catch((err) => console.error('[EMAIL] Failed to send legislation update email:', err));
      }

      // Push notification (async, non-blocking)
      sendPushToUser(
        legislation.createdBy,
        legislationUpdatePushPayload({
          legislationTitle: legislation.title,
          newStatus: status,
          link: legislationLink,
        })
      ).catch((err) => console.error('[PUSH] Failed to send legislation update push:', err));
    }

    return NextResponse.json({ legislation: updated });
  } catch (error) {
    console.error('Error updating legislation:', error);
    return NextResponse.json({ error: 'Failed to update legislation' }, { status: 500 });
  }
}
