/**
 * "A year at the town hall": a 12-month town simulation. Pure and
 * deterministic, so the browser can show it and the server can replay the
 * same decisions to score them. Used by the solo game and by council rooms.
 */
import { rng, seedFrom } from "./rng";

export const GROUPS = ["families", "elders", "youth", "business"] as const;
export type Group = (typeof GROUPS)[number];
export const GROUP_INFO: Record<Group, { name: string; emoji: string; color: string }> = {
  families: { name: "Families", emoji: "👪", color: "#6741D9" },
  elders: { name: "Older residents", emoji: "🧓", color: "#A44231" },
  youth: { name: "Young people", emoji: "🛹", color: "#28745B" },
  business: { name: "Local businesses", emoji: "🛍️", color: "#916500" },
};
export const DISTRICTS = ["Old Town", "Riverside", "Hillside", "Station"] as const;

export interface Effect {
  budget?: number;
  trust?: number;
  env?: number;
  mood?: Partial<Record<Group, number>>;
  /** A building that appears on the map. */
  build?: { district: number; kind: "park" | "housing" | "clinic" | "market" | "youth" | "bus" | "factory" | "plaza" };
  note: string;
}
export interface Dilemma {
  id: string;
  title: string;
  text: string;
  options: { label: string; effect: Effect }[];
}

