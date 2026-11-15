import { createHash } from "node:crypto";
import { db } from "@/lib/db";
import { ApiError } from "@/lib/api-server";
import { AI_LIMITS, AI_SITE_DAILY_LIMIT } from "@/lib/ai-limits";

/**
 * One budget for every AI call, so the helpers stay a civic tool and can't be
 * used as a free general-purpose chatbot or drain the shared DeepSeek balance.
 *
 * - Per person, per feature: an hourly and a daily allowance.
 * - Site-wide: a daily ceiling across everyone, so many accounts together
 *   can't run up the bill either.
 *
 * Counters live in the same RateLimitBucket table as the other rate limits,
 * so they hold across server instances. The numbers live in lib/ai-limits.ts.
 */
export type AiUse = "assistant" | "debate" | "mission" | "status";


const HOUR = 3600;
const DAY = 86400;

async function bump(scope: string, subject: string, seconds: number) {
  const bucket = Math.floor(Date.now() / (seconds * 1000));
  const expiresAt = new Date((bucket + 1) * seconds * 1000);
  const hashed = createHash("sha256").update(subject).digest("hex");
  const key = `${scope}:${hashed}:${bucket}`;
  const row = await db.rateLimitBucket.upsert({
    where: { key },
    create: { key, expiresAt },
    update: { count: { increment: 1 } },
  });
  return { count: row.count, retryAfter: Math.max(1, Math.ceil((expiresAt.getTime() - Date.now()) / 1000)) };
}

const FALLBACK = "Everything else in Cosmogov works without it.";

/**
 * Records one AI call and throws a friendly 429 when an allowance is used up.
 * Returns how many calls of this kind the person has left today.
 */
export async function spendAi(use: AiUse, userId: string | null): Promise<{ remainingToday: number | null }> {
  let remainingToday: number | null = null;
  if (use !== "status" && userId) {
    const limits = AI_LIMITS[use];
    const hour = await bump(`ai-${use}-hour`, userId, HOUR);
    if (hour.count > limits.hour)
      throw new ApiError(
        429,
        `You've used this hour's ${limits.hour} AI requests. Try again in a little while. ${FALLBACK}`,
        hour.retryAfter,
      );
    const day = await bump(`ai-${use}-day`, userId, DAY);
    if (day.count > limits.day)
      throw new ApiError(
        429,
        `You've used today's ${limits.day} AI requests. They reset tomorrow. ${FALLBACK}`,
        day.retryAfter,
      );
    remainingToday = Math.max(0, limits.day - day.count);
  }
  const site = await bump("ai-site-day", "all", DAY);
  if (site.count > AI_SITE_DAILY_LIMIT)
    throw new ApiError(
      429,
      `The AI helpers have reached today's limit for the whole site. They'll be back tomorrow. ${FALLBACK}`,
      site.retryAfter,
    );
  return { remainingToday };
}
