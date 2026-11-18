import { randomInt, randomUUID } from "node:crypto";
import { codeSchema } from "./workshop-code";
import { z } from "zod";
import { ApiError } from "@/lib/api-server";
import {
  capacity,
  stages,
  wildcards,
  type Experiment,
  type SparkView,
  type Stage,
} from "./spark";

const line = (max: number) => z.string().trim().min(1).max(max);
const idea = z.string().uuid();
const experiment = z.object({
  step: line(240),
  owner: line(80),
  signal: line(200),
  concern: z.string().trim().max(200),
  checkIn: z.iso.date(),
});
export const actions = z.discriminatedUnion("type", [
  z.object({ type: z.literal("create"), topic: line(180) }),
  z.object({ type: z.literal("join"), code: codeSchema }),
  z.object({ type: z.literal("pitch"), code: codeSchema, text: line(220) }),
  z.object({
    type: z.literal("remix"),
    code: codeSchema,
    target: idea,
    text: line(220),
  }),
  z.object({ type: z.literal("ballot"), code: codeSchema, target: idea }),
  z.object({
    type: z.literal("advance"),
    code: codeSchema,
    from: z.enum(stages),
  }),
  z.object({
    type: z.literal("clock"),
    code: codeSchema,
    from: z.enum(stages),
    control: z.enum(["pause", "resume", "extend"]),
  }),
  z.object({
    type: z.literal("finish"),
    code: codeSchema,
    winner: idea,
    experiment,
  }),
]);
type Move = Exclude<z.infer<typeof actions>, { type: "create" }>;
interface Seat {
  key: string;
  idea: string;
  lens: number;
  pitch: string;
  target: string;
  riff: string;
  vote: string;
}
export interface Game {
  stage: Stage;
  deckOffset: number;
  seats: Seat[];
  endsAt: number | null;
  remaining: number | null;
  winner: string | null;
  experiment: Experiment | null;
}
export function freshGame(): Game {
  return {
    stage: "lobby",
    deckOffset: randomInt(wildcards.length),
    seats: [],
    endsAt: null,
    remaining: null,
    winner: null,
    experiment: null,
  };
}
const timed = { pitch: 90, remix: 120, debate: 60, ballot: 45 };
function requireMove(ok: unknown, message: string): asserts ok {
  if (!ok) throw new ApiError(409, message);
}
function tallies(seats: Seat[]) {
  const totals = new Map<string, number>();
  for (const seat of seats)
    if (seat.vote) totals.set(seat.vote, (totals.get(seat.vote) || 0) + 1);
  return totals;
}
export function play(game: Game, move: Move, key: string, host: boolean) {
  const { seats, stage } = game;
  const seat = seats.find((s) => s.key === key);
  if (move.type === "join") {
    if (seat) return;
    requireMove(
      stage === "lobby" || stage === "pitch",
      "Joining closed when the relay began.",
    );
    requireMove(seats.length < capacity, "This room is full.");
    seats.push({
      key,
      idea: randomUUID(),
      lens: (game.deckOffset + seats.length) % wildcards.length,
      pitch: "",
      target: "",
      riff: "",
      vote: "",
    });
    return;
  }
  if (
    move.type === "pitch" ||
    move.type === "remix" ||
    move.type === "ballot"
  ) {
    if (!seat) throw new ApiError(403, "Join on this device first.");
    requireMove(
      stage === move.type,
      "The host has moved to a different round.",
    );
    if (move.type === "pitch") seat.pitch = move.text;
    else {
      requireMove(
        seats.some((s) => s.idea === move.target && s.pitch),
        "Choose a pitch on the board.",
      );
      if (move.type === "remix") {
        requireMove(
          move.target !== seat.idea,
          "Pass the spark to another pitch.",
        );
        seat.target = move.target;
        seat.riff = move.text;
      } else seat.vote = move.target;
    }
    return;
  }
  if (!host) throw new ApiError(403, "Only the host can lead the session.");
  if (move.type === "finish") {
    requireMove(stage === "reveal", "Reveal the ballots first.");
    const scores = tallies(seats);
    requireMove(
      scores.get(move.winner) === Math.max(...scores.values()),
      "Choose one of the leading pitches.",
    );
    game.winner = move.winner;
    game.experiment = move.experiment;
    game.stage = "recap";
    return;
  }
  requireMove(
    stage === move.from,
    "The session has moved on. Refresh the board.",
  );
  if (move.type === "clock") {
    requireMove(stage in timed, "This round has no timer.");
    if (move.control === "pause" && game.endsAt !== null) {
      game.remaining = Math.max(0, game.endsAt - Date.now());
      game.endsAt = null;
    } else if (move.control === "resume" && game.remaining !== null) {
      game.endsAt = Date.now() + game.remaining;
      game.remaining = null;
    } else if (move.control === "extend") {
      if (game.endsAt !== null)
        game.endsAt = Math.max(Date.now(), game.endsAt) + 30000;
      else game.remaining = (game.remaining || 0) + 30000;
    }
    return;
  }
  const next = {
    lobby: "pitch",
    pitch: "remix",
    remix: "debate",
    debate: "ballot",
    ballot: "reveal",
  } as const;
  requireMove(stage in next, "Complete the experiment card.");
  if (stage === "lobby")
    requireMove(seats.length >= 2, "Bring in at least two players.");
  if (stage === "pitch")
    requireMove(
      seats.filter((s) => s.pitch).length >= 2,
      "Two different pitches make a contest.",
    );
  if (stage === "ballot")
    requireMove(
      seats.some((s) => s.vote),
      "Wait for a ballot before the reveal.",
    );
  game.stage = next[stage as keyof typeof next];
  game.endsAt =
    game.stage in timed
      ? Date.now() + timed[game.stage as keyof typeof timed] * 1000
      : null;
  game.remaining = null;
}

export function board(
  code: string,
  topic: string,
  game: Game,
  key: string,
): SparkView {
  const { seats, stage } = game;
  const me = seats.find((s) => s.key === key);
  const ideas = seats.filter((s) => s.pitch);
  const visible = stage !== "lobby" && stage !== "pitch";
  const revealed = stage === "reveal" || stage === "recap";
  const scores = tallies(seats);
  return {
    code,
    topic,
    stage,
    count: seats.length,
    pitchCount: ideas.length,
    riffCount: seats.filter((s) => s.riff).length,
    voteCount: seats.filter((s) => s.vote).length,
    covered: new Set(seats.filter((s) => s.riff).map((s) => s.target)).size,
    cards: visible
      ? ideas
          .map((s) => ({
            id: s.idea,
            pitch: s.pitch,
            riffs: seats.filter((r) => r.target === s.idea).map((r) => r.riff),
            ...(revealed ? { votes: scores.get(s.idea) || 0 } : {}),
          }))
          .sort((a, b) => a.id.localeCompare(b.id))
      : [],
    own: me
      ? {
          idea: me.idea,
          pitch: me.pitch,
          lens: me.lens,
          target: me.target,
          riff: me.riff,
          vote: me.vote,
        }
      : null,
    now: Date.now(),
    endsAt: game.endsAt,
    remaining: game.remaining,
    winner: game.winner,
    experiment: game.experiment,
  };
}
