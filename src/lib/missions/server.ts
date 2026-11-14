import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { ZodError } from "zod";
export class MissionError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export async function missionUser() {
  const user = await getSession();
  if (!user) throw new MissionError(401, "Please sign in to your workspace.");
  return user;
}
export async function accessMission(id: string, userId: string) {
  const mission = await db.mission.findUnique({ where: { id } });
  if (!mission) throw new MissionError(404, "Mission not found.");
  const membership = mission.organizationId
    ? await db.membership.findUnique({
        where: {
          userId_organizationId: {
            userId,
            organizationId: mission.organizationId,
          },
        },
      })
    : null;
  // Former organization members lose access, including a former creator.
  if (mission.organizationId ? !membership : mission.createdBy !== userId)
    throw new MissionError(404, "Mission not found.");
  return {
    mission,
    canManage:
      mission.createdBy === userId ||
      ["admin", "moderator"].includes(membership?.role || ""),
  };
}
export function requireManager(canManage: boolean) {
  if (!canManage)
    throw new MissionError(
      403,
      "The mission creator or a community moderator can direct AI work and adopt plans.",
    );
}
export function missionFailure(error: unknown) {
  if (error instanceof MissionError)
    return NextResponse.json(
      { error: error.message },
      { status: error.status },
    );
  if (error instanceof ZodError || error instanceof SyntaxError)
    return NextResponse.json(
      { error: "Please check the form fields and try again." },
      { status: 400 },
    );
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    ["P2034", "P2002"].includes(error.code)
  )
    return NextResponse.json(
      {
        error:
          "This workspace changed while you were working. Refresh and try again.",
      },
      { status: 409 },
    );
  console.error(
    "Mission request failed:",
    error instanceof Error ? error.name : "unknown",
  );
  return NextResponse.json(
    { error: "The mission workspace is unavailable. Please try again." },
    { status: 503 },
  );
}
export const missionInclude = {
  creator: { select: { name: true } },
  organization: { select: { name: true, slug: true } },
  contributions: {
    include: { author: { select: { name: true } } },
    orderBy: { createdAt: "asc" as const },
  },
  runs: { orderBy: { createdAt: "desc" as const }, take: 20 },
  toolResponses: {
    include: { author: { select: { name: true } } },
    orderBy: { updatedAt: "desc" as const },
  },
  tasks: {
    include: { assignee: { select: { name: true } } },
    orderBy: [{ createdAt: "asc" as const }, { position: "asc" as const }],
  },
} satisfies Prisma.MissionInclude;
