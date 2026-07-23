import postgres from "postgres";
import { postgresSslOption } from "@/lib/db-ssl";

/** Keep SSE lifetimes short on serverless so session-pooler slots recycle. */
export const SSE_MAX_DURATION_SEC = 60;

type ListenClient = ReturnType<typeof postgres>;

export type SseListenHandle = {
  sql: ListenClient;
  close: () => void;
};

/**
 * Open a dedicated postgres client and LISTEN on a channel.
 * Callers must close the handle (abort / cancel / max lifetime).
 */
export async function openNotifyListen(
  channel: "mediation_room" | "mediation_user",
  onNotify: (payload: string) => void,
): Promise<SseListenHandle> {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL missing");
  }

  const sql = postgres(connectionString, {
    max: 1,
    prepare: false,
    connect_timeout: 5,
    // Recycle before platform maxDuration so the pooler slot is released.
    idle_timeout: SSE_MAX_DURATION_SEC + 5,
    max_lifetime: SSE_MAX_DURATION_SEC + 5,
    ssl: postgresSslOption(connectionString),
  });

  try {
    await sql.listen(channel, onNotify);
  } catch (error) {
    await sql.end({ timeout: 1 }).catch(() => undefined);
    throw error;
  }

  let closed = false;
  return {
    sql,
    close: () => {
      if (closed) return;
      closed = true;
      void sql.end({ timeout: 1 });
    },
  };
}

export function encodeSse(encoder: TextEncoder, event: string, data: unknown) {
  return encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}
