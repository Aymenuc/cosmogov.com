/**
 * Civic games: each game builds its rounds from a seed, so the same run can
 * be rebuilt on the server to check answers. Rounds sent to the browser never
 * contain the answers; scoring always happens here.
 */
import { rng, seedFrom, type Rng } from "./rng";
import { TRAPS } from "./thinking-traps";
import { STORIES } from "./turning-points";

export type GameSlug =
  | "cognitive-warfare"
  | "signal-detective"
  | "strategic-command"
  | "chrono-autopsy"
  | "oracle-protocol"
  | "neural-consensus";

/** What the browser sees for one round. */
export type PublicRound =
  | { kind: "choice"; prompt: string; context?: string; options: string[]; chart?: { values: number[]; closeAt: number; facts: string[] } }
  | { kind: "timeline"; prompt: string; context: string; events: string[] }
  | { kind: "allocate"; prompt: string; budget: number; areas: string[]; projects: { id: string; name: string; area: string; cost: number; helps: number }[] }
  | { kind: "estimate"; prompt: string; sample: boolean[]; townSize: number }
  | { kind: "residents"; prompt: string; residents: { name: string; wants: string; refuses: string }[]; options: { label: string; features: string[] }[] };

export type Answer = number | string[] | { value: number; low: number; high: number };

export interface Feedback {
  points: number;
  correct: boolean;
  headline: string;
  explanation: string;
  extra?: string;
  answerIndex?: number;
}

interface BuiltRound {
  public: PublicRound;
  check: (answer: Answer) => Feedback;
}

export interface GameInfo {
  slug: GameSlug;
  name: string;
  tagline: string;
  skill: string;
  how: string;
  /** What the game teaches, in one sentence. */
  learn: string;
  /** Where to use the skill for real in Cosmogov. */
  apply: { href: string; label: string };
  rounds: number;
  build: (r: Rng) => BuiltRound[];
}

const clamp = (n: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, n));

/* ── 1. Spot the thinking trap ─────────────────────────────────── */
function thinkingTraps(r: Rng): BuiltRound[] {
  return r.shuffle(TRAPS).slice(0, 8).map((t) => {
    const others = r.shuffle(TRAPS.filter((o) => o.trap !== t.trap)).slice(0, 3).map((o) => o.trap);
    const options = r.shuffle([t.trap, ...others]);
    const answerIndex = options.indexOf(t.trap);
    return {
      public: { kind: "choice", prompt: "Which thinking trap is this?", context: t.quote, options },
      check: (a) => {
        const correct = a === answerIndex;
        return {
          points: correct ? 100 : 0,
          correct,
          answerIndex,
          headline: correct ? `Yes: ${t.trap}` : `It's ${t.trap}`,
          explanation: t.why,
          extra: `A fairer way to say it: “${t.fairer}”`,
        };
      },
    };
  });
}

/* ── 2. Fair count? ────────────────────────────────────────────── */
const COUNT_OPTIONS = [
  "Looks fair",
  "A sudden burst from brand-new accounts",
  "The same few people signing again and again",
  "Signatures counted after it closed",
] as const;
const COUNT_WHY = [
  "Steady daytime signing, a small share of new accounts and about one signature per person: nothing stands out.",
  "Most of a night-time spike came from accounts created that same day. That pattern deserves a closer look before the signatures count.",
  "Far more signatures than different people means some signed many times. Each person should count once.",
  "Signatures kept arriving after the closing hour. Late ones shouldn't count towards the result.",
];
function fairCount(r: Rng): BuiltRound[] {
  const labels = r.shuffle([0, 0, 1, 2, 3, r.int(0, 3)]);
  return labels.map((label) => {
    const hours = 24;
    const closeAt = label === 3 ? r.int(17, 20) : 23;
    const values = Array.from({ length: hours }, (_, h) => {
      const daytime = h >= 8 && h <= 21 ? 1 : 0.15;
      return Math.round((r.int(6, 14) * daytime + r.int(0, 3)) * (h >= closeAt + 1 && label !== 3 ? 0 : 1));
    });
    let newShare = r.int(4, 14);
    let people = 0;
    if (label === 1) {
      const spike = r.int(1, 5);
      values[spike] += r.int(45, 80);
      newShare = r.int(58, 82);
    }
    if (label === 3) {
      for (let h = closeAt + 1; h < hours; h++) values[h] = r.int(10, 24);
    }
    const total = values.reduce((s, v) => s + v, 0);
    people = label === 2 ? Math.round(total / r.int(3, 5)) : total - r.int(0, 3);
    const facts = [
      `${total} signatures from ${people} different people`,
      `${newShare}% from accounts created that day`,
      `Signing closed at ${closeAt}:00`,
    ];
    return {
      public: {
        kind: "choice",
        prompt: "A petition's last 24 hours. Is this count fair?",
        options: [...COUNT_OPTIONS],
        chart: { values, closeAt, facts },
      },
      check: (a) => {
        const correct = a === label;
        return {
          points: correct ? 100 : 0,
          correct,
          answerIndex: label,
          headline: correct ? "Well spotted" : `It was: ${COUNT_OPTIONS[label].toLowerCase()}`,
          explanation: COUNT_WHY[label],
        };
      },
    };
  });
}