export const DILEMMAS: Dilemma[] = [
  {
    id: "empty-lot",
    title: "The empty lot",
    text: "A big empty lot sits in Riverside. Developers, gardeners and the football club all want it.",
    options: [
      { label: "Sell it for flats", effect: { budget: 25, env: -6, mood: { families: 6, youth: 2, elders: -4, business: 4 }, build: { district: 1, kind: "housing" }, note: "New flats ease the housing squeeze; some miss the open space." } },
      { label: "Make it a park", effect: { budget: -15, env: 10, mood: { families: 8, elders: 6, youth: 3, business: -2 }, build: { district: 1, kind: "park" }, note: "Riverside gets a green heart. It costs money and brings none in." } },
      { label: "A youth sports ground", effect: { budget: -10, env: 2, mood: { youth: 12, families: 4, elders: -5 }, build: { district: 1, kind: "youth" }, note: "Young people finally have somewhere to play; older neighbours worry about noise." } },
    ],
  },
  {
    id: "bus-cuts",
    title: "The bus company wants cuts",
    text: "The bus company says the evening routes lose money and asks for a subsidy or cuts.",
    options: [
      { label: "Pay the subsidy", effect: { budget: -15, env: 4, mood: { elders: 8, youth: 6, business: 3 }, build: { district: 3, kind: "bus" }, note: "Buses keep running. Older and younger residents rely on them most." } },
      { label: "Cut evening buses", effect: { budget: 8, env: -4, mood: { elders: -10, youth: -8, business: -3 }, note: "Money saved, but people without cars are stuck at home in the evening." } },
    ],
  },
  {
    id: "night-market",
    title: "A night market",
    text: "Traders want a weekly night market in the Old Town square.",
    options: [
      { label: "Yes, every Friday", effect: { budget: 6, mood: { business: 10, youth: 8, elders: -6 }, build: { district: 0, kind: "market" }, note: "The square comes alive on Fridays. Some older neighbours lose sleep." } },
      { label: "Once a month, ends at 10pm", effect: { budget: 3, mood: { business: 5, youth: 4, elders: -1, families: 2 }, build: { district: 0, kind: "market" }, note: "A careful compromise that most people can live with." } },
      { label: "No market", effect: { mood: { business: -6, youth: -5, elders: 3 }, note: "Things stay quiet. Traders feel ignored." } },
    ],
  },
  {
    id: "clinic",
    title: "The health clinic",
    text: "The only clinic in Hillside may close unless the town helps with the rent.",
    options: [
      { label: "Help with the rent", effect: { budget: -14, mood: { elders: 12, families: 6 }, build: { district: 2, kind: "clinic" }, note: "The clinic stays. For older residents it's a lifeline." } },
      { label: "Let it close", effect: { budget: 0, trust: -5, mood: { elders: -14, families: -6 }, note: "People now travel across town for a doctor. Trust drops." } },
    ],
  },
  {
    id: "factory",
    title: "A factory wants to move in",
    text: "A packaging factory offers 80 jobs if it can build near the Station.",
    options: [
      { label: "Welcome it", effect: { budget: 18, env: -12, mood: { business: 8, youth: 5, families: -3, elders: -3 }, build: { district: 3, kind: "factory" }, note: "Jobs and taxes arrive, and so do lorries and noise." } },
      { label: "Only with strict green rules", effect: { budget: 8, env: -4, mood: { business: 4, youth: 3 }, build: { district: 3, kind: "factory" }, note: "Fewer jobs than hoped, but cleaner air." } },
      { label: "Say no", effect: { env: 3, mood: { business: -6, youth: -4 }, note: "The air stays clean. Young people still look elsewhere for work." } },
    ],
  },
  {
    id: "school-street",
    title: "School streets",
    text: "Parents ask to close the roads outside schools to cars at drop-off time.",
    options: [
      { label: "Close them at school times", effect: { env: 5, mood: { families: 10, business: -5 }, note: "Children walk safely; delivery drivers grumble." } },
      { label: "Add crossing guards instead", effect: { budget: -6, mood: { families: 5, elders: 2 }, note: "Safer crossings without closing roads." } },
      { label: "Do nothing", effect: { trust: -3, mood: { families: -8 }, note: "Parents feel unheard." } },
    ],
  },
  {
    id: "heatwave",
    title: "A summer heatwave",
    text: "Temperatures hit 39°C. Older residents and young children are most at risk.",
    options: [
      { label: "Open cool rooms and check on people", effect: { budget: -8, trust: 6, mood: { elders: 10, families: 4 }, note: "Volunteers knock on doors. Nobody is left alone in the heat." } },
      { label: "Plant shade trees for next year", effect: { budget: -10, env: 8, mood: { families: 3, elders: 2 }, build: { district: 0, kind: "park" }, note: "It helps next summer, but this one is hard." } },
      { label: "Post advice online", effect: { budget: -1, mood: { elders: -6 }, note: "Many older residents never see it." } },
    ],
  },
  {
    id: "skatepark",
    title: "Skaters in the square",
    text: "Teenagers skate in the Old Town square. Some residents complain about noise.",
    options: [
      { label: "Build them a skatepark", effect: { budget: -12, mood: { youth: 14, elders: 4, families: 2 }, build: { district: 2, kind: "youth" }, note: "Skaters get their own space, and the square gets quieter." } },
      { label: "Ban skating in the square", effect: { mood: { youth: -12, elders: 5 }, trust: -2, note: "Quieter square, angry teenagers." } },
      { label: "Talk it through with both sides", effect: { budget: -2, trust: 6, mood: { youth: 4, elders: 3 }, note: "They agree on skating hours. Slower, but people feel heard." } },
    ],
  },
  {
    id: "rents",
    title: "Rents are rising",
    text: "Rents jumped 12% this year. Young people and families struggle to stay.",
    options: [
      { label: "Build affordable homes", effect: { budget: -20, mood: { youth: 10, families: 10, business: 2 }, build: { district: 2, kind: "housing" }, note: "A long-term fix with a big price tag." } },
      { label: "Rent help for those in need", effect: { budget: -10, mood: { youth: 5, families: 6 }, note: "Quick relief, but it doesn't add homes." } },
      { label: "Leave it to the market", effect: { trust: -4, mood: { youth: -10, families: -8, business: 3 }, note: "Some neighbours move away." } },
    ],
  },
  {
    id: "shops-empty",
    title: "Empty shop fronts",
    text: "Six shops on the high street closed this year.",
    options: [
      { label: "Lower business rates for a year", effect: { budget: -10, mood: { business: 12, youth: 2 }, note: "New tenants move in. The town earns less for a while." } },
      { label: "Let pop-ups and artists use them", effect: { budget: -2, mood: { business: 4, youth: 6, families: 2 }, build: { district: 0, kind: "plaza" }, note: "The street feels alive again, cheaply." } },
      { label: "Wait and see", effect: { mood: { business: -8 }, note: "More shutters come down." } },
    ],
  },
  {
    id: "flood",
    title: "Flood warning",
    text: "Engineers say Riverside could flood within five years.",
    options: [
      { label: "Build flood defences now", effect: { budget: -22, env: 4, trust: 4, mood: { families: 5, elders: 5, business: 4 }, note: "Expensive, but Riverside sleeps easier." } },
      { label: "Make a plan with residents", effect: { budget: -4, trust: 8, mood: { families: 3, elders: 3 }, note: "Residents help map the risks. A plan, not walls yet." } },
      { label: "Put it off", effect: { trust: -6, mood: { families: -4, elders: -4 }, note: "The warning is in the paper. People notice." } },
    ],
  },
  {
    id: "festival",
    title: "The summer festival",
    text: "The festival needs money this year or it won't happen.",
    options: [
      { label: "Fund it fully", effect: { budget: -8, mood: { youth: 8, families: 6, business: 6, elders: 2 }, note: "A great weekend for almost everyone." } },
      { label: "Ask local sponsors", effect: { budget: -2, mood: { youth: 4, families: 3, business: 4 }, note: "A smaller festival, paid for together." } },
      { label: "Cancel it", effect: { budget: 0, mood: { youth: -6, families: -4, business: -6 }, note: "A quiet summer." } },
    ],
  },
  {
    id: "budget-gap",
    title: "A budget gap",
    text: "Energy bills rose. The town is short this year.",
    options: [
      { label: "Raise local tax a little", effect: { budget: 20, trust: -4, mood: { business: -5, families: -3, elders: -3 }, note: "The gap closes; nobody enjoys paying more." } },
      { label: "Cut library hours", effect: { budget: 10, mood: { elders: -6, youth: -6, families: -4 }, note: "Money saved, but a warm, free place closes early." } },
      { label: "Solar panels on public buildings", effect: { budget: -10, env: 10, mood: { youth: 3 }, note: "Costs now, saves for years." } },
    ],
  },
  {
    id: "lighting",
    title: "Dark streets",
    text: "Residents say some paths feel unsafe after dark.",
    options: [
      { label: "New LED lighting", effect: { budget: -8, env: 2, mood: { elders: 5, families: 4, youth: 4 }, note: "Brighter, cheaper to run, safer walks home." } },
      { label: "More police patrols", effect: { budget: -10, mood: { elders: 6, youth: -4 }, note: "Some feel safer; some young people feel watched." } },
      { label: "Walk the routes with residents first", effect: { budget: -1, trust: 6, mood: { elders: 2, youth: 2 }, note: "Residents show where it's really dark. Fixes come next month." } },
    ],
  },
  {
    id: "volunteers",
    title: "Volunteers burning out",
    text: "The food bank and repair café rely on a few tired volunteers.",
    options: [
      { label: "Pay a part-time coordinator", effect: { budget: -6, trust: 4, mood: { elders: 4, families: 4 }, note: "Volunteers get support and come back." } },
      { label: "Thank them publicly", effect: { trust: 2, mood: { elders: 1 }, note: "Kind, but it doesn't lighten the load." } },
    ],
  },
  {
    id: "cars",
    title: "Car-free Saturdays",
    text: "Some want the high street car-free on Saturdays.",
    options: [
      { label: "Try it for three months", effect: { env: 6, mood: { families: 5, youth: 4, business: -2, elders: -2 }, note: "Footfall rises once people get used to it." } },
      { label: "Car-free, with a shuttle and loading hours", effect: { budget: -5, env: 5, mood: { families: 4, youth: 3, business: 3, elders: 2 }, note: "Carefully designed, so almost everyone gains." } },
      { label: "Keep the cars", effect: { mood: { business: 2, families: -3 }, note: "Nothing changes." } },
    ],
  },
];

