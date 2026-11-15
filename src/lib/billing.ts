import Stripe from "stripe";

/**
 * Card payments through Stripe Checkout. Everything here stays switched off
 * until these production settings exist:
 *   STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET,
 *   STRIPE_PRICE_PRO_MONTHLY, STRIPE_PRICE_PRO_YEARLY
 * Until then the app offers "Talk to us" instead of a card form.
 * Government is invoiced by hand (see lib/plans.ts), never by card here.
 */
export type Period = "monthly" | "yearly";

let client: Stripe | null = null;

export function stripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) return null;
  client ??= new Stripe(key);
  return client;
}

export function proPrice(period: Period): string | null {
  const id =
    period === "yearly"
      ? process.env.STRIPE_PRICE_PRO_YEARLY?.trim()
      : process.env.STRIPE_PRICE_PRO_MONTHLY?.trim();
  return id || null;
}

/** True only when a card checkout can actually complete and be recorded. */
export function cardPaymentsEnabled(): boolean {
  return Boolean(
    process.env.STRIPE_SECRET_KEY?.trim() &&
      process.env.STRIPE_WEBHOOK_SECRET?.trim() &&
      proPrice("monthly") &&
      proPrice("yearly"),
  );
}

/** Which plan a Stripe price grants. Unknown prices grant nothing. */
export function planForPrice(priceId: string | null | undefined): "pro" | null {
  if (!priceId) return null;
  return priceId === proPrice("monthly") || priceId === proPrice("yearly") ? "pro" : null;
}

export function appUrl(): string {
  return (process.env.APP_URL?.trim() || "https://www.cosmogov.com").replace(/\/+$/, "");
}
