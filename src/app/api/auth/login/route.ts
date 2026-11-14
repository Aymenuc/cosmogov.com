import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { verifyPassword, createSession } from "@/lib/auth";
import {
  apiFailure,
  ApiError,
  rateLimit,
  requestClient,
} from "@/lib/api-server";
export async function POST(req: NextRequest) {
  try {
    await rateLimit("login-client", requestClient(req), 100, 900);
    const { email, password } = z
      .object({
        email: z
          .string()
          .trim()
          .email()
          .max(320)
          .transform((value) => value.toLowerCase()),
        password: z.string().min(1).max(200),
      })
      .parse(await req.json());
    await rateLimit("login-account", email, 10, 900);
    const user = await db.user.findUnique({ where: { email } });
    if (
      !user?.passwordHash ||
      !(await verifyPassword(password, user.passwordHash))
    )
      throw new ApiError(401, "Invalid credentials.");
    await createSession(user.id);
    return NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.name,
      plan: user.plan,
      role: user.role,
      totalXp: user.totalXp,
      level: user.level,
    });
  } catch (error) {
    return apiFailure(error);
  }
}
