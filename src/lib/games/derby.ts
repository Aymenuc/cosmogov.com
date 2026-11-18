// Deadline Derby models a fictional four-turn race. Ready work is the distance
// travelled less outstanding rework; only Friday's ready work decides the cup.
export const kinds = ["handoff", "quality", "capacity"] as const;
export type Risk = (typeof kinds)[number];
export const tactics = [
  "sprint",
  "handoff",
  "quality",
  "capacity",
  "repair",
] as const;
export type Tactic = (typeof tactics)[number];
export const crews = ["Comets", "Fireflies"] as const;
export type Crew = 0 | 1;
export const days = ["Monday", "Tuesday", "Wednesday", "Thursday"];
export const target = 8;
export const riskNames: Record<Risk, string> = {
  handoff: "Handoff",
  quality: "Quality",
  capacity: "Capacity",
};
export const moves: Record<
  Tactic,
  { name: string; rule: string; prompt: string }
> = {
  sprint: {
    name: "Floor it",
    rule: "Travel 4. Take 1 rework.",
    prompt: "What could we finish early by cutting scope?",
  },
  handoff: {
    name: "Pass the baton",
    rule: "Travel 2. Cover a handoff.",
    prompt: "Who needs what from whom before work can move?",
  },
  quality: {
    name: "Test the load",
    rule: "Travel 2. Cover a quality issue.",
    prompt: "What small check could catch a costly mistake?",
  },
  capacity: {
    name: "Call a backup",
    rule: "Travel 2. Cover a capacity loss.",
    prompt: "Who or what could take over if someone is unavailable?",
  },
  repair: {
    name: "Pit stop",
    rule: "Travel 1. Clear up to 3 rework. This event passes you by.",
    prompt: "What unfinished repair would save the team time later?",
  },
};
export const starter = {
  topic: "Get a research brief ready for partner review by Friday.",
  risks: {
    handoff: "A partner comments on yesterday’s version.",
    quality: "A reviewer spots a claim the evidence does not support.",
    capacity: "The lead reviewer gets pulled into another project.",
  },
};
export const riskAlternatives = {
  topic: "Hand over a project so a new teammate can run it.",
  risks: {
    handoff: "The new lead receives two conflicting handover notes.",
    quality: "The checklist misses a recurring exception.",
    capacity: "The outgoing lead is unavailable for the walkthrough.",
  },
};
export type Hazards = Record<Risk, string>;
export interface Car {
  distance: number;
  debt: number;
  cover: Risk | null;
  battery: boolean;
  rope: boolean;
}
export function newCar(): Car {
  return { distance: 0, debt: 0, cover: null, battery: true, rope: true };
}
export function ready(car: Car) {
  return Math.max(0, car.distance - car.debt);
}
export interface EventCard {
  risk: Risk;
  forecast: Risk[];
  damage: number;
}
export interface Choice {
  tactic: Tactic;
  note: string;
  bet: Risk | null;
}
export interface Lap {
  choice: Choice;
  before: Car;
  after: Car;
  hit: boolean;
  usedCover: boolean;
  wonBet: boolean | null;
}
export function race(car: Car, choice: Choice, event: EventCard): Lap {
  const after = { ...car };
  const { tactic } = choice;
  let hit = false,
    usedCover = false,
    wonBet: boolean | null = null;
  if (tactic === "repair") {
    after.distance++;
    after.debt = Math.max(0, after.debt - 3);
  } else {
    after.distance += (tactic === "sprint" ? 4 : 2) - (car.debt >= 4 ? 1 : 0);
    if (tactic === "sprint") after.debt++;
    usedCover = car.cover === event.risk && tactic !== event.risk;
    hit = tactic !== event.risk && !usedCover;
    if (hit) after.debt += event.damage;
    if (usedCover) after.cover = null;
    if (tactic !== "sprint" && tactic !== event.risk) after.cover = tactic;
  }
  if (choice.bet !== null && car.battery) {
    after.battery = false;
    wonBet = choice.bet === event.risk;
    if (wonBet) after.distance += 2;
    else after.debt += 2;
  }
  return { choice, before: { ...car }, after, hit, usedCover, wonBet };
}
export function canTow(cars: Car[], laps: Lap[], crew: Crew) {
  const other = 1 - crew;
  return (
    cars[crew].rope &&
    cars[crew].distance > 0 &&
    laps[other].hit &&
    cars[other].debt > 0
  );
}
export function tow(cars: Car[], crew: Crew) {
  const other = 1 - crew;
  cars[crew].rope = false;
  cars[crew].distance--;
  cars[other].debt = Math.max(0, cars[other].debt - 2);
}
export const phases = ["lobby", "plan", "pit", "debrief", "recap"] as const;
export type Phase = (typeof phases)[number];
export interface DayLog {
  event: EventCard;
  laps: Lap[];
  tows: Crew[];
  final: Car[];
}
export interface Pilot {
  day: number;
  crew: Crew;
  step: string;
  owner: string;
  measure: string;
  date: string;
  concern: string;
}
export interface DerbyView {
  code: string;
  topic: string;
  hazards: Hazards;
  stage: Phase;
  day: number;
  now: number;
  endsAt: number | null;
  remaining: number | null;
  counts: number[];
  votes: number[];
  cars: Car[];
  logs: DayLog[];
  forecast: Risk[];
  damage: number;
  pilot: Pilot | null;
  own: {
    crew: Crew;
    vote: Choice | null;
    scout: Risk | null;
    tieBreaker: boolean;
    hand: string;
    radio: Choice[];
  } | null;
}
export function report(v: DerbyView): string {
  const p = v.pilot!;
  return [
    "DEADLINE DERBY",
    v.topic,
    "",
    "Simulation log",
    ...v.logs.flatMap((log, i) => [
      days[i] + " — " + v.hazards[log.event.risk],
      ...log.laps.map(
        (lap, c) =>
          crews[c] +
          " · " +
          moves[lap.choice.tactic].name +
          " · " +
          lap.choice.note +
          " · " +
          ready(log.final[c]) +
          " ready",
      ),
      ...log.tows.map((c) => crews[c] + " lent a tow rope."),
    ]),
    "",
    "Work pilot",
    crews[p.crew] +
      " · " +
      days[p.day] +
      " · " +
      v.logs[p.day].laps[p.crew].choice.note,
    "Try: " + p.step,
    "Volunteer: " + p.owner,
    "Evidence to check: " + p.measure,
    "Review date: " + p.date,
    "Risk to watch: " + p.concern,
  ].join("\n");
}
