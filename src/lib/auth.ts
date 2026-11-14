import { createHash } from "node:crypto";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { db } from "./db";
import { signSession, sessionClaims, sessionSecret } from "./session-token";

const SESSION_COOKIE = "cosmogov_session";
const SALT_ROUNDS = 10;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createSession(userId: string) {
  const user = await db.user.findUniqueOrThrow({
    where: { id: userId },
    select: { sessionVersion: true },
  });
  const token = signSession(
    userId,
    sessionSecret(),
    Date.now(),
    user.sessionVersion,
  );
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: "/",
  });
  return token;
}

export async function getSession(): Promise<{
  id: string;
  email: string;
  name: string | null;
  plan: string;
  role: string;
  totalXp: number;
  level: number;
  streak: number;
} | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE)?.value;
    if (!token) return null;

    const claims = sessionClaims(token, sessionSecret());
    if (!claims) return null;
    if (
      await db.revokedSession.findUnique({
        where: { tokenHash: createHash("sha256").update(token).digest("hex") },
      })
    )
      return null;
    const userId = claims.userId;

    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        sessionVersion: true,
        id: true,
        email: true,
        name: true,
        plan: true,
        role: true,
        totalXp: true,
        level: true,
        streak: true,
      },
    });

    if (!user || user.sessionVersion !== claims.version) return null;
    const { sessionVersion: _version, ...profile } = user;
    return profile;
  } catch {
    return null;
  }
}

export async function deleteSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) {
    const claims = sessionClaims(token, sessionSecret());
    if (claims)
      await db.revokedSession.upsert({
        where: { tokenHash: createHash("sha256").update(token).digest("hex") },
        create: {
          tokenHash: createHash("sha256").update(token).digest("hex"),
          expiresAt: new Date(claims.expiresAt),
        },
        update: {},
      });
  }
  cookieStore.delete(SESSION_COOKIE);
}
