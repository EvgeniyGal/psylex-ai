import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { eq } from "drizzle-orm";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/drizzle/schema";
import {
  encodeSse,
  openNotifyListen,
  SSE_MAX_DURATION_SEC,
} from "@/lib/realtime/sse-listen";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = SSE_MAX_DURATION_SEC;

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

  const encoder = new TextEncoder();
  let onPayload: ((payload: string) => void) | null = null;

  let listen;
  try {
    listen = await openNotifyListen("mediation_user", (payload) => {
      onPayload?.(payload);
    });
  } catch (error) {
    console.error("User SSE listen failed:", error);
    return NextResponse.json(
      { error: "Realtime unavailable" },
      { status: 503, headers: { "Retry-After": "5" } },
    );
  }

  let closed = false;
  let heartbeatId: ReturnType<typeof setInterval> | undefined;
  let lifetimeId: ReturnType<typeof setTimeout> | undefined;

  const cleanup = () => {
    if (closed) return;
    closed = true;
    onPayload = null;
    if (heartbeatId) clearInterval(heartbeatId);
    if (lifetimeId) clearTimeout(lifetimeId);
    listen.close();
  };

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const send = (event: string, data: unknown) => {
        if (closed) return;
        try {
          controller.enqueue(encodeSse(encoder, event, data));
        } catch {
          // stream already closed
        }
      };

      onPayload = (payload: string) => {
        try {
          const parsed = JSON.parse(payload) as { user_id?: string };
          if (parsed.user_id !== targetUserId) return;
          send("user", parsed);
        } catch {
          // ignore malformed payloads
        }
      };

      send("ready", { userId: targetUserId });
      heartbeatId = setInterval(() => send("ping", { t: Date.now() }), 25_000);

      lifetimeId = setTimeout(() => {
        cleanup();
        try {
          controller.close();
        } catch {
          // already closed
        }
      }, (SSE_MAX_DURATION_SEC - 2) * 1000);

      request.signal.addEventListener("abort", () => {
        cleanup();
        try {
          controller.close();
        } catch {
          // already closed
        }
      });
    },
    cancel() {
      cleanup();
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
