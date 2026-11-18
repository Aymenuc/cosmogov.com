import test from "node:test";
import assert from "node:assert/strict";
import { newCar, ready, race, canTow, tow } from "../src/lib/games/derby.ts";
const drive = (car, tactic, risk, damage = 2, bet = null) =>
  race(
    car,
    { tactic, note: "Team move", bet },
    { risk, damage, forecast: [risk] },
  );
test("unused cover survives into the next lap and absorbs one matched event", () => {
  const a = drive(newCar(), "handoff", "quality");
  assert.equal(a.hit, true);
  assert.equal(a.after.cover, "handoff");
  assert.equal(a.after.debt, 2);
  const b = drive(a.after, "capacity", "handoff");
  assert.equal(b.usedCover, true);
  assert.equal(b.hit, false);
  assert.equal(b.after.cover, "capacity");
  assert.equal(b.after.debt, 2);
  assert.equal(a.after.cover, "handoff");
});
test("a battery wager changes only its crew and can settle once", () => {
  const a = drive(newCar(), "handoff", "handoff", 2, "handoff");
  assert.equal(a.wonBet, true);
  assert.equal(ready(a.after), 4);
  assert.equal(a.after.battery, false);
  const b = drive(newCar(), "handoff", "handoff", 2, "capacity");
  assert.equal(b.wonBet, false);
  assert.equal(ready(b.after), 0);
  assert.equal(drive(a.after, "repair", "handoff", 2, "handoff").wonBet, null);
});
test("a hot engine loses travel until a protected repair clears rework", () => {
  const hot = { ...newCar(), distance: 6, debt: 4 };
  const push = drive(hot, "sprint", "capacity");
  assert.equal(push.after.distance, 9);
  assert.equal(push.after.debt, 7);
  const repair = drive(hot, "repair", "capacity");
  assert.equal(repair.after.distance, 7);
  assert.equal(repair.after.debt, 1);
  assert.equal(repair.hit, false);
});
test("a last-lap tow can cost first place and get both crews to eight", () => {
  const laps = [
    drive({ ...newCar(), distance: 7 }, "handoff", "handoff", 3),
    drive({ ...newCar(), distance: 7 }, "sprint", "handoff", 3),
  ];
  const cars = laps.map((l) => ({ ...l.after }));
  assert.deepEqual(cars.map(ready), [9, 7]);
  assert.equal(canTow(cars, laps, 0), true);
  tow(cars, 0);
  assert.deepEqual(cars.map(ready), [8, 9]);
  assert.equal(canTow(cars, laps, 0), false);
});
