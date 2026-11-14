/* Real two-person flows, only inside the disposable database harness. */
module.exports = async function ({
  check,
  db,
  browser,
  page,
  base,
  owner,
  member,
  org,
  ownerCookie,
  memberCookie,
  pageErrors,
  screenshot,
  noOverflow,
}) {
  const assert = require("node:assert/strict");
  const call = async (path, body) => {
    const response = await fetch(base + path, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: ownerCookie },
      body: JSON.stringify(body),
    });
    assert.ok(
      response.ok,
      `Fixture request failed: ${path} (${response.status})`,
    );
    return response.json();
  };
  const mission = await call("/api/missions", {
    title: "A Saturday repair circle",
    goal: "Bring a small sewing repair station to our neighborhood.",
    organizationId: org.id,
  });
  const plan = await db.missionRun.create({
    data: {
      missionId: mission.id,
      requestedBy: owner.id,
      stage: "plan",
      origin: "manual",
      status: "completed",
      inputRevision: 0,
      acceptedAt: new Date(),
      reviewedBy: owner.id,
      output: {
        headline: "A Saturday repair plan",
        summary: "Prepare a small repair table.",
        findings: [],
        questions: [],
        tasks: [
          {
            title: "Prepare the sewing station",
            detail: "Bring sewing equipment and prepare the repair table.",
            minutes: 30,
          },
        ],
        tool: null,
      },
    },
  });
  const task = await db.missionTask.create({
    data: {
      missionId: mission.id,
      runId: plan.id,
      position: 0,
      title: "Prepare the sewing station",
      detail: "Bring sewing equipment and prepare the repair table.",
      minutes: 30,
    },
  });
  const form = await call(`/api/missions/${mission.id}/tools/drafts`, {
    inputRevision: 0,
    tool: {
      title: "Our practical offers",
      description: "Share an offer for the repair circle.",
      fields: [
        {
          id: "f1",
          label: "What could you offer?",
          kind: "choice",
          options: ["Sewing equipment", "Welcoming"],
          required: true,
        },
      ],
    },
  });
  await call(`/api/missions/${mission.id}/runs/${form.id}/accept`, {});
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    serviceWorkers: "block",
  });
  await context.addCookies([
    {
      name: "cosmogov_session",
      value: memberCookie.slice(memberCookie.indexOf("=") + 1),
      url: base,
    },
  ]);
  const participant = await context.newPage();
  participant.on("pageerror", (error) => pageErrors.push(error.message));
  try {
    await check(
      "Two people opt in, invite and accept responsibility through the real interface",
      async () => {
        await participant.goto(base + "/dashboard/missions/" + mission.id, {
          waitUntil: "networkidle",
        });
        await participant.getByRole("button", { name: /Shared tools/ }).click();
        await participant
          .getByLabel("What could you offer?")
          .selectOption("Sewing equipment");
        await participant.getByRole("checkbox").check();
        await participant
          .getByRole("button", { name: "Add my response", exact: true })
          .click();
        await participant
          .getByRole("button", { name: "Update my response", exact: true })
          .waitFor();
        await page.goto(base + "/dashboard/missions/" + mission.id, {
          waitUntil: "networkidle",
        });
        await page.getByRole("button", { name: /Action board/ }).click();
        const offers = page.locator(".mission-suggestions");
        await offers.getByText("Noura", { exact: true }).waitFor();
        await offers
          .getByRole("button", { name: "Invite to consider" })
          .click();
        await offers
          .getByText("Invitation sent. The person decides whether to accept.")
          .waitFor();
        assert.equal(
          (await db.missionTask.findUniqueOrThrow({ where: { id: task.id } }))
            .status,
          "open",
        );
        await participant.reload({ waitUntil: "networkidle" });
        await participant.getByRole("button", { name: /Action board/ }).click();
        await participant
          .locator(".mission-suggestions")
          .getByRole("button", { name: "Accept invitation" })
          .click();
        await participant
          .locator(".mission-suggestions")
          .getByText("accepted", { exact: true })
          .waitFor();
        assert.equal(
          (await db.missionTask.findUniqueOrThrow({ where: { id: task.id } }))
            .assignedToId,
          member.id,
        );
        await noOverflow(participant);
        await screenshot(participant, "mission-invitation-desktop.png");
        for (const width of [390, 768, 1024, 1440]) {
          await participant.setViewportSize({ width, height: 900 });
          await noOverflow(participant);
          if (width === 390)
            await screenshot(participant, "mission-invitation-mobile.png");
        }
      },
    );
    await check(
      "A participant adds completion evidence that appears on the accountability page",
      async () => {
        await participant
          .getByRole("button", { name: "Mark done", exact: true })
          .click();
        const dialog = participant.getByRole("dialog");
        await dialog
          .getByLabel("What was completed?")
          .fill(
            "We prepared the sewing table with two machines and a box of repair supplies.",
          );
        await dialog
          .getByLabel("Evidence link (optional)")
          .fill("https://example.test/repair-circle-log");
        await dialog
          .getByRole("button", { name: "Save evidence and mark done" })
          .click();
        await dialog.waitFor({ state: "hidden" });
        await participant.goto(
          base + "/dashboard/participation/accountability",
          { waitUntil: "networkidle" },
        );
        await participant
          .locator(".mission-outcomes")
          .getByRole("heading", { name: "Prepare the sewing station" })
          .waitFor();
        await participant
          .locator(".mission-outcomes")
          .getByText(
            "We prepared the sewing table with two machines and a box of repair supplies.",
          )
          .waitFor();
        await screenshot(participant, "mission-outcomes-desktop.png");
      },
    );
    await check(
      "An organizer saves a credited template and another member starts an unpublished adaptation",
      async () => {
        await page
          .getByRole("button", { name: "Save a template", exact: true })
          .click();
        const dialog = page.getByRole("dialog");
        await dialog
          .getByLabel("Template name")
          .fill("Our repair circle starting point");
        await dialog
          .getByLabel("Who can use this template?")
          .selectOption("organization");
        await dialog.getByLabel("Include the adopted plan").check();
        await dialog.getByLabel("Include the published form").check();
        await dialog
          .getByRole("button", { name: "Save selected work as template" })
          .click();
        await dialog
          .getByText("Template saved. Find it in Mission Studio.")
          .waitFor();
        await page.keyboard.press("Escape");
        await participant.goto(base + "/dashboard/missions", {
          waitUntil: "networkidle",
        });
        const card = participant.locator(".mission-template-card").filter({
          has: participant.getByRole("heading", {
            name: "Our repair circle starting point",
          }),
        });
        await card.getByText("Shared by Alex", { exact: true }).waitFor();
        await noOverflow(participant);
        await screenshot(participant, "mission-templates-desktop.png");
        await participant.setViewportSize({ width: 390, height: 900 });
        await noOverflow(participant);
        await screenshot(participant, "mission-templates-mobile.png");
        await card.getByRole("button", { name: "Start from this" }).click();
        await participant
          .getByLabel("Give your mission a name")
          .fill("Our Sunday repair circle");
        await participant
          .getByRole("button", { name: "Open our workspace" })
          .click();
        await participant.waitForURL("**/dashboard/missions/*");
        await participant
          .getByRole("heading", {
            name: "Our Sunday repair circle",
            exact: true,
          })
          .waitFor();
        await participant
          .locator(".mission-template-credit")
          .filter({
            hasText: "Our repair circle starting point · shared by Alex",
          })
          .waitFor();
        const copied = await db.mission.findUniqueOrThrow({
          where: { id: participant.url().split("/").at(-1) },
          include: { runs: true, toolResponses: true, tasks: true },
        });
        assert.equal(copied.runs.length, 2);
        assert.ok(copied.runs.every((run) => !run.acceptedAt));
        assert.equal(copied.toolResponses.length, 0);
        assert.equal(copied.tasks.length, 0);
      },
    );
  } finally {
    await context.close();
  }
};
