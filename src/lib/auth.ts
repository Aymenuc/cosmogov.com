import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { db } from './db';
import { signSession, verifySession, sessionSecret } from './session-token';

const SESSION_COOKIE = 'cosmogov_session';
const SALT_ROUNDS = 10;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createSession(userId: string) {
  const token = signSession(userId, sessionSecret());
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: '/',
  });
  return token;
}

export async function getSession(): Promise<{ id: string; email: string; name: string | null; plan: string; role: string; totalXp: number; level: number; streak: number } | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE)?.value;
    if (!token) return null;
    
    const userId = verifySession(token, sessionSecret());
    if (!userId) return null;
    
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, plan: true, role: true, totalXp: true, level: true, streak: true },
    });
    
    return user;
  } catch {
    return null;
  }
}

export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}
