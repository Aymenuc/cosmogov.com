// Run against the local dev server; API fixtures isolate these UI checks from accounts.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const path = require("node:path");
const artifactDir = path.resolve("artifacts/block-party");
const base = process.env.PARTY_TEST_URL || "http://localhost:3000";
const assert = require("node:assert/strict");
const fs = require("node:fs");
(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
    headless: true,
    args: [
      "--no-sandbox",
      "--use-gl=angle",
      "--use-angle=swiftshader",
      "--enable-unsafe-swiftshader",
    ],
  });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1100 },
  });
  await context.addCookies([
    {
      name: "cosmogov_session",
      value: "v1.browser.fixture",
      domain: new URL(base).hostname,
      path: "/",
    },
  ]);
  await context.route("**/api/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    const body =
      path === "/api/auth/me"
        ? {
            id: "browser-fixture",
            name: "Neighbour",
            email: "test@example.invalid",
            role: "user",
            plan: "free",
            totalXp: 0,
            level: 1,
            streak: 0,
            emailVerifiedAt: "2026-01-01",
          }
        : path === "/api/games/overview"
          ? { games: {}, plays: 0, xp: 0 }
          : [];
    await route.fulfill({ json: body });
  });
  try {
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(base + "/dashboard/games/block-party");
    await page
      .getByRole("button", { name: "Let’s play", exact: true })
      .waitFor({ timeout: 90000 });
    assert.ok(
      await page
        .getByRole("button", { name: "Let’s play", exact: true })
        .isEnabled(),
    );
    await page.getByLabel("No timer — learn at your own pace").check();
    fs.mkdirSync(artifactDir, { recursive: true });
    await page.screenshot({
      path: path.join(artifactDir, "lobby.png"),
      fullPage: true,
    });
    await page.getByRole("button", { name: "Let’s play", exact: true }).click();
    await page.keyboard.down("Space");
    await page.keyboard.down("KeyD");
    await page.waitForTimeout(800);
    await page.keyboard.up("KeyD");
    await page.keyboard.up("Space");
    await page.waitForTimeout(300);
    await page.getByRole("button", { name: "Pause game", exact: true }).click();
    const score = await page.locator(".bp-panel").innerText();
    assert.match(score, /Party on pause/);
    await page.waitForTimeout(500);
    await page
      .getByRole("button", { name: "Keep playing", exact: true })
      .click();
    await page.screenshot({
      path: path.join(artifactDir, "rally.png"),
      fullPage: true,
    });
    await page.keyboard.press("Escape");
    await page
      .getByRole("button", { name: "Back to setup", exact: true })
      .click();
    await page.getByRole("button", { name: /Bumper Buddies/ }).click();
    await page
      .getByRole("button", { name: "Two neighbours", exact: true })
      .click();
    await page.getByRole("button", { name: "Let’s play", exact: true }).click();
    await page.keyboard.down("KeyW");
    await page.keyboard.down("ArrowUp");
    await page.waitForTimeout(400);
    await page.keyboard.up("KeyW");
    await page.keyboard.up("ArrowUp");
    await page.screenshot({
      path: path.join(artifactDir, "bumpers.png"),
      fullPage: true,
    });
    await page.evaluate(() => window.dispatchEvent(new Event("blur")));
    await page.getByRole("heading", { name: "Party on pause." }).waitFor();
    await page
      .getByRole("button", { name: "Back to setup", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Solo practice", exact: true })
      .click();
    await page.getByLabel("No timer — learn at your own pace").check();
    await page.setViewportSize({ width: 390, height: 844 });
    await page.getByRole("button", { name: "Let’s play", exact: true }).click();
    await page
      .getByRole("button", { name: "Move forward", exact: true })
      .scrollIntoViewIfNeeded();
    const pad = await page
      .getByRole("button", { name: "Move forward", exact: true })
      .boundingBox();
    await page.mouse.move(pad.x + pad.width / 2, pad.y + pad.height / 2);
    await page.mouse.down();
    await page.waitForTimeout(300);
    await page.mouse.up();
    await page.screenshot({
      path: path.join(artifactDir, "mobile.png"),
      fullPage: true,
    });
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    );
    await page.keyboard.press("Escape");
    await page
      .getByRole("button", { name: "Back to setup", exact: true })
      .click();
    assert.equal(await page.locator(".bp-canvas canvas").count(), 1);
    assert.deepEqual(errors, []);
    console.log(
      JSON.stringify({
        checks:
          "desktop render, jump input, pause/resume, mode switch, two-player input, blur pause, untimed mode, mobile layout, scene cleanup",
        errors,
      }),
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
