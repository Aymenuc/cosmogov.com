import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { apiUser, apiFailure, ApiError, rateLimit } from '@/lib/api-server';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const memberships = await db.membership.findMany({
    where: { userId: session.id },
    include: {
      organization: {
        include: {
          _count: { select: { memberships: true, proposals: true } },
        },
      },
    },
  });

  const orgs = memberships.map(m => ({
    ...m.organization,
    role: m.role,
    memberCount: m.organization._count.memberships,
    proposalCount: m.organization._count.proposals,
  }));

  return NextResponse.json(orgs);
}

const RESERVED = new Set(['new', 'join', 'edit', 'settings', 'admin']);
const SLUG = /^[a-z0-9](?:[a-z0-9-]{0,48}[a-z0-9])?$/;

export async function POST(req: NextRequest) {
  try {
    const user = await apiUser();
    await rateLimit('community-create', user.id, 10, 3600);
    const body = await req.json().catch(() => ({}));
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const slug = typeof body.slug === 'string' ? body.slug.trim().toLowerCase() : '';
    const description = typeof body.description === 'string' ? body.description.trim() : '';
    if (name.length < 2 || name.length > 80)
      throw new ApiError(400, 'Give the community a name between 2 and 80 characters.');
    if (!SLUG.test(slug))
      throw new ApiError(400, 'The link name can use lowercase letters, numbers and dashes (up to 50).');
    if (RESERVED.has(slug))
      throw new ApiError(400, 'That link name is reserved. Try another.');
    if (description.length > 1000)
      throw new ApiError(400, 'Keep the description under 1,000 characters.');
    if (await db.organization.findUnique({ where: { slug } }))
      throw new ApiError(409, 'That link name is taken. Try another.');

    const org = await db.organization.create({
      data: { name, slug, description: description || null, createdBy: user.id },
    });
    await db.membership.create({
      data: { userId: user.id, organizationId: org.id, role: 'admin' },
    });
    return NextResponse.json(org, { status: 201 });
  } catch (error) {
    return apiFailure(error);
  }
}
