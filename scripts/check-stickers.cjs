// Exercises the sticker rules without Next.js or a database.
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const ts = require("typescript");
const source = ts.transpileModule(
  fs.readFileSync(
    require("node:path").join(__dirname, "../src/lib/stickers.ts"),
    "utf8",
  ),
  {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  },
).outputText;
const lib = {};
vm.runInNewContext(source, { exports: lib });
const { stickerRules, stickerStates, nextSticker, gardenFlowers, cleanCounts } =
  lib;
// Spread into a local array: values from the vm context have their own Array.
const earned = (counts) => [
  ...stickerStates(counts)
    .filter((s) => s.earned)
    .map((s) => s.id),
];

test("a new person has no stickers and a clear first one to aim for", () => {
  assert.deepEqual(earned({}), []);
  assert.equal(stickerStates({}).length, stickerRules.length);
  assert.ok(nextSticker(stickerStates({})));
});
test("each rule is met exactly at its threshold", () => {
  for (const rule of stickerRules) {
    const below = earned({ [rule.count]: rule.need - 1 });
    const at = earned({ [rule.count]: rule.need });
    assert.ok(!below.includes(rule.id), `${rule.id} earned too early`);
    assert.ok(at.includes(rule.id), `${rule.id} not earned at threshold`);
  }
});
test("finishing tasks earns the first task sticker, then the fifth", () => {
  assert.deepEqual(earned({ tasksDone: 1 }), ["done-and-dusted"]);
  assert.deepEqual(earned({ tasksDone: 4 }), ["done-and-dusted"]);
  assert.deepEqual(earned({ tasksDone: 5 }), ["done-and-dusted", "handy"]);
  const handy = stickerStates({ tasksDone: 3 }).find((s) => s.id === "handy");
  assert.equal(handy.have, 3);
  assert.equal(handy.need, 5);
});
test("nothing is ever earned for voting or signing", () => {
  const all = earned({
    votes: 500,
    votesCast: 500,
    signatures: 500,
    totalXp: 99999,
    level: 40,
  });
  assert.deepEqual(all, []);
  for (const rule of stickerRules)
    assert.doesNotMatch(
      `${rule.id} ${rule.name} ${rule.how} ${rule.count}`,
      /vot|sign(?!-up)|ballot|xp/i,
    );
});
test("bad input is treated as zero, never as progress", () => {
  for (const input of [null, undefined, [], "x", 4])
    assert.deepEqual(earned(input), []);
  const counts = cleanCounts({
    tasksDone: -3,
    missionsStarted: "7",
    formsAnswered: NaN,
    sourcesAdded: 2.9,
  });
  assert.equal(counts.tasksDone, 0);
  assert.equal(counts.missionsStarted, 0);
  assert.equal(counts.formsAnswered, 0);
  assert.equal(counts.sourcesAdded, 2);
});
test("the next sticker is the unearned one closest to done", () => {
  const next = nextSticker(stickerStates({ tasksDone: 4, missionsStarted: 1 }));
  assert.equal(next.id, "handy");
  const everything = Object.fromEntries(
    stickerRules.map((rule) => [rule.count, 99]),
  );
  assert.equal(nextSticker(stickerStates(everything)), null);
});
test("the garden plants one flower per finished task, up to a full bed", () => {
  assert.equal(JSON.stringify(gardenFlowers(0)), '{"planted":0,"extra":0}');
  assert.equal(JSON.stringify(gardenFlowers(7)), '{"planted":7,"extra":0}');
  assert.equal(JSON.stringify(gardenFlowers(20)), '{"planted":12,"extra":8}');
  assert.equal(JSON.stringify(gardenFlowers("9")), '{"planted":0,"extra":0}');
});
