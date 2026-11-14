/**
 * Stickers: a small, honest incentive.
 *
 * A sticker marks something a person did that helped a community: starting,
 * sharing, picking up, finishing. Each one is decided by a fixed rule over
 * counts of that person's own records, so it can be checked and cannot drift.
 *
 * Deliberately absent: anything for voting or signing. A vote must never earn
 * a reward. Stickers do not rank people and do not unlock features.
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
];

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
