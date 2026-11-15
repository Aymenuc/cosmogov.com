/**
 * The three plans, in one place. The homepage, Settings, the admin page and
 * the AI budget all read from here, so what we sell is what we enforce.
 * Only list features that exist today. Client-safe: no server imports.
 */
export type PlanId = "community" | "pro" | "government";

export interface AiAllowance {
  assistant: { hour: number; day: number };
  debate: { hour: number; day: number };
  mission: { hour: number; day: number };
}

export interface Plan {
  id: PlanId;
  name: string;
  desc: string;
  /** US dollars per month; yearly billing is this × 12 × 0.8. */
  monthly: number;
  yearlyPerMonth: number;
  features: string[];
  ai: AiAllowance;
}

export const PLANS: Record<PlanId, Plan> = {
  community: {
    id: "community",
    name: "Community",
    desc: "For people coming together.",
    monthly: 0,
    yearlyPerMonth: 0,
    features: [
      "Create and join communities",
      "Proposals, voting and every participation tool",
      "Missions with AI research, plans and forms",
      "AI assistant: 25 questions a day",
    ],
    ai: {
      assistant: { hour: 10, day: 25 },
      debate: { hour: 20, day: 60 },
      mission: { hour: 12, day: 30 },
    },
  },
  pro: {
    id: "pro",
    name: "Pro",
    desc: "For communities that use AI help every day.",
    monthly: 49,
    yearlyPerMonth: 39,
    features: [
      "Everything in Community",
      "AI assistant: 150 questions a day",
      "Mission AI: 120 runs a day",
      "Debate helpers: 300 replies a day",
      "Priority email support",
    ],
    ai: {
      assistant: { hour: 40, day: 150 },
      debate: { hour: 80, day: 300 },
      mission: { hour: 30, day: 120 },
    },
  },
  government: {
    id: "government",
    name: "Government",
    desc: "For councils and public bodies.",
    monthly: 199,
    yearlyPerMonth: 159,
    features: [
      "Everything in Pro",
      "Government portal accounts for your officials",
      "Formal proposals with signature review",
      "Set-up help and invoice billing",
    ],
    ai: {
      assistant: { hour: 40, day: 150 },
      debate: { hour: 80, day: 300 },
      mission: { hour: 30, day: 120 },
    },
  },
};

export const PLAN_ORDER: PlanId[] = ["community", "pro", "government"];

/** Older accounts may carry former plan names; map them to today's plans. */
const LEGACY: Record<string, PlanId> = { team: "pro", guild: "government", enterprise: "government" };

export function planId(value: string | null | undefined): PlanId {
  const v = (value ?? "community").toLowerCase();
  if (v in PLANS) return v as PlanId;
  return LEGACY[v] ?? "community";
}

export function planFor(value: string | null | undefined): Plan {
  return PLANS[planId(value)];
}

/** Ceiling on AI requests across the whole site, per day, by plan group. */
export const AI_SITE_DAILY_LIMIT = { free: 400, paid: 3000 } as const;
