import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword, createSession } from '@/lib/auth';
import { sendEmail, welcomeEmail } from '@/lib/email';

// Government verification codes — in production, store these in the database
// or validate against an external identity provider
const GOV_VERIFICATION_CODES: Record<string, boolean> = {
  'GOV-2026-ALPHA': true,
  'GOV-2026-BETA': true,
  'GOV-2026-PILOT': true,
  'COSMOGOV-OFFICIAL': true,
};

export async function POST(req: NextRequest) {
  try {
    const { email, password, name, role, govCode } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const existing = await db.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
    }

    // Determine the user role
    let userRole = 'user';
    if (role === 'gov_official') {
      // Validate the government verification code
      if (govCode && GOV_VERIFICATION_CODES[govCode?.toUpperCase?.()]) {
        userRole = 'gov_official';
      } else if (govCode) {
        return NextResponse.json(
          { error: 'Invalid government verification code. Please contact your administrator.' },
          { status: 400 }
        );
      }
      // If no code provided, create as regular user (they can be upgraded later)
    }

    const passwordHash = await hashPassword(password);
    const user = await db.user.create({
      data: {
        email,
        passwordHash,
        name: name || email.split('@')[0],
        role: userRole,
      },
    });

    await createSession(user.id);

    // Send welcome email (async, non-blocking)
    if (user.email) {
      sendEmail(
        welcomeEmail({
          recipientName: user.name || 'there',
          role: userRole,
        })
      ).catch((err) => console.error('[EMAIL] Failed to send welcome email:', err));
    }

    return NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.name,
      plan: user.plan,
      role: user.role,
      totalXp: user.totalXp,
      level: user.level,
    }, { status: 201 });
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
