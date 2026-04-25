/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * Vercel / CI: Prisma requires DIRECT_URL when in schema, but you may only set
 * DATABASE_URL first. Fall back so migrate deploy can run. Prefer a real
 * direct (session) URL from Supabase for production migrations.
 */
const { spawnSync } = require("node:child_process");

if (!process.env.DIRECT_URL?.trim() && process.env.DATABASE_URL?.trim()) {
  process.env.DIRECT_URL = process.env.DATABASE_URL;
}

const r = spawnSync("npx", ["prisma", "migrate", "deploy"], {
  stdio: "inherit",
  env: process.env,
  shell: process.platform === "win32",
});
process.exit(r.status ?? 1);
