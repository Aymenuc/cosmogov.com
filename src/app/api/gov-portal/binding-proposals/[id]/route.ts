import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { sendEmail, govResponseBindingProposalEmail } from '@/lib/email';
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
    const { governmentResponse, status, voteDate, impactAssessment, legalReference } = body;

    if (!governmentResponse || !governmentResponse.trim()) {
      return NextResponse.json({ error: 'Response text is required' }, { status: 400 });
    }

    const proposal = await db.bindingProposal.findUnique({
      where: { id },
      include: {
        creator: { select: { id: true, name: true, email: true } },
        signatures: {
          select: { userId: true, user: { select: { id: true, name: true, email: true } } },
        },
      },
    });
    if (!proposal) return NextResponse.json({ error: 'Binding proposal not found' }, { status: 404 });

    if (!['threshold_reached', 'government_review', 'government_response'].includes(proposal.status)) {
      return NextResponse.json({ error: 'Proposal is not awaiting government response' }, { status: 400 });
    }

    const data: Record<string, unknown> = {
      governmentResponse,
      respondedBy: session.id,
      responseDate: new Date(),
      status: status || 'government_response',
    };
    if (voteDate) data.voteDate = new Date(voteDate);
    if (impactAssessment) data.impactAssessment = impactAssessment;
    if (legalReference) data.legalReference = legalReference;

    const updated = await db.bindingProposal.update({
      where: { id },
      data,
      include: { creator: { select: { id: true, name: true } } },
    });

    // Collect all unique user IDs to notify (creator + all signers)
    const notifiedUserIds = new Set<string>();
    const allRecipients: { id: string; name: string | null; email: string }[] = [];

    // Creator
    notifiedUserIds.add(proposal.creator.id);
    allRecipients.push(proposal.creator);

    // All signers
    for (const sig of proposal.signatures) {
      if (!notifiedUserIds.has(sig.user.id)) {
        notifiedUserIds.add(sig.user.id);
        allRecipients.push(sig.user);
      }
    }

    const responderName = session.name || 'Government Official';
    const proposalLink = `/dashboard/participation/binding-proposals/${id}`;
    const voteDateStr = voteDate ? new Date(voteDate).toLocaleDateString() : undefined;

    // Create in-app notifications for all affected users
    for (const userId of notifiedUserIds) {
      await db.notification.create({
        data: {
          userId,
          type: 'gov_response',
          title: 'Government Response Received',
          message: `The government has responded to the binding proposal "${proposal.title}"`,
          link: proposalLink,
        },
      });
    }

    // Send email notifications (async, non-blocking)
    const emailPayload = govResponseBindingProposalEmail({
      proposalTitle: proposal.title,
      responderName,
      responseText: governmentResponse,
      proposalLink,
      recipientName: '',
      voteDate: voteDateStr,
    });

    for (const recipient of allRecipients) {
      if (recipient.email) {
        sendEmail({
          ...emailPayload,
          to: recipient.email,
          subject: `Government Response: ${proposal.title}`,
          html: emailPayload.html.replace('Hello ,', `Hello ${recipient.name || 'there'},`),
          text: emailPayload.text?.replace('Hello ,', `Hello ${recipient.name || 'there'},`),
        }).catch((err) => console.error('[EMAIL] Failed to send gov response email:', err));
      }
    }

    // Send push notifications (async, non-blocking)
    sendPushToUsers(
      Array.from(notifiedUserIds),
      govResponsePushPayload({
        initiativeTitle: proposal.title,
        responsePreview: governmentResponse,
        link: proposalLink,
      })
    ).catch((err) => console.error('[PUSH] Failed to send gov response push:', err));

    return NextResponse.json({ proposal: updated });
  } catch (error) {
    console.error('Error responding to binding proposal:', error);
    return NextResponse.json({ error: 'Failed to submit response' }, { status: 500 });
  }
}
