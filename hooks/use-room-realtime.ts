"use client";

import { useEffect, useRef } from "react";
import {
  canUseSupabaseRealtimeWebSocket,
  getSupabaseBrowserClient,
} from "@/lib/supabase/browser-client";

const DEBOUNCE_MS = 150;
const POLL_INTERVAL_MS = 2_500;
const SSE_RETRY_BASE_MS = 2_000;
const SSE_RETRY_MAX_MS = 30_000;

export type RoomRealtimeOptions = {
  watchUsers?: boolean;
  partyUserIds?: string[];
  enabled?: boolean;
};

function openPolling(onEvent: () => void, intervalMs = POLL_INTERVAL_MS) {
  const id = window.setInterval(onEvent, intervalMs);
  return () => window.clearInterval(id);
}

/**
 * Opens EventSource with manual reconnect + backoff.
 * On sustained failure, falls back to polling so we do not hammer the
 * session pooler with LISTEN reconnect storms (which starve Server Actions).
 */
function openSseWithFallback(
  url: string,
  eventName: string,
  onEvent: () => void,
) {
  let cancelled = false;
  let source: EventSource | null = null;
  let retryId: number | undefined;
  let pollCleanup: (() => void) | null = null;
  let attempt = 0;
  let sawReady = false;

  const clearRetry = () => {
    if (retryId !== undefined) {
      window.clearTimeout(retryId);
      retryId = undefined;
    }
  };

  const stopSource = () => {
    if (!source) return;
    source.onerror = null;
    source.close();
    source = null;
  };

  const startPolling = () => {
    if (pollCleanup || cancelled) return;
    if (process.env.NODE_ENV === "development") {
      console.warn("[realtime] SSE unavailable; falling back to polling", url);
    }
    pollCleanup = openPolling(onEvent);
  };

  const connect = () => {
    if (cancelled) return;
    stopSource();

    const next = new EventSource(url);
    source = next;

    const handle = () => onEvent();
    next.addEventListener(eventName, handle);
    next.addEventListener("ready", () => {
      sawReady = true;
      attempt = 0;
      if (pollCleanup) {
        pollCleanup();
        pollCleanup = null;
      }
    });

    next.onerror = () => {
      // Stop native EventSource reconnect — it opens new LISTENs without bound.
      stopSource();
      if (cancelled) return;

      attempt += 1;
      if (!sawReady || attempt >= 3) {
        startPolling();
      }

      const delay = Math.min(
        SSE_RETRY_BASE_MS * 2 ** Math.min(attempt - 1, 4),
        SSE_RETRY_MAX_MS,
      );
      clearRetry();
      retryId = window.setTimeout(connect, delay);
    };
  };

  connect();

  return () => {
    cancelled = true;
    clearRetry();
    stopSource();
    if (pollCleanup) pollCleanup();
  };
}

function openRoomSse(roomId: string, onEvent: () => void) {
  return openSseWithFallback(
    `/api/realtime/room/${encodeURIComponent(roomId)}`,
    "room",
    onEvent,
  );
}

function openUserSse(userId: string, onEvent: () => void) {
  return openSseWithFallback(
    `/api/realtime/user/${encodeURIComponent(userId)}`,
    "user",
    onEvent,
  );
}

/**
 * Live room updates via:
 * 1. Postgres LISTEN/NOTIFY SSE (preferred — reliable with app auth)
 * 2. Short polling fallback when SSE cannot hold a pooler slot
 * 3. Supabase Realtime WebSocket when configured (additive; may be silent under RLS)
 *
 * Events are debounced so dual delivery does not double-refresh.
 */
