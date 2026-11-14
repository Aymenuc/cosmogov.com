// Transparent shared-word suggestions. Never infer ability, rank people or assign work.
const stop = new Set(
  "the and for with from this that your you our their they have has can could would should will into what which when where been were are was need needs help community mission people useful please offer available".split(
    " ",
  ),
);
const aliases: Record<string, string> = {
  tools: "equipment",
  tool: "equipment",
  mending: "repair",
  mend: "repair",
  repairs: "repair",
  repairing: "repair",
  fixing: "repair",
  fix: "repair",
  sewing: "sew",
  welcoming: "welcome",
  greeting: "welcome",
  volunteers: "volunteer",
  bikes: "bike",
  bicycles: "bike",
  bicycle: "bike",
  gardens: "garden",
  gardening: "garden",
  planting: "plant",
};
export function matchTerms(text: string): Set<string> {
  return new Set(
    (
      text
        .normalize("NFKD")
        .replace(/\p{Diacritic}/gu, "")
        .toLocaleLowerCase("en")
        .match(/[\p{L}\p{N}]+/gu) || []
    )
      .filter((word) => word.length > 2 && !stop.has(word))
      .map((word) => aliases[word] || word),
  );
}
export function sharedOfferTerms(
  task: { title: string; detail: string },
  values: Record<string, string>,
): string[] {
  const terms = matchTerms(`${task.title} ${task.detail}`),
    offered = matchTerms(Object.values(values).join(" "));
  return [...terms]
    .filter((term) => offered.has(term))
    .sort()
    .slice(0, 5);
}
