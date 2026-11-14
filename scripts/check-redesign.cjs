/* UI integration checks use isolated API fixtures; no production database is touched.
 * Run against an existing local server: node scripts/check-redesign.cjs
 * Requires Playwright (provided by the Codex environment) and Chromium.
 */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const { chromium } = require("playwright");
const base = process.env.COSMOGOV_TEST_URL || "http://127.0.0.1:3000";
const output = process.env.COSMOGOV_TEST_ARTIFACTS || "/tmp/cosmogov-ui-checks";
const user = {
  id: "ui-test-user",
  name: "Alex Morgan",
  email: "alex@example.test",
  role: "user",
  plan: "community",
  totalXp: 20,
  level: 1,
  streak: 2,
};
const date = (days) => new Date(Date.now() + days * 86400000).toISOString();
const makeProposal = (id, title, extra = {}) => ({
  id,
  title,
  description:
    "A community-led proposal to make our shared spaces more welcoming. Help consider the priorities, share a perspective, and decide together.",
  status: "active",
  category: "environment",
  votingType: "yes_no",
  createdAt: date(-3),
  closesAt: date(5),
  options: '["For","Against"]',
  quorum: 10,
  isAnonymous: false,
  creator: { name: "Jamie Lee" },
  organization: { name: "Riverside Neighborhood", slug: "riverside" },
  votes: [],
  comments: [],
  _count: { votes: 0, comments: 0 },
  ...extra,
});
let proposals = [
  makeProposal("garden", "A community garden on Riverside Avenue"),
  makeProposal("streets", "Safer streets around our schools", {
    category: "infrastructure",
    closesAt: date(2),
  }),
  makeProposal("library", "Longer library hours, more possibilities", {
    category: "education",
    votes: [
      {
        id: "my-vote",
        voterId: user.id,
        option: "For",
        voter: { name: user.name },
      },
    ],
    _count: { votes: 1, comments: 0 },
  }),
  makeProposal("trees", "A tree canopy for our shared spaces", {
    status: "closed",
    closesAt: date(-1),
  }),
];
const orgs = [
  {
    id: "org-one",
    name: "Riverside Neighborhood",
    slug: "riverside",
    description: "Neighbors making everyday spaces better, together.",
    memberCount: 24,
    proposalCount: 4,
    role: "member",
  },
  {
    id: "org-two",
    name: "Open City Collective",
    slug: "open-city",
    description: "A shared space for better public conversations.",
    memberCount: 18,
    proposalCount: 2,
    role: "member",
  },
];
let rejectVote = true,
  rejectComment = true,
  createdProcess = null;
const failures = [],
  checks = [],
  pageErrors = [];
