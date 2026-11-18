import { randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import {
  ApiError,
  apiFailure,
  apiUser,
  rateLimit,
  requestClient,
  tokenHash,
} from "@/lib/api-server";
import { roomLife } from "@/lib/games/spark";
import {
  actions,
  board,
  codeSchema,
  freshGame,
  play,
  roomCode,
  type Game,
} from "@/lib/games/spark-server";

const cookieName = (code: string) => "spark_" + code;
const cookiePath = "/api/games/spark";
function guestKey(req: NextRequest, code: string) {
  const secret = req.cookies.get(cookieName(code))?.value;
  return secret && /^[a-f0-9]{48}$/.test(secret)
    ? tokenHash(code + secret)
    : "";
}
const missing = () =>
  new ApiError(404, "This room code is incorrect or the room has expired.");
const json = (game: Game) => game as unknown as Prisma.InputJsonValue;

export async function GET(req: NextRequest) {
  try {
    const query = req.nextUrl.searchParams;
    if (!query.has("code")) {
      const host = await apiUser();
      return NextResponse.json(
        await db.sparkRoom.findMany({
          where: { hostId: host.id, expiresAt: { gt: new Date() } },
          select: { code: true, topic: true },
          orderBy: { createdAt: "desc" },
          take: 50,
        }),
      );
    }
    const code = codeSchema.parse(query.get("code"));
    const host = query.get("host") === "1" ? await apiUser() : null;
    const key = guestKey(req, code);
    if (!host && !key)
      throw new ApiError(403, "Join the room to see the board.");
    const room = await db.sparkRoom.findUnique({ where: { code } });
    if (!room || room.expiresAt <= new Date()) throw missing();
    const game = room.state as unknown as Game;
    if (host ? host.id !== room.hostId : !game.seats.some((s) => s.key === key))
      throw missing();
    return NextResponse.json(board(code, room.topic, game, host ? "" : key));
  } catch (err) {
    return apiFailure(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!req.headers.get("content-type")?.startsWith("application/json"))
      throw new ApiError(415, "Use a JSON request.");
    const move = actions.parse(await req.json());
    if (move.type === "create") {
      const host = await apiUser();
      await rateLimit("spark-open", host.id, 12, 3600);
      const game = freshGame();
      for (let attempt = 0; attempt < 3; attempt++) {
        const code = roomCode();
        try {
          await db.sparkRoom.create({
            data: {
              code,
              hostId: host.id,
              topic: move.topic,
              state: json(game),
              expiresAt: new Date(Date.now() + roomLife * 1000),
            },
          });
          return NextResponse.json(board(code, move.topic, game, ""), {
            status: 201,
          });
        } catch (err) {
          if (!(
            err instanceof Prisma.PrismaClientKnownRequestError &&
            err.code === "P2002"
          ))
            throw err;
        }
      }
      throw new ApiError(503, "Please try opening the room again.");
    }
    const { code } = move;
    const leading = ["advance", "clock", "finish"].includes(move.type);
    const host = leading ? await apiUser() : null;
    const previousKey = guestKey(req, code);
    const secret =
      move.type === "join" && !previousKey
        ? randomBytes(24).toString("hex")
        : "";
    const key = secret ? tokenHash(code + secret) : previousKey;
    if (!key && !host) throw new ApiError(403, "Join on this device first.");
    if (move.type === "join")
      await rateLimit("spark-join", requestClient(req), 150, 600);
    else await rateLimit("spark-turn", host?.id || key, 90, 300);
    const view = await db.$transaction(async (tx) => {
      // Serialize room changes across workers, including two guests submitting together.
      const [room] = await tx.$queryRaw<
        { hostId: string; topic: string; state: Game }[]
      >`
        SELECT "hostId", "topic", "state" FROM "SparkRoom"
        WHERE "code" = ${code} AND "expiresAt" > CURRENT_TIMESTAMP FOR UPDATE`;
      if (!room) throw missing();
      if (host && host.id !== room.hostId)
        throw new ApiError(403, "Only the room host can lead.");
      play(room.state, move, key, Boolean(host));
      await tx.sparkRoom.update({
        where: { code },
        data: { state: json(room.state) },
      });
      return board(code, room.topic, room.state, leading ? "" : key);
    });
    const response = NextResponse.json(view);
    if (secret)
      response.cookies.set(cookieName(code), secret, {
        path: cookiePath,
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: roomLife,
      });
    return response;
  } catch (err) {
    return apiFailure(err);
  }
}
