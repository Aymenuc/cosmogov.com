import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ApiError, apiFailure, apiUser, rateLimit } from '@/lib/api-server';
import { appUrl, stripe } from '@/lib/billing';

/** Opens Stripe's billing page so people can change card, see invoices or cancel. */
export async function POST() {
  try {
    const user = await apiUser();
    await rateLimit('billing-portal', user.id, 20, 3600);
    const s = stripe();
    const account = await db.user.findUnique({ where: { id: user.id }, select: { stripeCustomerId: true } });
    if (!s || !account?.stripeCustomerId)
      throw new ApiError(404, 'There is no card subscription on this account. Contact us about invoices.');
    const portal = await s.billingPortal.sessions.create({
      customer: account.stripeCustomerId,
      return_url: `${appUrl()}/dashboard/settings?tab=plan`,
    });
    return NextResponse.json({ url: portal.url });
  } catch (error) {
    return apiFailure(error);
  }
}
