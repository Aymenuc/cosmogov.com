import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { outputSchema } from "@/lib/missions/validation";
import { csvCell } from "@/lib/missions/forms";
import {
  accessMission,
  missionUser,
  requireManager,
  missionFailure,
  MissionError,
} from "@/lib/missions/server";
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; runId: string }> },
) {
  try {
    const user = await missionUser();
    const { id, runId } = await params;
    const { canManage } = await accessMission(id, user.id);
    requireManager(canManage);
    const run = await db.missionRun.findFirst({
      where: {
        id: runId,
        missionId: id,
        stage: "tool",
        acceptedAt: { not: null },
      },
    });
    if (!run) throw new MissionError(404, "Form not found.");
    const tool = outputSchema.parse(run.output).tool;
    if (!tool) throw new MissionError(404, "Form not found.");
    await db.missionEvent.create({
      data: { missionId: id, runId, actorId: user.id, action: "form_exported" },
    });
    const encoder = new TextEncoder();
    let cancelled = false;
    const stream = new ReadableStream({
      async start(controller) {
        try {
          controller.enqueue(
            encoder.encode(
              "\uFEFF" +
                [
                  "Respondent",
                  "Last saved",
                  ...tool.fields.map((field) => field.label),
                ]
                  .map(csvCell)
                  .join(",") +
                "\r\n",
            ),
          );
          let cursor: string | undefined;
          while (!cancelled) {
            const rows = await db.missionToolResponse.findMany({
              where: {
                missionId: id,
                runId,
                OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
              },
              include: { author: { select: { name: true } } },
              take: 500,
              orderBy: { id: "asc" },
              ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
            });
            if (!rows.length) break;
            controller.enqueue(
              encoder.encode(
                rows
                  .map((row) => {
                    const values = row.values as Record<string, string>;
                    return [
                      row.author.name || "Community member",
                      row.updatedAt.toISOString(),
                      ...tool.fields.map((field) => values[field.id] || ""),
                    ]
                      .map(csvCell)
                      .join(",");
                  })
                  .join("\r\n") + "\r\n",
              ),
            );
            cursor = rows.at(-1)!.id;
          }
          if (!cancelled) controller.close();
        } catch (error) {
          if (!cancelled) controller.error(error);
        }
      },
      cancel() {
        cancelled = true;
      },
    });
    return new Response(stream, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="mission-responses.csv"',
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    return missionFailure(error);
  }
}