/* ── 3. Budget puzzle ──────────────────────────────────────────── */
const AREAS = ["North", "Riverside", "Hilltop"];
const PROJECT_NAMES = [
  "Bench and shade trees", "Safer school crossing", "Youth club repairs", "Bus shelter", "Street lighting",
  "Community fridge", "Playground upgrade", "Accessible footpath", "Pocket park", "Bike parking",
  "Public toilets", "Library late opening", "Flood drainage", "Sports court resurfacing",
];
function budgetPuzzle(r: Rng): BuiltRound[] {
  const rounds: BuiltRound[] = [];
  while (rounds.length < 3) {
    const names = r.shuffle(PROJECT_NAMES).slice(0, 7);
    const projects = names.map((name, i) => ({
      id: `p${i}`,
      name,
      area: AREAS[i % 3],
      cost: r.int(4, 18) * 5,
      helps: r.int(2, 30) * 10,
    }));
    const totalCost = projects.reduce((s, p) => s + p.cost, 0);
    const budget = Math.round((totalCost * (0.42 + r.next() * 0.12)) / 5) * 5;
    // Best possible: try every combination (2^7) that fits the budget and serves every area.
    let best = -1;
    let bestSet: string[] = [];
    for (let mask = 0; mask < 1 << projects.length; mask++) {
      const chosen = projects.filter((_, i) => mask & (1 << i));
      const cost = chosen.reduce((s, p) => s + p.cost, 0);
      if (cost > budget || !AREAS.every((a) => chosen.some((p) => p.area === a))) continue;
      const helped = chosen.reduce((s, p) => s + p.helps, 0);
      if (helped > best) {
        best = helped;
        bestSet = chosen.map((p) => p.id);
      }
    }
    if (best <= 0) continue;
    rounds.push({
      public: {
        kind: "allocate",
        prompt: "Fund the projects that help the most people, within budget, with at least one project in every area.",
        budget,
        areas: AREAS,
        projects,
      },
      check: (a) => {
        const ids = Array.isArray(a) ? a.filter((x): x is string => typeof x === "string") : [];
        const chosen = projects.filter((p) => ids.includes(p.id));
        const cost = chosen.reduce((s, p) => s + p.cost, 0);
        const helped = chosen.reduce((s, p) => s + p.helps, 0);
        const missing = AREAS.filter((area) => !chosen.some((p) => p.area === area));
        const bestNames = projects.filter((p) => bestSet.includes(p.id)).map((p) => p.name).join(", ");
        if (cost > budget)
          return { points: 0, correct: false, headline: "Over budget", explanation: `That plan costs €${cost}k against €${budget}k.`, extra: `The best plan helps ${best} people: ${bestNames}.` };
        if (missing.length)
          return { points: 0, correct: false, headline: `${missing.join(" and ")} got nothing`, explanation: "Every area needs at least one project.", extra: `The best plan helps ${best} people: ${bestNames}.` };
        const points = Math.round((helped / best) * 100);
        return {
          points,
          correct: points === 100,
          headline: points === 100 ? "The best possible plan" : `${points}% of the best plan`,
          explanation: `Your plan helps ${helped} people for €${cost}k. The best plan helps ${best}.`,
          extra: points === 100 ? undefined : `Best plan: ${bestNames}.`,
        };
      },
    });
  }
  return rounds;
}

