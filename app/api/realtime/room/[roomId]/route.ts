import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import postgres from "postgres";
import { and, eq } from "drizzle-orm";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { postgresSslOption } from "@/lib/db-ssl";
import { rooms, users } from "@/drizzle/schema";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ roomId: string }>;
};

async function resolveViewerUserId() {
  const session = await getServerSession(authOptions);
  let userId = session?.user?.id;

  if (!userId && session?.user?.name) {
    const [byLogin] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.login, session.user.name))
      .limit(1);
    userId = byLogin?.id;
  }

  return userId ?? null;
}

export async function GET(request: Request, context: RouteContext) {
  const { roomId } = await context.params;
  if (!roomId) {
    return NextResponse.json({ error: "Missing roomId" }, { status: 400 });
  }

  const userId = await resolveViewerUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [viewer] = await db
    .select({
      id: users.id,
      role: users.role,
      roomId: users.roomId,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!viewer) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const isPartyInRoom = viewer.roomId === roomId;
  let isMediatorOwner = false;
  if (viewer.role === "mediator") {
    const [owned] = await db
      .select({ id: rooms.id })
      .from(rooms)
      .where(and(eq(rooms.id, roomId), eq(rooms.createdByUserId, userId)))
      .limit(1);
    isMediatorOwner = !!owned;
  }

  if (!isPartyInRoom && !isMediatorOwner) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    return NextResponse.json({ error: "DATABASE_URL missing" }, { status: 500 });
  }

  const encoder = new TextEncoder();
  let listenSql: ReturnType<typeof postgres> | null = null;
  let closed = false;
  let heartbeatId: ReturnType<typeof setInterval> | undefined;

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        if (closed) return;
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      };

      try {
        listenSql = postgres(connectionString, {
          max: 1,
          prepare: false,
          idle_timeout: 0,
          max_lifetime: 0,
          ssl: postgresSslOption(connectionString),
        });

        await listenSql.listen("mediation_room", (payload) => {
          try {
            const parsed = JSON.parse(payload) as { room_id?: string };
            if (parsed.room_id !== roomId) return;
            send("room", parsed);
          } catch {
            // ignore malformed payloads
          }
        });

        send("ready", { roomId });
        heartbeatId = setInterval(() => send("ping", { t: Date.now() }), 25_000);
      } catch (error) {
        console.error("Room SSE listen failed:", error);
        closed = true;
        controller.error(error);
        if (listenSql) {
          void listenSql.end({ timeout: 1 });
        }
      }

      const onAbort = () => {
        closed = true;
        if (heartbeatId) clearInterval(heartbeatId);
        if (listenSql) {
          void listenSql.end({ timeout: 1 });
        }
        try {
          controller.close();
        } catch {
          // already closed
        }
      };

      request.signal.addEventListener("abort", onAbort);
    },
    cancel() {
      closed = true;
      if (heartbeatId) clearInterval(heartbeatId);
      if (listenSql) {
        void listenSql.end({ timeout: 1 });
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