export function useRoomRealtime(
  roomId: string | null | undefined,
  onEvent: () => void,
  options: RoomRealtimeOptions = {},
) {
  const { watchUsers = true, partyUserIds = [], enabled = true } = options;
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;
  const partyKey = partyUserIds.filter(Boolean).sort().join(",");

  useEffect(() => {
    if (!enabled || !roomId) return;

    let cancelled = false;
    let debounceId: number | undefined;

    const schedule = () => {
      if (cancelled) return;
      if (debounceId !== undefined) window.clearTimeout(debounceId);
      debounceId = window.setTimeout(() => {
        if (!cancelled) onEventRef.current();
      }, DEBOUNCE_MS);
    };

    const cleanups: Array<() => void> = [];

    cleanups.push(openRoomSse(roomId, schedule));
    if (process.env.NODE_ENV === "development") {
      console.info("[realtime] Postgres SSE listening for room", roomId);
    }

    if (canUseSupabaseRealtimeWebSocket()) {
      const supabase = getSupabaseBrowserClient();
      if (supabase) {
        const channelName = `room:${roomId}:${partyKey || "rooms"}`;
        try {
          const channel = supabase.channel(channelName);

          channel.on(
            "postgres_changes",
            { event: "*", schema: "public", table: "rooms", filter: `id=eq.${roomId}` },
            schedule,
          );
          channel.on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "room_messages",
              filter: `room_id=eq.${roomId}`,
            },
            schedule,
          );
          if (watchUsers) {
            channel.on(
              "postgres_changes",
              {
                event: "*",
                schema: "public",
                table: "users",
                filter: `room_id=eq.${roomId}`,
              },
              schedule,
            );
          }
          for (const userId of partyUserIds.filter(Boolean)) {
            channel.on(
              "postgres_changes",
              {
                event: "*",
                schema: "public",
                table: "user_test_completions",
                filter: `user_id=eq.${userId}`,
              },
              schedule,
            );
          }

          channel.subscribe((status, err) => {
            if (cancelled) return;
            if (status === "SUBSCRIBED") {
              if (process.env.NODE_ENV === "development") {
                console.info("[realtime] Supabase channel subscribed (additive)", channelName);
              }
              return;
            }
            if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
              if (process.env.NODE_ENV === "development") {
                console.warn(
                  "[realtime] Supabase WS unavailable; SSE/polling remains active",
                  status,
                  err?.message ?? err,
                );
              }
              void supabase.removeChannel(channel);
            }
          });

          cleanups.push(() => {
            void supabase.removeChannel(channel);
          });
        } catch (error) {
          if (process.env.NODE_ENV === "development") {
            console.warn("[realtime] Supabase subscribe skipped; SSE/polling remains active", error);
          }
        }
      }
    }

    const onVisible = () => {
      if (document.visibilityState === "visible") schedule();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisible);
      if (debounceId !== undefined) window.clearTimeout(debounceId);
      for (const cleanup of cleanups) cleanup();
    };
    // partyUserIds is represented by partyKey
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, enabled, watchUsers, partyKey]);
}

/**
 * Fires onEvent once when a deadline ISO timestamp is reached (plus a small grace).
 */
export function useDeadlineRefresh(
  deadlineIso: string | null | undefined,
  onEvent: () => void,
  enabled = true,
) {
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;
  const firedFor = useRef<string | null>(null);

  useEffect(() => {
    if (!enabled || !deadlineIso) return;
    if (firedFor.current === deadlineIso) return;

    const target = new Date(deadlineIso).getTime() + 400;
    const delay = target - Date.now();

    if (delay <= 0) {
      firedFor.current = deadlineIso;
      onEventRef.current();
      return;
    }

    const id = window.setTimeout(() => {
      firedFor.current = deadlineIso;
      onEventRef.current();
    }, delay);
    return () => window.clearTimeout(id);
  }, [deadlineIso, enabled]);
}

/**
 * Live user updates (SSE preferred; polling fallback; Supabase WS additive).
 */
export function useUserRealtime(
  userId: string | null | undefined,
  onEvent: () => void,
  options: { enabled?: boolean } = {},
) {
  const { enabled = true } = options;
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  useEffect(() => {
    if (!enabled || !userId) return;

    let cancelled = false;
    let debounceId: number | undefined;

    const schedule = () => {
      if (cancelled) return;
      if (debounceId !== undefined) window.clearTimeout(debounceId);
      debounceId = window.setTimeout(() => {
        if (!cancelled) onEventRef.current();
      }, DEBOUNCE_MS);
    };

    const cleanups: Array<() => void> = [];
    cleanups.push(openUserSse(userId, schedule));

    if (canUseSupabaseRealtimeWebSocket()) {
      const supabase = getSupabaseBrowserClient();
      if (supabase) {
        try {
          const channel = supabase
            .channel(`user:${userId}`)
            .on(
              "postgres_changes",
              { event: "*", schema: "public", table: "users", filter: `id=eq.${userId}` },
              schedule,
            )
            .on(
              "postgres_changes",
              {
                event: "*",
                schema: "public",
                table: "user_test_completions",
                filter: `user_id=eq.${userId}`,
              },
              schedule,
            )
            .subscribe((status, err) => {
              if (cancelled) return;
              if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
                if (process.env.NODE_ENV === "development") {
                  console.warn(
                    "[realtime] Supabase user channel unavailable; SSE/polling remains active",
                    err?.message ?? err,
                  );
                }
                void supabase.removeChannel(channel);
              }
            });

          cleanups.push(() => {
            void supabase.removeChannel(channel);
          });
        } catch (error) {
          if (process.env.NODE_ENV === "development") {
            console.warn("[realtime] Supabase user subscribe skipped; SSE/polling remains active", error);
          }
        }
      }
    }

    const onVisible = () => {
      if (document.visibilityState === "visible") schedule();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisible);
      if (debounceId !== undefined) window.clearTimeout(debounceId);
      for (const cleanup of cleanups) cleanup();
    };
  }, [userId, enabled]);
}
