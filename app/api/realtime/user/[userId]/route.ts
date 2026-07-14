import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import postgres from "postgres";
import { eq } from "drizzle-orm";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { postgresSslOption } from "@/lib/db-ssl";
import { users } from "@/drizzle/schema";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ userId: string }>;
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
  const { userId: targetUserId } = await context.params;
  if (!targetUserId) {
    return NextResponse.json({ error: "Missing userId" }, { status: 400 });
  }

  const viewerId = await resolveViewerUserId();
  if (!viewerId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (viewerId !== targetUserId) {
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

        await listenSql.listen("mediation_user", (payload) => {
          try {
            const parsed = JSON.parse(payload) as { user_id?: string };
            if (parsed.user_id !== targetUserId) return;
            send("user", parsed);
          } catch {
            // ignore malformed payloads
          }
        });

        send("ready", { userId: targetUserId });
        heartbeatId = setInterval(() => send("ping", { t: Date.now() }), 25_000);
      } catch (error) {
        console.error("User SSE listen failed:", error);
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
