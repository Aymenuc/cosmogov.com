import test from "node:test";
import assert from "node:assert/strict";
import {
  createBlocks,
  shifted,
  slideBlocks,
  shareBlock,
  fulfilled,
  WISHES,
  KINDS,
  MOVE_LIMIT,
} from "../src/lib/games/one-more-block.ts";
const block = (id, kind = "food", value = 1) => ({ id, kind, value });
const empty = () => Array(16).fill(null);
test("the same challenge has the same board and arrivals", () => {
  let a = createBlocks(42),
    b = createBlocks(42);
  for (const d of ["left", "down", "right", "up"]) {
    a = slideBlocks(a, d);
    b = slideBlocks(b, d);
    assert.deepEqual(a, b);
  }
  assert.notDeepEqual(createBlocks(43).board, createBlocks(42).board);
});
test("four identical spaces merge into two, never chain-merge in one turn", () => {
  const b = empty();
  for (let i = 0; i < 4; i++) b[i] = block(i);
  const result = shifted(b, "left");
  assert.deepEqual(
    result.board.slice(0, 4).map((x) => x?.value),
    [2, 2, undefined, undefined],
  );
  assert.equal(result.merge, 4);
  assert.equal(b[0].value, 1);
});
test("different community resources do not merge just because numbers match", () => {
  const b = empty();
  b[0] = block(1, "food");
  b[1] = block(2, "access");
  assert.equal(shifted(b, "left").changed, false);
  assert.equal(shifted(b, "left").merge, 0);
});
test("all four directions respect orientation and conserve resource value", () => {
  for (const d of ["left", "right", "up", "down"]) {
    const b = empty();
    b[0] = block(1);
    b[1] = block(2);
    b[4] = block(3, "play", 2);
    const moved = shifted(b, d);
    assert.equal(
      moved.board.reduce((n, b) => n + (b?.value || 0), 0),
      4,
    );
  }
});
test("a blocked slide does not spend a turn or generate extra resources", () => {
  const s = createBlocks();
  s.board = empty();
  s.board[0] = block(1);
  assert.equal(slideBlocks(s, "left"), s);
  assert.equal(s.moves, 0);
});
test("sharing opens space and alternates the turn without spawning a replacement", () => {
  const s = createBlocks();
  s.board = empty();
  s.board[5] = block(1, "access", 4);
  const next = shareBlock(s, 5);
  assert.equal(next.shared.access, 4);
  assert.equal(next.board[5], null);
  assert.equal(next.turn, 1);
  assert.equal(next.moves, 1);
  assert.equal(s.shared.access, 0);
});
test("surplus stays available and a completed wish cannot consume more", () => {
  const s = createBlocks();
  s.board = empty();
  s.board[0] = block(1, "play", 8);
  const next = shareBlock(s, 0);
  assert.equal(next.shared.play, 4);
  assert.equal(next.board[0].value, 4);
  assert.equal(shareBlock(next, 0), next);
});
test("a high tile and two complete wishes do not win while access is missing", () => {
  const s = createBlocks();
  s.shared = { food: 8, play: 4, access: 0 };
  s.board = empty();
  s.board[0] = block(1, "food", 64);
  s.board[1] = block(2, "access", 4);
  assert.equal(fulfilled(s), 2);
  assert.equal(s.status, "playing");
  const won = shareBlock(s, 1);
  assert.equal(won.status, "won");
  assert.equal(slideBlocks(won, "left"), won);
});
test("meeting the last need on the final turn wins instead of timing out", () => {
  const s = createBlocks();
  s.shared = { food: 8, play: 4, access: 3 };
  s.moves = MOVE_LIMIT - 1;
  s.board = empty();
  s.board[0] = block(1, "access");
  assert.equal(shareBlock(s, 0).status, "won");
});
test("a full board with useful contributions stays playable", () => {
  const s = createBlocks();
  s.board = Array.from({ length: 16 }, (_, i) => block(i, KINDS[i % 3], 1));
  const next = shareBlock(s, 0);
  assert.equal(next.status, "playing");
  assert.equal(next.board[0], null);
});
test("the move budget ends a round with unmet needs", () => {
  const s = createBlocks();
  s.moves = MOVE_LIMIT - 1;
  s.board = empty();
  s.board[0] = block(1);
  const next = slideBlocks(s, "right");
  assert.equal(next.status, "stuck");
  assert.equal(fulfilled(next), 0);
});
