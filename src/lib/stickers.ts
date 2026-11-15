/**
 * Stickers: a small, honest incentive.
 *
 * A sticker marks something a person did that helped a community: starting,
 * sharing, picking up, finishing. Each one is decided by a fixed rule over
 * counts of that person's own records, so it can be checked and cannot drift.
 *
 * Deliberately absent: anything for voting or signing. A vote must never earn
 * a reward. Stickers do not rank people. What they unlock is personal and
 * visible (your home on the community map grows, your civic record fills in),
 * never extra say in a decision or access to a civic feature.
 */
export type StickerCounts = {
  missionsStarted: number;
  communitiesJoined: number;
  communitiesStarted: number;
  sourcesAdded: number;
  viewsAdded: number;
  tasksPicked: number;
  tasksDone: number;
  formsAnswered: number;
  draftsDecided: number;
  proposalsOpened: number;
  commentsWritten: number;
  /** 1 when the person has chosen a home city on the community map. */
  homeSet: number;
  /** Proposals this person opened that were the first in their city. */
  localSparks: number;
};

export const emptyCounts: StickerCounts = {
  missionsStarted: 0,
  communitiesJoined: 0,
  communitiesStarted: 0,
  sourcesAdded: 0,
  viewsAdded: 0,
  tasksPicked: 0,
  tasksDone: 0,
  formsAnswered: 0,
  draftsDecided: 0,
  proposalsOpened: 0,
  commentsWritten: 0,
  homeSet: 0,
  localSparks: 0,
};

export type StickerShape =
  "circle" | "square" | "hexagon" | "shield" | "burst" | "scallop";
export type StickerTint = "lilac" | "mint" | "sky" | "sun" | "peach";

export type StickerRule = {
  id: string;
  name: string;
  /** What to do to earn it, as an instruction. */
  how: string;
  /** Where to go to do it. */
  href: string;
  count: keyof StickerCounts;
  need: number;
  shape: StickerShape;
  tint: StickerTint;
  icon: string;
};

export const stickerRules: StickerRule[] = [
  {
    id: "first-spark",
    name: "First spark",
    how: "Start your first mission.",
    href: "/dashboard/missions",
    count: "missionsStarted",
    need: 1,
    shape: "burst",
    tint: "sun",
    icon: "spark",
  },
  {
    id: "good-neighbor",
    name: "Good neighbor",
    how: "Join a community.",
    href: "/dashboard/organizations",
    count: "communitiesJoined",
    need: 1,
    shape: "circle",
    tint: "mint",
    icon: "people",
  },
  {
    id: "host",
    name: "Host",
    how: "Start a community of your own.",
    href: "/dashboard/organizations/new",
    count: "communitiesStarted",
    need: 1,
    shape: "shield",
    tint: "peach",
    icon: "home",
  },
  {
    id: "source-spotter",
    name: "Source spotter",
    how: "Add a source to a mission.",
    href: "/dashboard/missions",
    count: "sourcesAdded",
    need: 1,
    shape: "hexagon",
    tint: "sky",
    icon: "book",
  },
  {
    id: "fresh-eyes",
    name: "Fresh eyes",
    how: "Add a point of view or a limit to a mission.",
    href: "/dashboard/missions",
    count: "viewsAdded",
    need: 1,
    shape: "scallop",
    tint: "lilac",
    icon: "eye",
  },
  {
    id: "hands-on",
    name: "Hands on",
    how: "Pick up a task.",
    href: "/dashboard/missions",
    count: "tasksPicked",
    need: 1,
    shape: "square",
    tint: "peach",
    icon: "hand",
  },
  {
    id: "done-and-dusted",
    name: "Done and dusted",
    how: "Finish a task.",
    href: "/dashboard/missions",
    count: "tasksDone",
    need: 1,
    shape: "burst",
    tint: "mint",
    icon: "check",
  },
  {
    id: "handy",
    name: "Handy",
    how: "Finish five tasks.",
    href: "/dashboard/missions",
    count: "tasksDone",
    need: 5,
    shape: "shield",
    tint: "sun",
    icon: "hammer",
  },
  {
    id: "count-me-in",
    name: "Count me in",
    how: "Answer a mission form.",
    href: "/dashboard/missions",
    count: "formsAnswered",
    need: 1,
    shape: "circle",
    tint: "sky",
    icon: "form",
  },
  {
    id: "your-call",
    name: "Your call",
    how: "Adopt a plan or publish a form.",
    href: "/dashboard/missions",
    count: "draftsDecided",
    need: 1,
    shape: "hexagon",
    tint: "lilac",
    icon: "stamp",
  },
  {
    id: "conversation-starter",
    name: "Conversation starter",
    how: "Open a proposal.",
    href: "/dashboard/proposals/new",
    count: "proposalsOpened",
    need: 1,
    shape: "scallop",
    tint: "sun",
    icon: "megaphone",
  },
  {
    id: "thinking-out-loud",
    name: "Thinking out loud",
    how: "Comment on a proposal.",
    href: "/dashboard/proposals",
    count: "commentsWritten",
    need: 1,
    shape: "square",
    tint: "peach",
    icon: "comment",
  },
  {
    id: "on-the-map",
    name: "On the map",
    how: "Plant your flag: choose your home city on the community map.",
    href: "/dashboard/cosmic-map",
    count: "homeSet",
    need: 1,
    shape: "circle",
    tint: "sky",
    icon: "pin",
  },
  {
    id: "local-spark",
    name: "Local spark",
    how: "Open the first proposal in your city.",
    href: "/dashboard/proposals/new",
    count: "localSparks",
    need: 1,
    shape: "burst",
    tint: "peach",
    icon: "flame",
  },
];

