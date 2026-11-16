import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { apiUser, apiFailure, ApiError, rateLimit } from '@/lib/api-server';
import { INVITE_TOKEN } from '@/lib/community';

type Ctx = { params: Promise<{ token: string }> };

const GONE = 'This invite link doesn’t work any more. Ask the community for a new one.';

async function findInvite(token: string) {
  if (!INVITE_TOKEN.test(token)) return null;
  return db.invitation.findFirst({
    where: { token, email: null, usedAt: null, expiresAt: { gt: new Date() } },
    include: {
      organization: {
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          _count: { select: { memberships: true } },
        },
      },
    },
  });
}

/** What the link leads to, so people can decide before joining. */
export async function GET(_req: NextRequest, { params }: Ctx) {
  try {
    const user = await apiUser();
    await rateLimit('invite-view', user.id, 60, 3600);
    const invite = await findInvite((await params).token);
    if (!invite) throw new ApiError(404, GONE);
    const org = invite.organization;
    const membership = await db.membership.findUnique({
      where: { userId_organizationId: { userId: user.id, organizationId: org.id } },
      select: { id: true },
    });
    return NextResponse.json({
      community: {
        name: org.name,
        slug: org.slug,
        description: org.description,
        members: org._count.memberships,
      },
      isMember: Boolean(membership),
      expiresAt: invite.expiresAt,
    });
  } catch (error) {
    return apiFailure(error);
  }
}

/** Join the community the link belongs to, as a member. */
export async function POST(_req: NextRequest, { params }: Ctx) {
  try {
    const user = await apiUser();
    await rateLimit('invite-join', user.id, 20, 3600);
    const invite = await findInvite((await params).token);
    if (!invite) throw new ApiError(404, GONE);
    await db.membership.upsert({
      where: { userId_organizationId: { userId: user.id, organizationId: invite.organizationId } },
      create: { userId: user.id, organizationId: invite.organizationId, role: 'member' },
      update: {},
    });
    return NextResponse.json({ slug: invite.organization.slug });
  } catch (error) {
    return apiFailure(error);
  }
}
