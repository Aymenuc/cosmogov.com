import test from "node:test";
import assert from "node:assert/strict";
import {
  createParty,
  stepParty,
  EMPTY_INPUT,
  GOALS,
} from "../src/lib/games/block-party.ts";

const tick = (s, input = EMPTY_INPUT, seconds = 1) => {
  for (let i = 0; i < seconds * 120; i++)
    stepParty(s, [input, EMPTY_INPUT], 1 / 120);
};

test("solo and duo have independent players and a fresh score on replay", () => {
  const one = createParty("rally", "solo"),
    two = createParty("rally", "duo");
  one.rings[0].taken = true;
  one.score = 500;
  assert.equal(two.players.length, 2);
  assert.equal(two.score, 0);
  assert.equal(two.rings.filter((r) => r.taken).length, 0);
  assert.equal(two.rings.length, 13);
});
test("diagonal movement is not faster than cardinal movement", () => {
  const a = createParty("bumpers", "solo"),
    b = createParty("bumpers", "solo");
  tick(a, { ...EMPTY_INPUT, x: 1 }, 0.1);
  tick(b, { ...EMPTY_INPUT, x: 1, z: -1 }, 0.1);
  assert.ok(
    Math.abs(
      Math.hypot(a.players[0].x + 2, a.players[0].z - 4) -
        Math.hypot(b.players[0].x + 2, b.players[0].z - 4),
    ) < 0.001,
  );
});
test("a jump crosses a rooftop gap and lands on the next checkpoint", () => {
  const s = createParty("rally", "solo");
  tick(s, { ...EMPTY_INPUT, x: 1, jump: true }, 0.8);
  tick(s, EMPTY_INPUT, 0.2);
  assert.equal(s.players[0].y, 0);
  assert.equal(s.players[0].checkpoint.x, -4);
  assert.equal(s.players[0].falls, 0);
});
test("walking into a gap respawns safely without losing collected rings", () => {
  const s = createParty("rally", "solo");
  tick(s, { ...EMPTY_INPUT, x: 1 }, 0.4);
  tick(s, EMPTY_INPUT, 2);
  assert.equal(s.players[0].falls, 1);
  assert.equal(s.players[0].x, -8);
  assert.equal(s.players[0].y, 0);
});
test("a held jump does not auto-repeat on landing", () => {
  const s = createParty("rally", "solo");
  tick(s, { ...EMPTY_INPUT, jump: true }, 2);
  assert.equal(s.players[0].y, 0);
});
test("alternating players collect each ring once and earn a team combo", () => {
  const s = createParty("rally", "duo");
  Object.assign(s.players[0], { x: -8, z: -4 });
  stepParty(s, [], 1 / 120);
  Object.assign(s.players[1], { x: 8, z: -4 });
  stepParty(s, [], 1 / 120);
  stepParty(s, [], 1 / 120);
  assert.equal(s.deliveries, 2);
  assert.equal(s.score, 250);
  assert.equal(s.assists, 1);
});
test("ball contact, team assist and goal relocation happen once per goal", () => {
  const s = createParty("bumpers", "duo");
  Object.assign(s.players[0], { x: 0, z: 1.8 });
  stepParty(s, [], 1 / 120);
  assert.equal(s.ball.lastTouch, 0);
  Object.assign(s.players[0], { x: -8, z: 5 });
  Object.assign(s.players[1], { x: s.ball.x, z: s.ball.z + 0.8 });
  stepParty(s, [], 1 / 120);
  assert.equal(s.ball.previousTouch, 0);
  Object.assign(s.players[1], { x: 8, z: 5 });
  Object.assign(s.ball, { ...GOALS[0], vx: 0, vz: 0 });
  stepParty(s, [], 1 / 120);
  assert.equal(s.score, 250);
  assert.equal(s.assists, 1);
  assert.equal(s.goal, 1);
  stepParty(s, [], 1 / 120);
  assert.equal(s.deliveries, 1);
});
test("timed rounds finish and cannot keep earning points", () => {
  const s = createParty("bumpers", "solo");
  s.remaining = 0.001;
  stepParty(s, [], 1 / 120);
  assert.equal(s.status, "finished");
  Object.assign(s.ball, GOALS[0]);
  stepParty(s, [], 1 / 120);
  assert.equal(s.score, 0);
});
test("free play has no clock and winning stops simulation", () => {
  const s = createParty("rally", "solo", true);
  tick(s, EMPTY_INPUT, 76);
  assert.equal(s.remaining, 75);
  assert.equal(s.status, "playing");
  s.rings.forEach((r) => {
    r.taken = true;
  });
  stepParty(s, [], 1 / 120);
  assert.equal(s.status, "finished");
});
test("dash recharges instead of staying permanently active", () => {
  const s = createParty("bumpers", "solo");
  tick(s, { ...EMPTY_INPUT, dash: true }, 0.3);
  assert.equal(s.players[0].dash, 0);
  assert.ok(s.players[0].cooldown > 1);
});
