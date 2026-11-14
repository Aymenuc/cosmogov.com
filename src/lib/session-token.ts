import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
export const SESSION_LIFETIME_MS = 30 * 24 * 60 * 60 * 1000;
const globalSecret = globalThis as typeof globalThis & {
  cosmogovDevelopmentSecret?: string;
};
export function sessionSecret(): string {
  const configured = process.env.SESSION_SECRET;
  if (configured && configured.length >= 32) return configured;
  if (process.env.NODE_ENV === "production" || configured)
    throw new Error("SESSION_SECRET must contain at least 32 characters.");
  // Local development only. A restart invalidates local sessions; production must
  // use the same configured secret across all workers and deployments.
  globalSecret.cosmogovDevelopmentSecret ||= randomBytes(32).toString("hex");
  return globalSecret.cosmogovDevelopmentSecret;
}
export function signSession(
  userId: string,
  secret: string,
  now = Date.now(),
  sessionVersion = 0,
): string {
  const payload = Buffer.from(
    JSON.stringify({
      sub: userId,
      ver: sessionVersion,
      iat: now,
      exp: now + SESSION_LIFETIME_MS,
      nonce: randomBytes(16).toString("hex"),
    }),
  ).toString("base64url");
  const message = `v1.${payload}`;
  return `${message}.${createHmac("sha256", secret).update(message).digest("base64url")}`;
}
export function sessionClaims(
  token: string,
  secret: string,
  now = Date.now(),
): { userId: string; version: number; expiresAt: number } | null {
  try {
    if (token.length > 2000) return null;
    const [version, payload, signature, extra] = token.split(".");
    if (version !== "v1" || !payload || !signature || extra !== undefined)
      return null;
    const expected = createHmac("sha256", secret)
      .update(`${version}.${payload}`)
      .digest();
    const actual = Buffer.from(signature, "base64url");
    if (
      actual.length !== expected.length ||
      actual.toString("base64url") !== signature ||
      !timingSafeEqual(actual, expected)
    )
      return null;
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (
      typeof data.sub !== "string" ||
      !data.sub ||
      data.sub.length > 200 ||
      !Number.isSafeInteger(data.iat) ||
      !Number.isSafeInteger(data.exp)
    )
      return null;
    if (
      data.iat > now + 60_000 ||
      data.exp <= now ||
      data.exp - data.iat !== SESSION_LIFETIME_MS
    )
      return null;
    const versionNumber = data.ver ?? 0;
    if (!Number.isSafeInteger(versionNumber) || versionNumber < 0) return null;
    return { userId: data.sub, version: versionNumber, expiresAt: data.exp };
  } catch {
    return null;
  }
}

export function verifySession(
  token: string,
  secret: string,
  now = Date.now(),
): string | null {
  return sessionClaims(token, secret, now)?.userId || null;
}
