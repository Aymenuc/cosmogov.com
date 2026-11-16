const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const base = process.env.PARTY_TEST_URL || "http://localhost:3000";
const output = path.resolve("artifacts/one-more-block");
(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
    headless: true,
    args: ["--no-sandbox"],
  });
  try {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 1100 },
      permissions: ["clipboard-read", "clipboard-write"],
    });
    await context.addCookies([
      {
        name: "cosmogov_session",
        value: "v1.browser.fixture",
        domain: new URL(base).hostname,
        path: "/",
      },
    ]);
    await context.route("**/api/**", (r) =>
      r.fulfill({
        json:
          new URL(r.request().url()).pathname === "/api/auth/me"
            ? {
                id: "fixture",
                name: "Neighbour",
                email: "test@example.invalid",
                role: "user",
                plan: "free",
                totalXp: 0,
                level: 1,
                streak: 0,
                emailVerifiedAt: "2026-01-01",
              }
            : [],
      }),
    );
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(base + "/dashboard/games/one-more-block?board=1");
    await page.getByText("Challenge #1.", { exact: false }).waitFor();
    fs.mkdirSync(output, { recursive: true });
    await page.locator(".omb-board").focus();
    await page.keyboard.press("ArrowLeft");
    await page
      .getByRole("button", { name: "Rethink the last move", exact: true })
      .click();
    assert.equal(
      await page
        .getByRole("button", { name: "Rethink the last move", exact: true })
        .isDisabled(),
      true,
    );
    await page
      .getByRole("button", { name: "Restart board", exact: true })
      .click();
    const actions = [
      "left",
      "share 0",
      "right",
      "share 7",
      "up",
      "share 2",
      "share 3",
      "right",
      "left",
      "up",
      "share 0",
      "share 7",
      "right",
      "down",
      "up",
      "share 3",
      "up",
      "share 1",
      "share 15",
    ];
    let n = 0;
    for (const action of actions) {
      if (action.startsWith("share")) {
        const i = Number(action.split(" ")[1]);
        await page
          .getByRole("button", {
            name: new RegExp(
              `row ${Math.floor(i / 4) + 1} column ${(i % 4) + 1}$`,
            ),
          })
          .click();
        await page.getByRole("button", { name: /^Share \d+$/ }).click();
      } else
        await page
          .getByRole("button", { name: `Slide ${action}`, exact: true })
          .click();
      if (++n === 10) {
        await page.evaluate(() => window.scrollTo(0, 0));
        await page.screenshot({
          path: path.join(output, "desktop.png"),
          fullPage: true,
        });
      }
    }
    await page
      .getByRole("heading", { name: "That’s a neighbourhood." })
      .waitFor();
    assert.match(await page.locator(".omb-end").innerText(), /included access/);
    await page.screenshot({
      path: path.join(output, "win.png"),
      fullPage: true,
    });
    await page
      .getByRole("button", { name: "Share challenge", exact: true })
      .click();
    assert.match(
      await page.evaluate(() => navigator.clipboard.readText()),
      /board=1/,
    );
    await page
      .getByRole("button", { name: "Same board, new plan", exact: true })
      .click();
    await page.setViewportSize({ width: 390, height: 844 });
    await page
      .getByRole("button", { name: "How to play", exact: true })
      .click();
    await page.screenshot({
      path: path.join(output, "mobile.png"),
      fullPage: true,
    });
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    );
    await page
      .getByRole("button", { name: "How to play", exact: true })
      .click();
    // A real touch swipe changes the board; no synthetic pointer-capture shortcuts.
    await page.locator(".omb-board").scrollIntoViewIfNeeded();
    const box = await page.locator(".omb-board").boundingBox();
    const cdp = await context.newCDPSession(page);
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [
        { x: box.x + box.width * 0.8, y: box.y + box.height * 0.5 },
      ],
    });
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [
        { x: box.x + box.width * 0.2, y: box.y + box.height * 0.5 },
      ],
    });
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchEnd",
      touchPoints: [],
    });
    await page.waitForFunction(() =>
      document.querySelector(".omb-round strong").textContent.startsWith("35"),
    );
    assert.deepEqual(errors, []);
    console.log(
      "PASS: keyboard, undo, deterministic complete round, contributions, civic result, challenge link, mobile layout and touch swipe. No page errors.",
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
