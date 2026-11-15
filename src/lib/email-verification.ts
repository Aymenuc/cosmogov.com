import { randomBytes } from "node:crypto";
import { db } from "@/lib/db";
import { ApiError, tokenHash } from "@/lib/api-server";
import { absoluteUrl, sendEmail, verifyEmail } from "@/lib/email";

const VALID_MS = 48 * 60 * 60 * 1000;

/** Creates a one-time confirmation link and emails it. */
export async function issueVerification(user: { id: string; email: string; name: string | null }) {
  const token = randomBytes(32).toString("base64url");
  await db.emailVerification.create({
    data: { userId: user.id, tokenHash: tokenHash(token), expiresAt: new Date(Date.now() + VALID_MS) },
  });
  const link = absoluteUrl(`/auth/verify?token=${encodeURIComponent(token)}`);
  return sendEmail({ ...verifyEmail({ recipientName: user.name || "", link }), to: user.email });
}

/**
 * Voting, signing and AI help need a confirmed email, so one person can't
 * cast many ballots or signatures with throwaway accounts.
 */
export function requireVerified(user: { emailVerifiedAt?: Date | null }) {
  if (!user.emailVerifiedAt)
    throw new ApiError(
      403,
      "Please confirm your email first. We sent you a link, and you can send a new one from your civic desk.",
    );
}