/* ── 4. Where did it go wrong? ─────────────────────────────────── */
function turningPoints(r: Rng): BuiltRound[] {
  return r.shuffle(STORIES).slice(0, 5).map((s) => ({
    public: { kind: "timeline", prompt: `${s.title}: where did it start to go wrong?`, context: s.outcome, events: s.events },
    check: (a) => {
      const correct = a === s.turn;
      const near = typeof a === "number" && Math.abs(a - s.turn) === 1;
      return {
        points: correct ? 100 : near ? 40 : 0,
        correct,
        answerIndex: s.turn,
        headline: correct ? "That's the turning point" : near ? "Close: one step off" : "Not quite",
        explanation: s.why,
      };
    },
  }));
}

/* ── 5. Read the room ──────────────────────────────────────────── */
function readTheRoom(r: Rng): BuiltRound[] {
  const sizes = [12, 25, 50, 100, 200];
  return sizes.map((n) => {
    const truth = r.int(18, 82);
    const sample = Array.from({ length: n }, () => r.next() * 100 < truth);
    const yes = sample.filter(Boolean).length;
    const sampleShare = Math.round((yes / n) * 100);
    const margin = Math.round(196 * Math.sqrt((truth / 100) * (1 - truth / 100) / n));
    return {
      public: {
        kind: "estimate",
        prompt: `We asked ${n} randomly chosen residents. What share of the whole town supports the plan?`,
        sample,
        townSize: 12000,
      },
      check: (a) => {
        const v = typeof a === "object" && !Array.isArray(a) ? a : { value: 50, low: 0, high: 100 };
        const low = clamp(Math.min(v.low, v.high));
        const high = clamp(Math.max(v.low, v.high));
        const value = clamp(v.value);
        const inside = truth >= low && truth <= high;
        const width = high - low;
        const accuracy = clamp(100 - Math.abs(value - truth) * 3);
        const points = Math.round(clamp(inside ? accuracy - Math.max(0, width - 2 * margin) * 0.8 : accuracy * 0.4));
        return {
          points,
          correct: inside && Math.abs(value - truth) <= margin,
          headline: `The whole town: ${truth}% support`,
          explanation: `Your sample showed ${sampleShare}%. With ${n} people, a sample usually lands within about ±${margin} points of the truth, so a range of roughly ${clamp(sampleShare - margin)}–${clamp(sampleShare + margin)}% was a fair guess.`,
          extra: inside ? `Your range ${low}–${high}% caught it.` : `Your range ${low}–${high}% missed it.`,
        };
      },
    };
  });
}

/* ── 6. Common ground ──────────────────────────────────────────── */
const FEATURES = [
  "Keep the bus stop", "Add a bike lane", "More parking", "Higher parking fees",
  "Plant street trees", "Weekly market space", "Car-free Saturdays", "Brighter night lighting",
];
const NAMES = ["Amira", "Ben", "Chloé", "Dawit", "Elena", "Farid", "Grace", "Hugo", "Ines", "Jonas", "Kofi", "Lena"];
function commonGround(r: Rng): BuiltRound[] {
  const rounds: BuiltRound[] = [];
  let guard = 0;
  while (rounds.length < 4 && guard++ < 400) {
    const residents = r.shuffle(NAMES).slice(0, 6).map((name) => {
      const [wants, refuses] = r.shuffle(FEATURES).slice(0, 2);
      return { name, wants, refuses };
    });
    const options = Array.from({ length: 4 }, (_, i) => ({
      label: `Plan ${"ABCD"[i]}`,
      features: r.shuffle(FEATURES).slice(0, 3),
    }));
    const accepts = options.map((o) => residents.filter((p) => o.features.includes(p.wants) && !o.features.includes(p.refuses)));
    const counts = accepts.map((a) => a.length);
    const max = Math.max(...counts);
    if (max < 2 || counts.filter((c) => c === max).length !== 1) continue;
    const answerIndex = counts.indexOf(max);
    rounds.push({
      public: {
        kind: "residents",
        prompt: "Six neighbours, four plans for the high street. Which plan would the most of them accept?",
        residents,
        options,
      },
      check: (a) => {
        const correct = a === answerIndex;
        return {
          points: correct ? 100 : typeof a === "number" && counts[a] === max - 1 ? 40 : 0,
          correct,
          answerIndex,
          headline: correct ? `Yes: ${max} of 6 would accept ${options[answerIndex].label}` : `${options[answerIndex].label} wins ${max} of 6`,
          explanation: "A neighbour accepts a plan when it includes what they want and nothing they refuse.",
          extra: options.map((o, i) => `${o.label}: ${accepts[i].map((p) => p.name).join(", ") || "nobody"}`).join(" · "),
        };
      },
    });
  }
  return rounds;
}