export interface TownState {
  month: number;
  budget: number;
  trust: number;
  env: number;
  mood: Record<Group, number>;
  buildings: { district: number; kind: NonNullable<Effect["build"]>["kind"]; month: number }[];
  log: { month: number; title: string; choice: string; note: string; asked: boolean }[];
}

export const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export function startState(): TownState {
  return { month: 0, budget: 60, trust: 50, env: 50, mood: { families: 50, elders: 50, youth: 50, business: 50 }, buildings: [], log: [] };
}

/** The year's 12 dilemmas, in order, from a seed. */
export function yearOf(seed: number): Dilemma[] {
  return rng(seed).shuffle(DILEMMAS).slice(0, 12);
}

export function newSeed(text: string) {
  return seedFrom(text);
}

const clamp = (n: number) => Math.max(0, Math.min(100, n));
/** Asking residents first: a little money and time, a little trust. */
export const ASK_COST = 3;

export function applyDecision(state: TownState, dilemma: Dilemma, choice: number, asked: boolean): TownState {
  const option = dilemma.options[choice] ?? dilemma.options[0];
  const e = option.effect;
  const mood = { ...state.mood };
  for (const g of GROUPS) mood[g] = clamp(mood[g] + (e.mood?.[g] ?? 0) - 1); // things drift down a little each month
  return {
    month: state.month + 1,
    budget: state.budget + (e.budget ?? 0) - (asked ? ASK_COST : 0) + 4, // a small monthly income
    trust: clamp(state.trust + (e.trust ?? 0) + (asked ? 3 : -1)),
    env: clamp(state.env + (e.env ?? 0)),
    mood,
    buildings: e.build ? [...state.buildings, { ...e.build, month: state.month }] : state.buildings,
    log: [...state.log, { month: state.month, title: dilemma.title, choice: option.label, note: e.note, asked }],
  };
}

