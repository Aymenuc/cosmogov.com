import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { outputSchema } from "@/lib/missions/validation";
import {
  accessMission,
  missionUser,
  missionFailure,
  MissionError,
} from "@/lib/missions/server";
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; runId: string }> },
) {
  try {
    const user = await missionUser();
    const { id, runId } = await params;
    await accessMission(id, user.id);
    const run = await db.missionRun.findFirst({
      where: {
        id: runId,
        missionId: id,
        stage: "tool",
        status: "completed",
        acceptedAt: { not: null },
      },
    });
    if (!run) throw new MissionError(404, "Published tool not found.");
    const tool = outputSchema.parse(run.output).tool;
    if (!tool) throw new MissionError(404, "Published tool not found.");
    const { values } = z
      .object({ values: z.record(z.string(), z.string().trim().max(500)) })
      .parse(await req.json());
    const known = new Set(tool.fields.map((f) => f.id));
    if (Object.keys(values).some((key) => !known.has(key)))
      throw new MissionError(400, "The form includes an unknown field.");
    for (const field of tool.fields) {
      const value = values[field.id] || "";
      if (
        (field.required && !value) ||
        (value && field.kind === "choice" && !field.options.includes(value))
      )
        throw new MissionError(400, `Please check: ${field.label}`);
    }
    await db.missionToolResponse.upsert({
      where: { runId_authorId: { runId, authorId: user.id } },
      create: { missionId: id, runId, authorId: user.id, values },
      update: { values },
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return missionFailure(error);
  }
}
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; runId: string }> },
) {
  try {
    const user = await missionUser();
    const { id, runId } = await params;
    await accessMission(id, user.id);
    await db.missionToolResponse.deleteMany({
      where: { missionId: id, runId, authorId: user.id },
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return missionFailure(error);
  }
}
