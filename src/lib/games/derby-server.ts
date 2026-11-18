import { randomInt } from "node:crypto";
import { z } from "zod";
import { ApiError } from "@/lib/api-server";
import { codeSchema } from "./workshop-code";
import {
  kinds,
  tactics,
  phases,
  newCar,
  race,
  canTow,
  tow,
  days,
  type Car,
  type Choice,
  type Crew,
  type DayLog,
  type DerbyView,
  type EventCard,
  type Hazards,
  type Phase,
  type Pilot,
} from "./derby";

const line = (max: number) => z.string().trim().min(1).max(max);
const day = z.number().int().min(0).max(3);
const turn = { code: codeSchema, day };
const choiceSchema = z.object({
  tactic: z.enum(tactics),
  note: line(180),
  bet: z.enum(kinds).nullable(),
});
export const actions = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("create"),
    topic: line(180),
    hazards: z.object({
      handoff: line(180),
      quality: line(180),
      capacity: line(180),
    }),
  }),
  z.object({ type: z.literal("join"), code: codeSchema }),
  z.object({ type: z.literal("advance"), ...turn, from: z.enum(phases) }),
  z.object({
    type: z.literal("clock"),
    ...turn,
    from: z.enum(["plan", "pit"]),
    mode: z.enum(["pause", "resume", "extend"]),
  }),
  z.object({ type: z.literal("vote"), ...turn, choice: choiceSchema }),
  z.object({ type: z.literal("scout"), ...turn }),
  z.object({ type: z.literal("tow"), ...turn }),
  z.object({
    type: z.literal("finish"),
    code: codeSchema,
    pilot: z.object({
      day,
      crew: z.union([z.literal(0), z.literal(1)]),
      step: line(200),
      owner: line(80),
      measure: line(180),
      date: z.iso.date(),
      concern: line(180),
    }),
  }),
]);
type Action = z.infer<typeof actions>;
type Turn = Exclude<Action, { type: "create" }>;
interface Seat {
  key: string;
  crew: Crew;
  vote: Choice | null;
}
interface Game {
  seats: Seat[];
  stage: Phase;
  day: number;
  hazards: Hazards;
  deck: EventCard[];
  cars: Car[];
  scouted: boolean[];
  logs: DayLog[];
  pilot: Pilot | null;
  endsAt: number | null;
  remaining: number | null;
}
function shuffle<T>(input: T[]) {
  const a = [...input];
  for (let n = a.length - 1; n > 0; n--) {
    const k = randomInt(n + 1);
    [a[k], a[n]] = [a[n], a[k]];
  }
  return a;
}
export function freshGame(move: Extract<Action, { type: "create" }>): Game {
  const deck = shuffle([...kinds, kinds[randomInt(kinds.length)]]).map(
    (risk, i) => {
      const decoy = shuffle(kinds.filter((k) => k !== risk))[0];
      return { risk, forecast: shuffle([risk, decoy]), damage: i < 2 ? 2 : 3 };
    },
  );
  return {
    seats: [],
    stage: "lobby",
    day: 0,
    hazards: move.hazards,
    deck,
    cars: [newCar(), newCar()],
    scouted: [false, false],
    logs: [],
    pilot: null,
    endsAt: null,
    remaining: null,
  };
}
function need(ok: unknown, why: string): asserts ok {
  if (!ok) throw new ApiError(409, why);
}
function order(seats: Seat[], crew: Crew, day: number) {
  const team = seats.filter((s) => s.crew === crew);
  const lead = day % team.length;
  return [...team.slice(lead), ...team.slice(0, lead)];
}
// Ballots select a complete play (tactic, workplace example and optional wager).
// A tie follows the day's rotating driver, skipping players who didn't submit.
function selectPlay(seats: Seat[], crew: Crew, day: number): Choice {
  const votes = order(seats, crew, day).flatMap((s) =>
    s.vote ? [s.vote] : [],
  );
  need(votes.length, "Each crew needs a move before the reveal.");
  const count = (v: Choice) =>
    votes.filter((x) => x.tactic === v.tactic).length;
  const winning = Math.max(...votes.map(count));
  return votes.find((v) => count(v) === winning)!;
}
function stage(g: Game, next: Phase) {
  g.stage = next;
  g.remaining = null;
  g.endsAt =
    next === "plan"
      ? Date.now() + 180000
      : next === "pit"
        ? Date.now() + 120000
        : null;
}
export function play(g: Game, m: Turn, key: string, host: boolean) {
  const seat = g.seats.find((s) => s.key === key);
  if (m.type === "join") {
    if (seat) return;
    need(
      g.stage === "lobby",
      "The crews have left the grid. Rejoin with your original browser.",
    );
    need(g.seats.length < 24, "Both crews are full.");
    g.seats.push({ key, crew: (g.seats.length % 2) as Crew, vote: null });
    return;
  }
  if ("day" in m)
    need(m.day === g.day, "That day is over. Read the current forecast.");
  if (m.type === "vote" || m.type === "scout" || m.type === "tow") {
    if (!seat) throw new ApiError(403, "Join a crew first.");
    const c = seat.crew;
    if (m.type === "tow") {
      need(g.stage === "pit", "Tow ropes are played after a reveal.");
      const log = g.logs[g.day];
      need(canTow(g.cars, log.laps, c), "That tow is unavailable.");
      tow(g.cars, c);
      log.tows.push(c);
      log.final = g.cars.map((car) => ({ ...car }));
      return;
    }
    need(g.stage === "plan", "The moves for this lap are sealed.");
    if (m.type === "scout") {
      if (g.scouted[c]) return;
      need(g.cars[c].battery, "Your crew has spent its battery.");
      need(
        !g.seats.some((s) => s.crew === c && s.vote?.bet),
        "A teammate has proposed a wager. Withdraw it before scouting.",
      );
      g.cars[c].battery = false;
      g.scouted[c] = true;
      return;
    }
    need(
      m.choice.bet === null ||
        (g.cars[c].battery && g.deck[g.day].forecast.includes(m.choice.bet)),
      "That wager is unavailable.",
    );
    seat.vote = m.choice;
    return;
  }
  if (!host) throw new ApiError(403, "Only the host leads the room.");
  if (m.type === "finish") {
    need(g.stage === "debrief", "Finish the Friday race first.");
    g.pilot = m.pilot;
    stage(g, "recap");
    return;
  }
  need(m.from === g.stage, "The room has moved on.");
  if (m.type === "clock") {
    if (m.mode === "pause" && g.endsAt !== null) {
      g.remaining = Math.max(0, g.endsAt - Date.now());
      g.endsAt = null;
    }
    if (m.mode === "resume" && g.remaining !== null) {
      g.endsAt = Date.now() + g.remaining;
      g.remaining = null;
    }
    if (m.mode === "extend") {
      if (g.endsAt !== null) g.endsAt = Math.max(Date.now(), g.endsAt) + 60000;
      else g.remaining = (g.remaining ?? 0) + 60000;
    }
    return;
  }
  if (g.stage === "lobby") {
    need(g.seats.length >= 2, "Seat at least one player in each crew.");
    stage(g, "plan");
    return;
  }
  if (g.stage === "plan") {
    const event = g.deck[g.day];
    const laps = ([0, 1] as const).map((c) =>
      race(g.cars[c], selectPlay(g.seats, c, g.day), event),
    );
    g.cars = laps.map((l) => ({ ...l.after }));
    g.logs.push({
      event,
      laps,
      tows: [],
      final: g.cars.map((car) => ({ ...car })),
    });
    stage(g, "pit");
    return;
  }
  need(g.stage === "pit", "Record the work pilot to finish.");
  if (g.day === days.length - 1) {
    stage(g, "debrief");
    return;
  }
  g.day++;
  g.scouted = [false, false];
  g.seats.forEach((s) => (s.vote = null));
  stage(g, "plan");
}
export function board(
  code: string,
  topic: string,
  g: Game,
  key: string,
): DerbyView {
  const me = g.seats.find((s) => s.key === key),
    event = g.deck[g.day];
  // Keep the opposing crew's scout and battery spend secret until the reveal.
  const cars = g.cars.map((car, c) => ({
    ...car,
    battery:
      g.stage === "plan" && g.scouted[c] && me?.crew !== c ? true : car.battery,
  }));
  return {
    code,
    topic,
    stage: g.stage,
    day: g.day,
    now: Date.now(),
    endsAt: g.endsAt,
    remaining: g.remaining,
    hazards: g.hazards,
    counts: [0, 1].map((c) => g.seats.filter((s) => s.crew === c).length),
    votes: [0, 1].map(
      (c) => g.seats.filter((s) => s.crew === c && s.vote).length,
    ),
    cars,
    logs: g.logs,
    pilot: g.pilot,
    forecast: g.stage === "plan" ? event.forecast : [],
    damage: event.damage,
    own: me
      ? {
          crew: me.crew,
          vote: me.vote,
          scout: g.scouted[me.crew] ? event.risk : null,
          tieBreaker: order(g.seats, me.crew, g.day)[0] === me,
          radio:
            g.stage === "plan"
              ? g.seats
                  .filter((s) => s.crew === me.crew && s.key !== me.key)
                  .flatMap((s) => (s.vote ? [s.vote] : []))
              : [],
          hand:
            order(g.seats, me.crew, g.day)[0] === me ? "Driver" : "Navigator",
        }
      : null,
  };
}