/* ─── Your home on the community map ───
 * The home grows with the number of stickers collected. It is cosmetic and
 * personal: only you see it, at city level, and it changes no permission. */

export type HomeId = "tent" | "cabin" | "house" | "tower" | "lighthouse";
export type HomeLevel = {
  id: HomeId;
  name: string;
  /** Stickers needed to live here. */
  from: number;
  /** One line about what it means, in the site's voice. */
  line: string;
};

export const homeLevels: HomeLevel[] = [
  { id: "tent", name: "Tent", from: 0, line: "Every neighborhood starts with someone who shows up." },
  { id: "cabin", name: "Cabin", from: 2, line: "You’ve put down roots. People are starting to know your name." },
  { id: "house", name: "House with a garden", from: 4, line: "Your door is open and your garden is growing." },
  { id: "tower", name: "Clock tower", from: 7, line: "People set their plans by what you get done." },
  { id: "lighthouse", name: "Lighthouse", from: 11, line: "You light the way for everyone around you." },
];

export function homeFor(earned: number): {
  current: HomeLevel;
  next: HomeLevel | null;
  /** Stickers still needed for the next home, 0 at the top. */
  toNext: number;
} {
  const count = Number.isFinite(earned) && earned > 0 ? Math.floor(earned) : 0;
  let index = 0;
  homeLevels.forEach((level, i) => {
    if (count >= level.from) index = i;
  });
  const next = homeLevels[index + 1] ?? null;
  return { current: homeLevels[index], next, toNext: next ? next.from - count : 0 };
}

/* ─── Impact: what an earned sticker stands for, in real numbers ─── */

function times(n: number, one: string, many: string): string {
  return `${n} ${n === 1 ? one : many}`;
}

export function stickerImpact(
  id: string,
  input: unknown,
  garden?: { tasksDone: number },
): string {
  const c = cleanCounts(input);
  switch (id) {
    case "first-spark":
      return `You’ve started ${times(c.missionsStarted, "mission", "missions")}. Big ideas begin like this.`;
    case "good-neighbor":
      return `You’re part of ${times(c.communitiesJoined, "community", "communities")}.`;
    case "host":
      return `You started ${times(c.communitiesStarted, "community", "communities")} for others to join.`;
    case "source-spotter":
      return `${times(c.sourcesAdded, "source", "sources")} you added help everyone check the facts.`;
    case "fresh-eyes":
      return `${times(c.viewsAdded, "point of view", "points of view")} from you shaped the drafts.`;
    case "hands-on":
      return `You’ve picked up ${times(c.tasksPicked, "task", "tasks")}.`;
    case "done-and-dusted":
    case "handy": {
      const flowers = garden && garden.tasksDone > 0 ? ` Your missions’ garden has ${times(garden.tasksDone, "flower", "flowers")}.` : "";
      return `${times(c.tasksDone, "task", "tasks")} finished by you, each one a flower in the shared garden.${flowers}`;
    }
    case "count-me-in":
      return `You answered ${times(c.formsAnswered, "form", "forms")}, so organizers heard from you.`;
    case "your-call":
      return `You adopted or published ${times(c.draftsDecided, "draft", "drafts")}. People decided, not the AI.`;
    case "conversation-starter":
      return `You opened ${times(c.proposalsOpened, "proposal", "proposals")} for your community to discuss.`;
    case "thinking-out-loud":
      return `You added ${times(c.commentsWritten, "comment", "comments")} to the conversation.`;
    case "on-the-map":
      return "Your home is on the community map, and it grows with every sticker.";
    case "local-spark":
      return c.localSparks > 1
        ? `You opened the very first proposal in ${c.localSparks} cities.`
        : "You opened the very first proposal in your city.";
    default:
      return "";
  }
}

export type StickerState = StickerRule & {
  earned: boolean;
  /** Progress toward `need`, never more than `need`. */
  have: number;
};

/** Anything that is not a non-negative whole number counts as zero. */
export function cleanCounts(input: unknown): StickerCounts {
  const source =
    input && typeof input === "object" && !Array.isArray(input)
      ? (input as Record<string, unknown>)
      : {};
  const counts = { ...emptyCounts };
  for (const key of Object.keys(emptyCounts) as (keyof StickerCounts)[]) {
    const value = source[key];
    if (typeof value === "number" && Number.isFinite(value) && value > 0)
      counts[key] = Math.floor(value);
  }
  return counts;
}

export function stickerStates(input: unknown): StickerState[] {
  const counts = cleanCounts(input);
  return stickerRules.map((rule) => {
    const have = Math.min(counts[rule.count], rule.need);
    return { ...rule, have, earned: have >= rule.need };
  });
}

/** The next sticker worth pointing at: the unearned one closest to done. */
export function nextSticker(states: StickerState[]): StickerState | null {
  const open = states.filter((state) => !state.earned);
  if (!open.length) return null;
  return open.reduce((best, state) =>
    state.have / state.need > best.have / best.need ? state : best,
  );
}

/** The shared garden shows one flower per finished task, up to a full bed. */
export const GARDEN_BED = 12;
export function gardenFlowers(tasksDone: unknown): {
  planted: number;
  extra: number;
} {
  const done =
    typeof tasksDone === "number" && Number.isFinite(tasksDone) && tasksDone > 0
      ? Math.floor(tasksDone)
      : 0;
  return {
    planted: Math.min(done, GARDEN_BED),
    extra: Math.max(0, done - GARDEN_BED),
  };
}
