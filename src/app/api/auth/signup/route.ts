import { NextRequest, NextResponse, after } from "next/server";
import { issueVerification } from "@/lib/email-verification";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { db } from "@/lib/db";
import { hashPassword, createSession } from "@/lib/auth";
import { sessionSecret } from "@/lib/session-token";
import {
  apiFailure,
  ApiError,
  tokenHash,
  rateLimit,
  requestClient,
} from "@/lib/api-server";
import { sendEmail, welcomeEmail } from "@/lib/email";
const schema = z.object({
  email: z
    .string()
    .trim()
    .email()
    .max(320)
    .transform((value) => value.toLowerCase()),
  password: z.string().min(10).max(200),
  name: z.string().trim().max(100).default(""),
  role: z.enum(["user", "gov_official"]).default("user"),
  govCode: z.string().trim().max(128).optional(),
});
export async function POST(req: NextRequest) {
  try {
    await rateLimit("signup-client", requestClient(req), 60, 3600);
    const data = schema.parse(await req.json());
    sessionSecret();
    const passwordHash = await hashPassword(data.password);
    const user = await db.$transaction(
      async (tx) => {
        if (await tx.user.findUnique({ where: { email: data.email } }))
          throw new ApiError(409, "Email already registered.");
        let inviteId: string | undefined;
        if (data.role === "gov_official") {
          if (!data.govCode)
            throw new ApiError(
              403,
              "Ask an administrator for an official invitation tied to your email.",
            );
          const invite = await tx.officialInvitation.findUnique({
            where: { tokenHash: tokenHash(data.govCode) },
          });
          if (
            !invite ||
            invite.email !== data.email ||
            invite.usedAt ||
            invite.expiresAt <= new Date()
          )
            throw new ApiError(
              403,
              "This official invitation is invalid or expired. Ask your administrator for a new one.",
            );
          inviteId = invite.id;
        }
        const user = await tx.user.create({
          data: {
            email: data.email,
            passwordHash,
            name: data.name || data.email.split("@")[0],
            role: data.role,
            // Official invitations are emailed to this address, so it is already proven.
            emailVerifiedAt: inviteId ? new Date() : null,
          },
        });
        if (inviteId) {
          const used = await tx.officialInvitation.updateMany({
            where: {
              id: inviteId,
              usedAt: null,
              expiresAt: { gt: new Date() },
            },
            data: { usedAt: new Date(), usedBy: user.id },
          });
          if (used.count !== 1)
            throw new ApiError(
              409,
              "This invitation was already used. Ask for a new invitation.",
            );
        }
        return user;
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
    await createSession(user.id);
    after(async () => {
      // One email: welcome plus the link that confirms the address.
      const result = await issueVerification(user);
      if (!result.success) console.error("[EMAIL] Confirmation email not sent:", result.error);
    });
    return NextResponse.json(
      {
        id: user.id,
        email: user.email,
        name: user.name,
        plan: user.plan,
        role: user.role,
        totalXp: user.totalXp,
        level: user.level,
      },
      { status: 201 },
    );
  } catch (error) {
    return apiFailure(error);
  }
}
