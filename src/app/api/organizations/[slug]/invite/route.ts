import { randomBytes } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { apiUser, apiFailure, rateLimit } from '@/lib/api-server';
import { INVITE_DAYS, activeLinkInvite, requireCommunityAdmin } from '@/lib/community';

type Ctx = { params: Promise<{ slug: string }> };

const view = (invite: { token: string; expiresAt: Date } | null) =>
  NextResponse.json({ invite: invite ? { token: invite.token, expiresAt: invite.expiresAt } : null });

/** The community's current invite link (admins only). */
export async function GET(_req: NextRequest, { params }: Ctx) {
  try {
    const user = await apiUser();
    const { org } = await requireCommunityAdmin((await params).slug, user.id);
    const invite = await db.invitation.findFirst({
      where: activeLinkInvite(org.id),
      orderBy: { createdAt: 'desc' },
    });
    return view(invite);
  } catch (error) {
    return apiFailure(error);
  }
}

/** Make a new invite link. Any earlier link stops working. */
export async function POST(_req: NextRequest, { params }: Ctx) {
  try {
    const user = await apiUser();
    await rateLimit('community-invite', user.id, 20, 3600);
    const { org } = await requireCommunityAdmin((await params).slug, user.id);
    const invite = await db.$transaction(async (tx) => {
      await tx.invitation.updateMany({ where: activeLinkInvite(org.id), data: { expiresAt: new Date() } });
      return tx.invitation.create({
        data: {
          organizationId: org.id,
          token: randomBytes(18).toString('base64url'),
          expiresAt: new Date(Date.now() + INVITE_DAYS * 24 * 3600 * 1000),
        },
      });
    });
    return view(invite);
  } catch (error) {
    return apiFailure(error);
  }
}

/** Turn invites off: the current link stops working. */
export async function DELETE(_req: NextRequest, { params }: Ctx) {
  try {
    const user = await apiUser();
    const { org } = await requireCommunityAdmin((await params).slug, user.id);
    await db.invitation.updateMany({ where: activeLinkInvite(org.id), data: { expiresAt: new Date() } });
    return view(null);
  } catch (error) {
    return apiFailure(error);
  }
}
