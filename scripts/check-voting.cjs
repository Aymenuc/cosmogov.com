// Tests the actual route with isolated database/session adapters. No database writes.
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const ts = require("typescript");
const { NextResponse } = require("next/server");
const filename = require("node:path").join(
  __dirname,
  "../src/app/api/proposals/[id]/vote/route.ts",
);
const source = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2022,
  },
}).outputText;
function setup({
  session = { id: "citizen" },
  proposal = {
    id: "proposal",
    status: "active",
    closesAt: null,
    options: '["For","Against"]',
  },
  existing = null,
} = {}) {
  const calls = [];
  const snapshot = proposal ? { votingType: "yes_no", ...proposal } : null;
  class ApiError extends Error { constructor(status, message) { super(message); this.status = status; } }
  const api = {
    ApiError,
    apiUser: async () => { if (!session) throw new ApiError(401, "Sign in"); return session; },
    rateLimit: async () => {},
    apiFailure: error => NextResponse.json({ error: error.message }, { status: error.status || (error instanceof require("zod").ZodError ? 400 : 503) }),
  };
  const db = {
    proposal: { findUniqueOrThrow: async () => snapshot },
    vote: { upsert: async args => { calls.push([existing ? "update" : "create", args]); return { id: existing?.id || "vote", ...(existing ? args.update : args.create) }; } },
    user: { update: async args => { calls.push(["xp", args]); return {}; } },
  };
  db.$transaction = fn => fn(db);
  const exports = {};
  const context = {
    exports,
    require: (name) =>
      name === "next/server"
        ? { NextResponse }
        : name === "@/lib/db"
          ? { db }
          : name === "@/lib/api-server" ? api
        : name === "@/lib/proposals-server" ? { accessProposal: async () => { if (!snapshot) throw new ApiError(404, "Not found"); return { proposal: snapshot }; } }
        : require(name),
    Buffer,
    Date,
  };
  vm.runInNewContext(source, context, { filename });
  return {
    calls,
    submit: async (option = "For") =>
      exports.POST(
        {
          json: async () => ({
            option,
            confidence: 3,
            reasoning: "A considered choice",
          }),
        },
        { params: Promise.resolve({ id: "proposal" }) },
      ),
  };
}
test("Unauthenticated votes are rejected without writes", async () => {
  const t = setup({ session: null });
  assert.equal((await t.submit()).status, 401);
  assert.equal(t.calls.length, 0);
});
test("Missing proposals and empty options are rejected", async () => {
  assert.equal((await setup({ proposal: null }).submit()).status, 404);
  assert.equal((await setup().submit("")).status, 400);
});
for (const status of ["closed", "draft"])
  test(`${status} proposals cannot accept votes`, async () => {
    const t = setup({ proposal: { status, options: '["For"]' } });
    assert.equal((await t.submit()).status, 409);
    assert.equal(t.calls.length, 0);
  });
test("A stale client cannot vote after the closing time", async () => {
  const t = setup({
    proposal: {
      status: "active",
      closesAt: new Date(Date.now() - 1000),
      options: '["For"]',
    },
  });
  assert.equal((await t.submit()).status, 409);
  assert.equal(t.calls.length, 0);
});
test("Unknown and malformed voting options cannot be submitted", async () => {
  for (const options of ['["For"]', "not-json", "{}"]) {
    const t = setup({ proposal: { status: "active", options } });
    assert.ok([400, 409].includes((await t.submit("Other")).status));
    assert.equal(t.calls.length, 0);
  }
});
test("An open valid vote is recorded without awarding XP", async () => {
  const t = setup();
  assert.equal((await t.submit()).status, 200);
  assert.deepEqual(
    t.calls.map(([type]) => type),
    ["create"],
  );
  assert.equal(t.calls[0][1].create.option, "For");
});
test("Updating an existing vote does not award XP", async () => {
  const t = setup({ existing: { id: "existing" } });
  assert.equal((await t.submit("Against")).status, 200);
  assert.deepEqual(
    t.calls.map(([type]) => type),
    ["update"],
  );
  assert.equal(t.calls[0][1].where.proposalId_voterId.voterId, "citizen");
});

test("Ranked choice cannot be submitted as a single-option ballot", async () => {
  const t = setup({ proposal: { status: "active", votingType: "ranked_choice", options: '["For","Against"]' } });
  assert.equal((await t.submit()).status, 409); assert.equal(t.calls.length, 0);
});
