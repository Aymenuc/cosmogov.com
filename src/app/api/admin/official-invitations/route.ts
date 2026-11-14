import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { z } from "zod";
import { db } from "@/lib/db";
import { apiAdmin, apiFailure, tokenHash, rateLimit } from "@/lib/api-server";
export async function GET() {
  try {
    await apiAdmin();
    return NextResponse.json(
      await db.officialInvitation.findMany({
        select: {
          id: true,
          email: true,
          expiresAt: true,
          usedAt: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
    );
  } catch (error) {
    return apiFailure(error);
  }
}
export async function POST(req: NextRequest) {
  try {
    const user = await apiAdmin();
    await rateLimit("official-invites", user.id, 20, 3600);
    const { email, hours } = z
      .object({
        email: z
          .email()
          .max(320)
          .transform((value) => value.toLowerCase()),
        hours: z.number().int().min(1).max(168).default(48),
      })
      .parse(await req.json());
    const token = randomBytes(32).toString("hex");
    const invitation = await db.officialInvitation.create({
      data: {
        email,
        tokenHash: tokenHash(token),
        createdBy: user.id,
        expiresAt: new Date(Date.now() + hours * 3_600_000),
      },
      select: { id: true, email: true, expiresAt: true },
    });
    return NextResponse.json(
      { ...invitation, code: token },
      { status: 201, headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return apiFailure(error);
  }
}
export async function DELETE(req: NextRequest) {
  try {
    await apiAdmin();
    const { id } = z
      .object({ id: z.string().max(100) })
      .parse(await req.json());
    await db.officialInvitation.deleteMany({ where: { id, usedAt: null } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiFailure(error);
  }
}
