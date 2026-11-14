import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { apiUser, apiFailure, rateLimit } from "@/lib/api-server";
import { accessProposal } from "@/lib/proposals-server";
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await apiUser();
    await rateLimit("proposal-comment", user.id, 60, 3600);
    const { id } = await params;
    await accessProposal(id, user.id);
    const { content } = z
      .object({ content: z.string().trim().min(1).max(5000) })
      .parse(await req.json());
    return NextResponse.json(
      await db.comment.create({
        data: { proposalId: id, authorId: user.id, content },
        include: { author: { select: { id: true, name: true } } },
      }),
      { status: 201 },
    );
  } catch (error) {
    return apiFailure(error);
  }
}
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await apiUser();
    const { id } = await params;
    await accessProposal(id, user.id);
    return NextResponse.json(
      await db.comment.findMany({
        where: { proposalId: id },
        include: { author: { select: { id: true, name: true } } },
        orderBy: { createdAt: "desc" },
        take: 200,
      }),
    );
  } catch (error) {
    return apiFailure(error);
  }
}
