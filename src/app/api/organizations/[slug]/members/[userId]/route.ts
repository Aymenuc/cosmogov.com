import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { apiUser, apiFailure, ApiError } from '@/lib/api-server';
import { communityRole } from '@/lib/community';

type Ctx = { params: Promise<{ slug: string; userId: string }> };

const ROLES = ['admin', 'moderator', 'member'] as const;

async function target(organizationId: string, userId: string) {
  const membership = await db.membership.findUnique({
    where: { userId_organizationId: { userId, organizationId } },
  });
  if (!membership) throw new ApiError(404, 'That person isn’t a member of this community.');
  return membership;
}

/** Change a member's role (admins only; admins can't change other admins). */
export async function PATCH(req: NextRequest, { params }: Ctx) {
  try {
    const user = await apiUser();
    const { slug, userId } = await params;
    const { org, role } = await communityRole(slug, user.id);
    if (role !== 'admin') throw new ApiError(403, 'Only this community’s admins can change roles.');
    const body = await req.json().catch(() => ({}));
    if (!ROLES.includes(body.role)) throw new ApiError(400, 'Unknown role.');
    if (userId === user.id) throw new ApiError(400, 'You can’t change your own role.');
    const member = await target(org.id, userId);
    if (member.role === 'admin') throw new ApiError(403, 'Admins can’t change another admin’s role.');
    await db.membership.update({ where: { id: member.id }, data: { role: body.role } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiFailure(error);
  }
}

/** Leave (userId "me") or, for admins, remove someone who isn't an admin. */
export async function DELETE(_req: NextRequest, { params }: Ctx) {
  try {
    const user = await apiUser();
    const { slug, userId } = await params;
    const { org, role } = await communityRole(slug, user.id);
    if (!role) throw new ApiError(403, 'You’re not a member of this community.');
    const self = userId === 'me' || userId === user.id;
    if (!self && role !== 'admin') throw new ApiError(403, 'Only this community’s admins can remove members.');
    const member = await target(org.id, self ? user.id : userId);
    if (member.role === 'admin') {
      if (!self) throw new ApiError(403, 'Admins can’t remove another admin.');
      const admins = await db.membership.count({ where: { organizationId: org.id, role: 'admin' } });
      if (admins <= 1)
        throw new ApiError(400, 'You’re this community’s only admin. Make another member an admin before you leave.');
    }
    await db.membership.delete({ where: { id: member.id } });
    return NextResponse.json({ left: self });
  } catch (error) {
    return apiFailure(error);
  }
}
