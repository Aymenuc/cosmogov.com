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
): string {
  const payload = Buffer.from(
    JSON.stringify({
      sub: userId,
      iat: now,
      exp: now + SESSION_LIFETIME_MS,
      nonce: randomBytes(16).toString("hex"),
    }),
  ).toString("base64url");
  const message = `v1.${payload}`;
  return `${message}.${createHmac("sha256", secret).update(message).digest("base64url")}`;
}
export function verifySession(
  token: string,
  secret: string,
  now = Date.now(),
): string | null {
  try {
    if (token.length > 2000) return null;
    const [version, payload, signature, extra] = token.split(".");
    if (version !== "v1" || !payload || !signature || extra !== undefined)
      return null;
    const expected = createHmac("sha256", secret)
      .update(`${version}.${payload}`)
      .digest();
    const actual = Buffer.from(signature, "base64url");
    if (actual.length !== expected.length || !timingSafeEqual(actual, expected))
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
    return data.sub;
  } catch {
    return null;
  }
}
