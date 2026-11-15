/**
 * Reputation tiers in plain words. Older stored rows may still carry the
 * former cosmic names; tierName() maps those so nothing stale shows up.
 */
export const TIERS = [
  { max: 200, name: "Newcomer", color: "#6741D9" },
  { max: 400, name: "Neighbour", color: "#226784" },
  { max: 600, name: "Regular", color: "#28745B" },
  { max: 800, name: "Pillar", color: "#916500" },
  { max: Infinity, name: "Cornerstone", color: "#A44231" },
] as const;

const LEGACY: Record<string, string> = {
  Stardust: "Newcomer",
  Nova: "Neighbour",
  Pulsar: "Regular",
  Quasar: "Pillar",
  Nebula: "Cornerstone",
};

export function tierFor(score: number) {
  return TIERS.find((t) => score <= t.max) ?? TIERS[0];
}

export function tierName(name: string | null | undefined) {
  if (!name) return TIERS[0].name;
  return LEGACY[name] ?? name;
}

export function tierColor(name: string | null | undefined) {
  const n = tierName(name);
  return TIERS.find((t) => t.name === n)?.color ?? TIERS[0].color;
}