async function check(name, fn) {
  try {
    await fn();
    checks.push(name);
    console.log("PASS", name);
  } catch (e) {
    failures.push({ name, error: e.message });
    console.log("FAIL", name, e.message);
  }
}
async function capture(page, path) {
  await page.evaluate(() => {
    document.activeElement?.blur();
    window.scrollTo({ top: 0, behavior: "instant" });
  });
  await page.screenshot({ path, fullPage: true, animations: "disabled" });
}
async function noOverflow(page, name) {
  const info = await page.evaluate(() => ({
    viewport: innerWidth,
    width: document.documentElement.scrollWidth,
  }));
  assert.ok(
    info.width <= info.viewport + 1,
    `${name}: horizontal overflow ${info.width}/${info.viewport}`,
  );
}
async function fixtures(context) {
  await context.addCookies([
    {
      name: "cosmogov_session",
      value: Buffer.from("ui-test-user:1:fixture").toString("base64"),
      url: base,
    },
  ]);
  await context.route("**/api/**", async (route) => {
    const url = new URL(route.request().url()),
      path = url.pathname,
      method = route.request().method();
    let data = {},
      status = 200;
    if (path === "/api/auth/me") data = user;
    else if (path === "/api/notifications") data = [];
    else if (path === "/api/organizations") data = orgs;
    else if (path === "/api/proposals")
      data = proposals.filter(
        (p) =>
          (!url.searchParams.get("status") ||
            p.status === url.searchParams.get("status")) &&
          (!url.searchParams.get("category") ||
            p.category === url.searchParams.get("category")) &&
          (!url.searchParams.get("search") ||
            p.title
              .toLowerCase()
              .includes(url.searchParams.get("search").toLowerCase())),
      );
    else if (/^\/api\/proposals\/[^/]+$/.test(path)) {
      data = proposals.find((p) => p.id === path.split("/").at(-1));
      if (!data) {
        status = 404;
        data = { error: "Not found" };
      }
    } else if (path.endsWith("/vote")) {
      if (rejectVote) {
        status = 409;
        data = { error: "Voting is no longer open for this proposal." };
      } else {
        const body = route.request().postDataJSON();
        const p = proposals.find((p) => p.id === path.split("/")[3]);
        p.votes = [
          ...p.votes.filter((v) => v.voterId !== user.id),
          {
            id: "new-vote",
            voterId: user.id,
            option: body.option,
            voter: { name: user.name },
          },
        ];
        p._count.votes = p.votes.length;
        data = { id: "new-vote" };
      }
    } else if (path.endsWith("/comments")) {
      if (rejectComment) {
        status = 500;
        data = { error: "Your comment couldn’t be posted. Please try again." };
      } else {
        const p = proposals.find((p) => p.id === path.split("/")[3]);
        p.comments.unshift({
          id: "new-comment",
          content: route.request().postDataJSON().content,
          createdAt: date(0),
          author: { name: user.name },
        });
        data = { id: "new-comment" };
      }
    } else if (path === "/api/participation/processes" && method === "POST") {
      createdProcess = route.request().postDataJSON();
      data = { process: { id: "new-process" } };
    } else if (path === "/api/participation/processes")
      data = { processes: [], total: 0, totalPages: 0 };
    else if (path === "/api/participation/budget")
      data = { projects: [], total: 0, budgetPool: null };
    else if (path === "/api/participation/accountability")
      data = {
        milestones: [],
        stats: {
          total: 0,
          completed: 0,
          inProgress: 0,
          delayed: 0,
          overallProgress: 0,
        },
      };
    else if (path === "/api/auth/logout") data = { success: true };
    else data = [];
    await route.fulfill({
      status,
      contentType: "application/json",
      body: JSON.stringify(data),
    });
  });
}
(async () => {
  fs.mkdirSync(output, { recursive: true });
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
    headless: true,
    args: ["--no-sandbox"],
  });
  const publicContext = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    serviceWorkers: "block",
  });
  const page = await publicContext.newPage();
  page.on("pageerror", (e) => pageErrors.push(e.message));
  await check("Homepage, feature tabs, pricing and FAQ", async () => {
    await page.goto(base, { waitUntil: "networkidle", timeout: 120000 });
    await page.getByRole("heading", { name: /Big ideas/ }).waitFor();
    await page.getByRole("tab", { name: "Participatory budgets" }).click();
    await page
      .getByRole("heading", { name: "Decide where the budget goes." })
      .waitFor();
    await page.keyboard.press("ArrowRight");
    await page
      .getByRole("heading", { name: "Bring the whole community in." })
      .waitFor();
    await page.getByRole("button", { name: "Monthly", exact: true }).click();
    assert.match(await page.locator(".pricing-grid").innerText(), /\$49/);
    await page.getByRole("button", { name: /Yearly/ }).click();
    assert.match(await page.locator(".pricing-grid").innerText(), /\$39/);
    await page
      .getByText("Does AI make decisions for the community?", { exact: true })
      .click();
    assert.equal(await page.locator("details[open]").count(), 1);
    await noOverflow(page, "homepage desktop");
    await capture(page, `${output}/homepage-desktop.png`);
  });
  await check("Public mobile navigation and layout", async () => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(base, { waitUntil: "networkidle" });
    await page
      .getByRole("button", { name: "Open navigation", exact: true })
      .click();
    await page
      .locator(".site-nav")
      .getByRole("link", { name: "Pricing", exact: true })
      .click();
    assert.equal(await page.locator(".site-nav.is-open").count(), 0);
    await noOverflow(page, "homepage mobile");
    await capture(page, `${output}/homepage-mobile.png`);
  });
  await check("Signup roles and accessible password control", async () => {
    await page.goto(`${base}/auth/signup`, {
      waitUntil: "networkidle",
      timeout: 120000,
    });
    await page.getByRole("button", { name: /Government official/ }).click();
    await page.getByLabel("Government verification code").waitFor();
    await page.getByLabel("Your name").fill("Alex");
    await page.getByLabel("Email address").fill("alex@example.test");
    await page.getByLabel("Password", { exact: true }).fill("Example123");
    await page
      .getByRole("button", { name: "Show password", exact: true })
      .click();
    assert.equal(
      await page.getByLabel("Password", { exact: true }).getAttribute("type"),
      "text",
    );
    await noOverflow(page, "signup mobile");
    await capture(page, `${output}/signup-mobile.png`);
  });
  const workspace = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    serviceWorkers: "block",
  });
  await fixtures(workspace);
  const app = await workspace.newPage();
  app.on("pageerror", (e) => pageErrors.push(e.message));
  await check(
    "Civic desk shows unvoted proposals and real counts",
    async () => {
      await app.goto(`${base}/dashboard`, {
        waitUntil: "networkidle",
        timeout: 120000,
      });
      await app
        .getByRole("heading", { name: /Let’s make a little change/ })
        .waitFor();
      await app.locator(".proposal-card").first().waitFor();
      assert.equal(await app.locator(".proposal-card").count(), 2);
      assert.match(
        await app.locator(".desk-stats").innerText(),
        /Your contributions\n1/,
      );
      await noOverflow(app, "desk desktop");
      await capture(app, `${output}/civic-desk-desktop.png`);
    },
  );
  await check("Following persists and appears on the civic desk", async () => {
    await app
      .getByRole("button", {
        name: "Follow A community garden on Riverside Avenue",
        exact: true,
      })
      .click();
    await app.getByRole("tab", { name: /Following/ }).click();
    assert.equal(await app.locator(".proposal-card").count(), 1);
    await app.reload({ waitUntil: "networkidle" });
    await app.getByRole("tab", { name: /Following/ }).click();
    await app
      .getByRole("heading", {
        name: "A community garden on Riverside Avenue",
        exact: true,
      })
      .waitFor();
  });
  await check("Closed decisions and proposal search filters", async () => {
    await app.getByRole("tab", { name: /Closed decisions/ }).click();
    await app
      .getByRole("heading", {
        name: "A tree canopy for our shared spaces",
        exact: true,
      })
      .waitFor();
    await app.goto(`${base}/dashboard/proposals`, {
      waitUntil: "networkidle",
      timeout: 120000,
    });
    await app.getByLabel("Search proposals").fill("Safer");
    await app.waitForTimeout(400);
    assert.equal(await app.locator(".proposal-card").count(), 1);
    await app.getByLabel("Search proposals").fill("");
    await app.waitForTimeout(400);
    await app.getByRole("button", { name: "Following", exact: true }).click();
    await app
      .getByRole("heading", {
        name: "A community garden on Riverside Avenue",
        exact: true,
      })
      .waitFor();
    assert.equal(await app.locator(".proposal-card").count(), 1);
  });
  await check(
    "Decision brief, failed vote, successful vote and comment retry",
    async () => {
      await app.goto(`${base}/dashboard/proposals/garden`, {
        waitUntil: "networkidle",
        timeout: 120000,
      });
      await app
        .getByRole("heading", { name: "The rules, in the open." })
        .waitFor();
      await app.getByRole("radio", { name: "For", exact: true }).check();
      await app.getByRole("button", { name: "Make my voice count" }).click();
      await app
        .getByRole("alert")
        .filter({ hasText: "Voting is no longer open" })
        .waitFor();
      rejectVote = false;
      await app.getByRole("button", { name: "Make my voice count" }).click();
      await app
        .getByRole("status")
        .filter({ hasText: "Your vote is recorded" })
        .waitFor();
      await app
        .getByLabel("Add your perspective")
        .fill("Could we include accessible paths?");
      await app.getByRole("button", { name: "Join the discussion" }).click();
      await app
        .getByRole("alert")
        .filter({ hasText: "Your comment couldn’t be posted" })
        .waitFor();
      assert.equal(
        await app.getByLabel("Add your perspective").inputValue(),
        "Could we include accessible paths?",
      );
      rejectComment = false;
      await app.getByRole("button", { name: "Join the discussion" }).click();
      await app
        .locator(".decision-comments")
        .getByText("Could we include accessible paths?")
        .waitFor();
      await capture(app, `${output}/decision-room-desktop.png`);
    },
  );
  await check("Global keyboard command menu and query handoff", async () => {
    await app.keyboard.press("Control+k");
    await app.getByRole("dialog").waitFor();
    await app.getByLabel("Search tools").fill("garden");
    await app.getByRole("button", { name: "Search for “garden”" }).click();
    await app.waitForURL("**/dashboard/search?q=garden");
    await app
      .getByPlaceholder("Search proposals and your communities...")
      .waitFor();
    assert.equal(
      await app
        .getByPlaceholder("Search proposals and your communities...")
        .inputValue(),
      "garden",
    );
    await app.keyboard.press("Control+k");
    await app.getByLabel("Search tools").fill("safer");
    await app.getByRole("button", { name: "Search for “safer”" }).click();
    await app.waitForURL("**/dashboard/search?q=safer");
    await app.waitForFunction(
      () =>
        document.querySelector(
          'input[placeholder="Search proposals and your communities..."]',
        )?.value === "safer",
    );
  });
  await check(
    "Participation process creation is wired to the API",
    async () => {
      await app.goto(`${base}/dashboard/participation`, {
        waitUntil: "networkidle",
        timeout: 120000,
      });
      await app.getByRole("link", { name: /Create Process/ }).click();
      await app.getByRole("dialog").waitFor();
      await app
        .getByLabel("What will your community shape?")
        .fill("A better park");
      await app
        .getByLabel("Set the scene")
        .fill("How can we make this park welcoming to everyone?");
      await app
        .getByRole("button", { name: "Create participation process" })
        .click();
      await app.waitForURL("**/dashboard/participation/new-process");
      assert.equal(createdProcess.title, "A better park");
    },
  );
  await check(
    "Responsive workspace and dialogs at 375, 768, 1440px",
    async () => {
      for (const width of [375, 768, 1440]) {
        await app.setViewportSize({ width, height: 900 });
        for (const path of [
          "/dashboard",
          "/dashboard/proposals",
          "/dashboard/proposals/garden",
          "/dashboard/organizations",
          "/dashboard/decisions",
        ]) {
          await app.goto(base + path, {
            waitUntil: "networkidle",
            timeout: 120000,
          });
          await noOverflow(app, `${path} at ${width}`);
        }
        if (width === 375) {
          await app.goto(`${base}/dashboard`, { waitUntil: "networkidle" });
          await app
            .getByRole("button", { name: "Open navigation", exact: true })
            .click();
          await app.getByRole("dialog").waitFor();
          await noOverflow(app, "mobile menu");
          await app
            .getByRole("button", { name: "Close navigation", exact: true })
            .click();
          await app.locator('[data-slot="dialog-overlay"]').waitFor({ state: "hidden" });
          await capture(app, `${output}/civic-desk-mobile.png`);
        }
      }
    },
  );
  await check("No uncaught browser errors", async () =>
    assert.deepEqual(pageErrors, []),
  );
  await browser.close();
  fs.writeFileSync(
    `${output}/results.json`,
    JSON.stringify({ checks, failures, pageErrors }, null, 2),
  );
  console.log(
    JSON.stringify({ passed: checks.length, failed: failures.length, output }),
  );
  if (failures.length) process.exitCode = 1;
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