export function replay(seed: number, decisions: { choice: number; asked: boolean }[]) {
  const year = yearOf(seed);
  let s = startState();
  decisions.slice(0, 12).forEach((d, i) => (s = applyDecision(s, year[i], d.choice, d.asked)));
  return s;
}

export interface Verdict {
  score: number;
  average: number;
  lowest: { group: Group; mood: number };
  headline: string;
  lessons: string[];
}

/** End of year: fairness counts as much as the average. */
export function verdict(s: TownState): Verdict {
  const moods = GROUPS.map((g) => s.mood[g]);
  const average = Math.round(moods.reduce((a, b) => a + b, 0) / moods.length);
  const lowGroup = GROUPS.reduce((lo, g) => (s.mood[g] < s.mood[lo] ? g : lo), GROUPS[0]);
  const lowest = { group: lowGroup, mood: s.mood[lowGroup] };
  const debt = Math.min(0, s.budget);
  const score = Math.max(0, Math.round(average * 3 + lowest.mood * 3 + s.trust * 2 + s.env * 2 + Math.min(40, Math.max(0, s.budget)) + debt * 2));
  const asked = s.log.filter((l) => l.asked).length;
  const headline =
    s.budget < 0
      ? "Town ends the year in the red"
      : lowest.mood < 30
        ? `A good year for many, a hard one for ${GROUP_INFO[lowGroup].name.toLowerCase()}`
        : average >= 65 && s.trust >= 60
          ? "A year the whole town will remember fondly"
          : s.env >= 65
            ? "The greenest year the town has seen"
            : average >= 55
              ? "Steady hands at the town hall"
              : "A bumpy year at the town hall";
  const lessons = [
    asked >= 6
      ? `You asked residents first ${asked} times, and trust ended at ${s.trust}. Listening costs a little and pays back.`
      : `You asked residents first ${asked} times. Asking reveals who each choice really affects, and builds trust.`,
    lowest.mood < 40
      ? `${GROUP_INFO[lowGroup].name} ended unhappy (${lowest.mood}). A fair town watches its least happy group, not just the average.`
      : `Every group ended above 40. Keeping the worst-off group in mind is what made the year fair.`,
    s.budget < 0
      ? "The budget went negative. Popular choices still need paying for."
      : s.env < 45
        ? "The environment slipped. Some costs only show up years later."
        : "You balanced money, nature and people: the hardest part of local government.",
  ];
  return { score, average, lowest, headline, lessons };
}
