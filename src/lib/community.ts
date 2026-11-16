import { db } from '@/lib/db';
import { ApiError } from '@/lib/api-server';

/** How long a shareable invite link works before an admin has to make a new one. */
export const INVITE_DAYS = 30;

/** A community by its link name, and the viewer's role in it (null if not a member). */
export async function communityRole(slug: string, userId: string) {
  const org = await db.organization.findUnique({
    where: { slug },
    select: { id: true, name: true, slug: true },
  });
  if (!org) throw new ApiError(404, 'Community not found.');
  const membership = await db.membership.findUnique({
    where: { userId_organizationId: { userId, organizationId: org.id } },
    select: { role: true },
  });
  return { org, role: membership?.role ?? null };
}

export async function requireCommunityAdmin(slug: string, userId: string) {
  const found = await communityRole(slug, userId);
  if (found.role !== 'admin') throw new ApiError(403, 'Only this community’s admins can do that.');
  return found;
}

/**
 * Shareable links live in the Invitation table: no email (anyone with the
 * link may join), never "used up", and valid until they expire or an admin
 * replaces or turns them off.
 */
export const activeLinkInvite = (organizationId: string) => ({
  organizationId,
  email: null,
  usedAt: null,
  expiresAt: { gt: new Date() },
});

export const INVITE_TOKEN = /^[A-Za-z0-9_-]{16,64}$/;
