import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { createHash } from "node:crypto";
import { db } from "./db";
import { getSession } from "./auth";
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public retryAfter?: number,
  ) {
    super(message);
  }
}
export const tokenHash = (token: string) =>
  createHash("sha256").update(token).digest("hex");
export async function apiUser() {
  const user = await getSession();
  if (!user) throw new ApiError(401, "Please sign in.");
  return user;
}
export async function apiAdmin() {
  const user = await apiUser();
  if (!["admin", "super_admin"].includes(user.role))
    throw new ApiError(403, "Administrator access is required.");
  return user;
}
export function apiFailure(error: unknown) {
  if (error instanceof ApiError)
    return NextResponse.json(
      { error: error.message },
      {
        status: error.status,
        headers: error.retryAfter
          ? { "Retry-After": String(error.retryAfter) }
          : undefined,
      },
    );
  if (error instanceof z.ZodError || error instanceof SyntaxError)
    return NextResponse.json(
      { error: "Please check the submitted fields." },
      { status: 400 },
    );
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    ["P2034", "P2002"].includes(error.code)
  )
    return NextResponse.json(
      { error: "This changed while you were working. Refresh and try again." },
      { status: 409 },
    );
  console.error(
    "API request failed:",
    error instanceof Error ? error.name : "unknown",
  );
  return NextResponse.json(
    { error: "This action is unavailable. Please try again." },
    { status: 503 },
  );
}
// Persistent counters work across server workers. Untrusted forwarding headers
// are ignored unless the deployment is Vercel, which sets its own client header.
export function requestClient(req: Request) {
  return process.env.VERCEL === "1"
    ? req.headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim() ||
        "unknown"
    : "local-or-direct";
}
export async function rateLimit(
  scope: string,
  subject: string,
  limit: number,
  seconds: number,
) {
  const bucket = Math.floor(Date.now() / (seconds * 1000));
  const expiresAt = new Date((bucket + 1) * seconds * 1000);
  const key = `${scope}:${tokenHash(subject)}:${bucket}`;
  const result = await db.rateLimitBucket.upsert({
    where: { key },
    create: { key, expiresAt },
    update: { count: { increment: 1 } },
  });
  if (result.count > limit)
    throw new ApiError(
      429,
      "Too many attempts. Please try again later.",
      Math.max(1, Math.ceil((expiresAt.getTime() - Date.now()) / 1000)),
    );
}
export async function canReadProcess(
  process: {
    isPublic: boolean;
    createdBy: string;
    organizationId: string | null;
  },
  userId: string,
) {
  return (
    process.isPublic ||
    process.createdBy === userId ||
    Boolean(
      process.organizationId &&
      (await db.membership.findUnique({
        where: {
          userId_organizationId: {
            userId,
            organizationId: process.organizationId,
          },
        },
      })),
    )
  );
}
