export type Kind = "food" | "play" | "access";
export type Direction = "left" | "right" | "up" | "down";
export interface Block {
  id: number;
  kind: Kind;
  value: number;
}
export const WISHES = {
  food: {
    name: "A table for everyone",
    short: "Shared meals",
    need: 8,
    reason: "Food, tables, cooking equipment and volunteers for a shared meal.",
    color: "#f4ae76",
  },
  play: {
    name: "Room to play",
    short: "Safe play",
    need: 4,
    reason: "A protected place where children can play together.",
    color: "#c3b4f5",
  },
  access: {
    name: "A way in for everyone",
    short: "Step-free access",
    need: 4,
    reason:
      "Make the meeting place usable with wheels, a buggy or a walking aid.",
    color: "#9cdabd",
  },
} satisfies Record<
  Kind,
  { name: string; short: string; need: number; reason: string; color: string }
>;
export const KINDS: Kind[] = ["food", "play", "access"];
export interface BlockState {
  board: (Block | null)[];
  shared: Record<Kind, number>;
  moves: number;
  turn: number;
  nextId: number;
  random: number;
  spawnCount: number;
  score: number;
  status: "playing" | "won" | "stuck";
  message: string;
  lastMerge: number;
}
export const MOVE_LIMIT = 36;
function random(s: BlockState) {
  s.random = (Math.imul(s.random, 1664525) + 1013904223) >>> 0;
  return s.random / 4294967296;
}
export function nextKind(s: BlockState): Kind {
  // More food tiles match the larger meal need; the queue is public.
  return (["food", "play", "food", "access"] as Kind[])[s.spawnCount % 4];
}
function spawn(s: BlockState) {
  const slots = s.board.flatMap((b, i) => (b ? [] : [i]));
  if (!slots.length) return;
  const index = slots[Math.floor(random(s) * slots.length)];
  s.board[index] = { id: s.nextId++, kind: nextKind(s), value: 1 };
  s.spawnCount++;
}
export function createBlocks(seed = 1): BlockState {
  const s: BlockState = {
    board: Array(16).fill(null),
    shared: { food: 0, play: 0, access: 0 },
    moves: 0,
    turn: 0,
    nextId: 1,
    random: seed >>> 0,
    spawnCount: 0,
    score: 0,
    status: "playing",
    message:
      "Slide matching spaces together. Tap a tile when you’re ready to share it.",
    lastMerge: 0,
  };
  for (let i = 0; i < 6; i++) spawn(s);
  return s;
}
function lineIndices(direction: Direction, line: number): number[] {
  return Array.from({ length: 4 }, (_, n) => {
    if (direction === "left") return line * 4 + n;
    if (direction === "right") return line * 4 + 3 - n;
    if (direction === "up") return n * 4 + line;
    return (3 - n) * 4 + line;
  });
}
export function shifted(board: BlockState["board"], direction: Direction) {
  const next: BlockState["board"] = Array(16).fill(null);
  let merge = 0;
  for (let line = 0; line < 4; line++) {
    const indices = lineIndices(direction, line);
    const blocks = indices
      .map((i) => board[i])
      .filter((b): b is Block => b !== null);
    const result: Block[] = [];
    for (let i = 0; i < blocks.length; i++) {
      const b = blocks[i],
        other = blocks[i + 1];
      if (other && b.kind === other.kind && b.value === other.value) {
        const combined = { ...b, value: b.value * 2 };
        result.push(combined);
        merge += combined.value;
        i++;
      } else result.push({ ...b });
    }
    indices.forEach((index, n) => {
      next[index] = result[n] || null;
    });
  }
  const changed = next.some(
    (b, i) => b?.id !== board[i]?.id || b?.value !== board[i]?.value,
  );
  return { board: next, changed, merge };
}
export function fulfilled(s: BlockState) {
  return KINDS.filter((k) => s.shared[k] >= WISHES[k].need).length;
}
export function canShare(s: BlockState, index: number) {
  const b = s.board[index];
  return Boolean(b && s.shared[b.kind] < WISHES[b.kind].need);
}
function finish(s: BlockState) {
  if (fulfilled(s) === 3) {
    s.status = "won";
    s.message = "Everyone has a place at the table—and a way to get there.";
  } else if (
    s.moves >= MOVE_LIMIT ||
    (!(["left", "right", "up", "down"] as Direction[]).some(
      (d) => shifted(s.board, d).changed,
    ) &&
      !s.board.some((_, i) => canShare(s, i)))
  ) {
    s.status = "stuck";
    s.message =
      "The block needs another plan. Try sharing earlier to keep space open.";
  }
}
function clone(s: BlockState): BlockState {
  return {
    ...s,
    board: s.board.map((b) => (b ? { ...b } : null)),
    shared: { ...s.shared },
  };
}
export function slideBlocks(s: BlockState, direction: Direction): BlockState {
  if (s.status !== "playing") return s;
  const moved = shifted(s.board, direction);
  if (!moved.changed) return s;
  const next = clone(s);
  next.board = moved.board;
  next.moves++;
  next.turn++;
  next.score += moved.merge;
  next.lastMerge = moved.merge;
  spawn(next);
  next.message = moved.merge
    ? `Lovely combination! +${moved.merge}. Keep growing it, or share it?`
    : "A new space arrived. What should make room for it?";
  finish(next);
  return next;
}
export function shareBlock(s: BlockState, index: number): BlockState {
  if (s.status !== "playing" || !canShare(s, index)) return s;
  const next = clone(s),
    b = next.board[index]!;
  const amount = Math.min(b.value, WISHES[b.kind].need - next.shared[b.kind]);
  next.shared[b.kind] += amount;
  // Keep the unused portion: a contribution never destroys surplus resources.
  const surplus = b.value - amount;
  next.board[index] = surplus ? { ...b, value: surplus } : null;
  next.moves++;
  next.turn++;
  next.lastMerge = 0;
  next.message =
    next.shared[b.kind] >= WISHES[b.kind].need
      ? `${WISHES[b.kind].name}: ready! ${fulfilled(next) < 3 ? "Who is still waiting?" : ""}`
      : `Shared ${amount} toward ${WISHES[b.kind].short.toLowerCase()}. An open square is a new possibility.`;
  finish(next);
  return next;
}
export function blockReflection(s: BlockState) {
  const missing = KINDS.filter((k) => s.shared[k] < WISHES[k].need).map(
    (k) =>
      `${WISHES[k].short.toLowerCase()} (${WISHES[k].need - s.shared[k]} more)`,
  );
  return missing.length
    ? `Your board still needs ${missing.join(" and ")}. A high merge score alone could not meet these needs. Sharing tiles also makes room for the next neighbour’s move.`
    : "You combined spaces and shared them across all three needs. A meal or a play space is not fully welcoming if someone cannot get in. Your win included access, too.";
}
