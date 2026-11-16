import { createHmac, timingSafeEqual } from "node:crypto";
import { sessionSecret } from "@/lib/session-token";

/**
 * A run is described by a signed token (who, which game, which seed, when),
 * so the server can rebuild the rounds and check answers without trusting
 * the browser or storing anything until the run is finished.
 */
export interface RunClaims {
  u: string; // user id
  g: string; // game slug
  s: number; // seed
  d: 0 | 1; // daily challenge?
  t: number; // started at (ms)
}

const MAX_AGE_MS = 6 * 60 * 60 * 1000;

function sign(body: string) {
  return createHmac("sha256", `games:${sessionSecret()}`).update(body).digest("base64url");
}

export function signRun(claims: RunClaims) {
  const body = Buffer.from(JSON.stringify(claims)).toString("base64url");
  return `${body}.${sign(body)}`;
}

export function readRun(token: string, userId: string): RunClaims | null {
  const [body, mac] = token.split(".");
  if (!body || !mac) return null;
  const expected = Buffer.from(sign(body));
  const given = Buffer.from(mac);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
  try {
    const claims = JSON.parse(Buffer.from(body, "base64url").toString()) as RunClaims;
    if (claims.u !== userId || Date.now() - claims.t > MAX_AGE_MS) return null;
    return claims;
  } catch {
    return null;
  }
}
