import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { ApiError, apiFailure, apiUser, rateLimit } from '@/lib/api-server';
import { appUrl, cardPaymentsEnabled, proPrice, stripe } from '@/lib/billing';
import { planId } from '@/lib/plans';

const schema = z.object({ period: z.enum(['monthly', 'yearly']).default('monthly') });

/** Starts a Stripe Checkout for the Pro plan and returns its URL. */
export async function POST(req: NextRequest) {
  try {
    const user = await apiUser();
    await rateLimit('billing-checkout', user.id, 10, 3600);
    const { period } = schema.parse(await req.json().catch(() => ({})));
    const s = stripe();
    const price = proPrice(period);
    if (!cardPaymentsEnabled() || !s || !price)
      throw new ApiError(503, 'Card payments are not switched on yet. Please contact us to upgrade.');
    if (planId(user.plan) !== 'community')
      throw new ApiError(409, 'You already have a paid plan. Use "Manage billing" to change it.');

    const account = await db.user.findUnique({ where: { id: user.id }, select: { stripeCustomerId: true } });
    const session = await s.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price, quantity: 1 }],
      client_reference_id: user.id,
      ...(account?.stripeCustomerId ? { customer: account.stripeCustomerId } : { customer_email: user.email }),
      subscription_data: { metadata: { userId: user.id, plan: 'pro' } },
      metadata: { userId: user.id, plan: 'pro' },
      allow_promotion_codes: true,
      success_url: `${appUrl()}/dashboard/settings?tab=plan&upgraded=1`,
      cancel_url: `${appUrl()}/dashboard/settings?tab=plan`,
    });
    if (!session.url) throw new ApiError(502, 'Checkout could not start. Please try again.');
    return NextResponse.json({ url: session.url });
  } catch (error) {
    return apiFailure(error);
  }
}
