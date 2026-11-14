import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { deleteSession } from "@/lib/auth";
import { apiUser, apiFailure } from "@/lib/api-server";
export async function POST() {
  try {
    const user = await apiUser();
    await db.user.update({
      where: { id: user.id },
      data: { sessionVersion: { increment: 1 } },
    });
    await deleteSession();
    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiFailure(error);
  }
}
