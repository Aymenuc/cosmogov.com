/* Run against a configured staging host with a dedicated account. Four real AI
 * requests may incur provider costs. Creates and deletes only its own private mission.
 * Credentials come from environment variables and are never printed.
 */
const assert = require("node:assert/strict");
const crypto = require("node:crypto");

async function main() {
  for (const key of [
    "COSMOGOV_STAGING_URL",
    "COSMOGOV_STAGING_EMAIL",
    "COSMOGOV_STAGING_PASSWORD",
  ]) {
    if (!process.env[key])
      throw new Error(`Set ${key} before running this check.`);
  }
  const target = new URL(process.env.COSMOGOV_STAGING_URL);
  assert.ok(
    !target.username &&
      !target.password &&
      !target.search &&
      !target.hash &&
      target.pathname === "/",
    "Use a staging origin without credentials or a path.",
  );
  assert.ok(
    target.protocol === "https:" ||
      (target.protocol === "http:" &&
        ["localhost", "127.0.0.1"].includes(target.hostname)),
    "Staging must use HTTPS.",
  );
  let cookie = "",
    missionId;
  const title = `Staging repair circle ${crypto.randomBytes(6).toString("hex")}`;
  const request = async (path, method = "GET", body, csv = false) => {
    const response = await fetch(target.origin + path, {
      method,
      redirect: "error",
      signal: AbortSignal.timeout(130000),
      headers: {
        "Content-Type": "application/json",
        ...(cookie ? { Cookie: cookie } : {}),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    if (!response.ok)
      throw new Error(`${method} ${path} returned HTTP ${response.status}.`);
    if (path === "/api/auth/login")
      cookie = response.headers.get("set-cookie")?.split(";")[0] || "";
    return csv ? response.text() : response.json();
  };
  await request("/api/auth/login", "POST", {
    email: process.env.COSMOGOV_STAGING_EMAIL,
    password: process.env.COSMOGOV_STAGING_PASSWORD,
  });
  assert.ok(cookie, "The staging host did not issue a session.");
  console.log("PASS Sign in with a signed session");
  try {
    const mission = await request("/api/missions", "POST", {
      title,
      goal: "Plan a small neighborhood repair circle with a sewing table. This is a staging verification, not a public event.",
    });
    missionId = mission.id;
    const path = "/api/missions/" + missionId;
    await request(path + "/contributions", "POST", {
      kind: "source",
      title: "Synthetic staging venue notes",
      content:
        "Illustrative staging data: a room has two tables and four chairs. Availability, volunteers and permission are not confirmed.",
    });
    let room, planId, formId;
    for (const stage of ["research", "perspectives", "plan", "tool"]) {
      const run = await request(path + "/runs", "POST", {
        stage,
        webSearch: false,
      });
      room = await request(path);
      const saved = room.runs.find((item) => item.id === run.id);
      assert.equal(saved?.status, "completed");
      assert.ok(
        saved.model && saved.promptVersion && saved.output,
        "Missing output provenance.",
      );
      const sourceIds = new Set(saved.sources.map((source) => source.id));
      for (const finding of saved.output.findings)
        for (const id of finding.sourceIds)
          assert.ok(sourceIds.has(id), "Unknown citation.");
      if (stage === "plan") planId = run.id;
      if (stage === "tool") formId = run.id;
      console.log(
        `PASS Real provider ${stage} output, citations and provenance`,
      );
    }
    await request(`${path}/runs/${planId}/accept`, "POST");
    await request(`${path}/runs/${formId}/accept`, "POST");
    room = await request(path);
    assert.ok(room.tasks.length, "The real plan did not produce any tasks.");
    const task = room.tasks[0];
    await request(`${path}/tasks/${task.id}`, "PATCH", { action: "claim" });
    await request(`${path}/tasks/${task.id}`, "PATCH", {
      action: "complete",
      evidence: {
        note: "Staging verification completed this synthetic task. No real civic outcome is asserted.",
      },
    });
    const form = room.runs.find((item) => item.id === formId).output.tool;
    assert.ok(form?.fields.length, "The provider did not produce a form.");
    const values = Object.fromEntries(
      form.fields.map((field) => [
        field.id,
        field.kind === "choice"
          ? field.options[0]
          : "Synthetic staging answer.",
      ]),
    );
    await request(`${path}/tools/${formId}/responses`, "POST", {
      values,
      offerToHelp: false,
    });
    const csv = await request(
      `${path}/tools/${formId}/export`,
      "GET",
      undefined,
      true,
    );
    assert.ok(
      csv.includes("Respondent") && csv.includes("Last saved"),
      "Missing CSV export.",
    );
    await request(`${path}/tools/${formId}`, "PATCH", { action: "close" });
    const closed = await fetch(
      target.origin + `${path}/tools/${formId}/responses`,
      {
        method: "POST",
        headers: { Cookie: cookie, "Content-Type": "application/json" },
        body: JSON.stringify({ values }),
        signal: AbortSignal.timeout(30000),
      },
    );
    assert.equal(closed.status, 409, "A closed form still accepted an answer.");
    const outcomes = await request("/api/missions/outcomes");
    assert.ok(outcomes.outcomes.some((outcome) => outcome.id === task.id));
    console.log(
      "PASS Adopt, publish, claim, complete, respond, export, close and follow through",
    );
  } finally {
    if (missionId) {
      await request("/api/missions/" + missionId, "DELETE", {
        confirmation: title,
      });
      console.log(
        "PASS Delete the staging mission and its participation records",
      );
    }
    await request("/api/auth/logout", "POST");
  }
}
main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
