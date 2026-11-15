import { NextRequest, NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { db } from '@/lib/db';
import { planForPrice, stripe } from '@/lib/billing';

export const dynamic = 'force-dynamic';

const ACTIVE = new Set(['active', 'trialing', 'past_due']);

async function applySubscription(sub: Stripe.Subscription) {
  const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id;
  const userId = sub.metadata?.userId;
  const user = await db.user.findFirst({
    where: userId ? { OR: [{ id: userId }, { stripeCustomerId: customerId }] } : { stripeCustomerId: customerId },
    select: { id: true, role: true },
  });
  if (!user) return;
  const granted = sub.items.data.map((i) => planForPrice(i.price.id)).find(Boolean) ?? null;
  const plan = ACTIVE.has(sub.status) && granted ? granted : 'community';
  await db.user.update({
    where: { id: user.id },
    data: { plan, stripeCustomerId: customerId, stripeSubscriptionId: plan === 'community' ? null : sub.id },
  });
}

/**
 * Stripe tells us about payments here. Only signed events are accepted, and
 * the plan is always derived from Stripe's own subscription state.
 */
export async function POST(req: NextRequest) {
  const s = stripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!s || !secret) return NextResponse.json({ error: 'Billing is not configured.' }, { status: 503 });

  const signature = req.headers.get('stripe-signature');
  if (!signature) return NextResponse.json({ error: 'Missing signature.' }, { status: 400 });
  let event: Stripe.Event;
  try {
    event = s.webhooks.constructEvent(await req.text(), signature, secret);
  } catch {
    return NextResponse.json({ error: 'Invalid signature.' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode === 'subscription' && session.subscription) {
          const subId = typeof session.subscription === 'string' ? session.subscription : session.subscription.id;
          const customerId = typeof session.customer === 'string' ? session.customer : session.customer?.id;
          if (session.client_reference_id && customerId)
            await db.user.updateMany({
              where: { id: session.client_reference_id },
              data: { stripeCustomerId: customerId },
            });
          await applySubscription(await s.subscriptions.retrieve(subId));
        }
        break;
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        await applySubscription(event.data.object as Stripe.Subscription);
        break;
      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id;
        const user = customerId
          ? await db.user.findUnique({ where: { stripeCustomerId: customerId }, select: { id: true } })
          : null;
        if (user && invoice.id && !(await db.billingRecord.findFirst({ where: { stripeId: invoice.id } })))
          await db.billingRecord.create({
            data: {
              userId: user.id,
              plan: 'pro',
              amount: invoice.amount_paid,
              currency: invoice.currency,
              status: 'paid',
              periodStart: new Date(invoice.period_start * 1000),
              periodEnd: new Date(invoice.period_end * 1000),
              stripeId: invoice.id,
            },
          });
        break;
      }
    }
  } catch (error) {
    console.error('Billing webhook failed:', error instanceof Error ? error.name : 'unknown');
    return NextResponse.json({ error: 'Webhook handling failed.' }, { status: 500 });
  }
  return NextResponse.json({ received: true });
}