export const GAMES: Record<GameSlug, GameInfo> = {
  "cognitive-warfare": {
    slug: "cognitive-warfare",
    name: "Spot the thinking trap",
    tagline: "Hear the flaw, then say it fairer",
    skill: "Reasoning",
    how: "Read a line heard at a community meeting and name the thinking trap. Each answer shows a fairer way to make the point.",
    learn: "Common thinking traps, and how to make your point without them, so discussions stay fair and persuasive.",
    apply: { href: "/dashboard/proposals", label: "Join a discussion on a proposal" },
    rounds: 8,
    build: thinkingTraps,
  },
  "signal-detective": {
    slug: "signal-detective",
    name: "Fair count?",
    tagline: "Check a petition before it counts",
    skill: "Data sense",
    how: "Study a petition's last 24 hours and decide whether the count looks fair, or which warning sign you see.",
    learn: "The warning signs of an unfair count: bursts from new accounts, repeat signers and late signatures.",
    apply: { href: "/dashboard/participation/initiatives", label: "See how initiatives gather support" },
    rounds: 6,
    build: fairCount,
  },
  "strategic-command": {
    slug: "strategic-command",
    name: "Budget puzzle",
    tagline: "Help the most people with the money you have",
    skill: "Trade-offs",
    how: "Pick projects within the budget, with at least one in every area. Your plan is scored against the best possible one.",
    learn: "How to spread a fixed budget fairly: compare cost with benefit, and make sure no area is left out.",
    apply: { href: "/dashboard/participation/budget", label: "Share out a real budget" },
    rounds: 3,
    build: budgetPuzzle,
  },
  "chrono-autopsy": {
    slug: "chrono-autopsy",
    name: "Where did it go wrong?",
    tagline: "Find the moment a project slipped",
    skill: "Hindsight",
    how: "Read how a community project unfolded and pick the moment it really started to go wrong.",
    learn: "Why community projects fail, so you can spot the warning signs early in your own.",
    apply: { href: "/dashboard/missions", label: "Start a mission and plan it well" },
    rounds: 5,
    build: turningPoints,
  },
  "oracle-protocol": {
    slug: "oracle-protocol",
    name: "Read the room",
    tagline: "Guess the town from a sample",
    skill: "Estimation",
    how: "See a random sample of residents, then estimate the whole town's support and how sure you are. Tighter ranges score more, if they catch the truth.",
    learn: "How much a small sample can tell you, and how sure you can be about it.",
    apply: { href: "/dashboard/participation/surveys", label: "Run a survey" },
    rounds: 5,
    build: readTheRoom,
  },
  "neural-consensus": {
    slug: "neural-consensus",
    name: "Common ground",
    tagline: "Find the plan most neighbours can live with",
    skill: "Compromise",
    how: "Each neighbour has one thing they want and one they refuse. Find the plan that the most of them would accept.",
    learn: "How to find options that most people can accept, instead of fighting over favourites.",
    apply: { href: "/dashboard/assembly-hall", label: "Talk an issue through" },
    rounds: 4,
    build: commonGround,
  },
};

export const GAME_ORDER: GameSlug[] = [
  "strategic-command",
  "neural-consensus",
  "oracle-protocol",
  "signal-detective",
  "cognitive-warfare",
  "chrono-autopsy",
];

export function isGameSlug(slug: string): slug is GameSlug {
  return slug in GAMES;
}

/** Today's shared challenge uses the same seed for everyone. */
export function dailySeed(slug: GameSlug, day = new Date()) {
  return seedFrom(`daily:${slug}:${day.toISOString().slice(0, 10)}`);
}

export function buildRun(slug: GameSlug, seed: number) {
  return GAMES[slug].build(rng(seed));
}
