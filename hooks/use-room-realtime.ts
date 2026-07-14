"use client";

import { useEffect, useRef } from "react";
import {
  canUseSupabaseRealtimeWebSocket,
  getSupabaseBrowserClient,
} from "@/lib/supabase/browser-client";

const DEBOUNCE_MS = 150;
/** Open Postgres SSE fallback if Supabase WS has not subscribed yet. */
const SSE_FALLBACK_MS = 2500;

export type RoomRealtimeOptions = {
  watchUsers?: boolean;
  partyUserIds?: string[];
  enabled?: boolean;
};

function openRoomSse(roomId: string, onEvent: () => void) {
  const source = new EventSource(`/api/realtime/room/${encodeURIComponent(roomId)}`);
  const handle = () => onEvent();
  source.addEventListener("room", handle);
  source.addEventListener("ready", () => {
    // connected; no refetch required until a change lands
  });
  source.onerror = () => {
    // EventSource auto-reconnects; do not start interval polling
  };
  return () => {
    source.removeEventListener("room", handle);
    source.close();
  };
}

function openUserSse(userId: string, onEvent: () => void) {
  const source = new EventSource(`/api/realtime/user/${encodeURIComponent(userId)}`);
  const handle = () => onEvent();
  source.addEventListener("user", handle);
  source.onerror = () => {
    // EventSource auto-reconnects
  };
  return () => {
    source.removeEventListener("user", handle);
    source.close();
  };
}

/**
 * Live room updates via Supabase Realtime WebSocket (preferred on HTTPS cloud)
 * with Postgres LISTEN/NOTIFY SSE as fallback.
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
    let sseCleanup: (() => void) | undefined;
    let fallbackTimer: number | undefined;
    let supabaseSubscribed = false;

    const schedule = () => {
      if (cancelled) return;
      if (debounceId !== undefined) window.clearTimeout(debounceId);
      debounceId = window.setTimeout(() => {
        if (!cancelled) onEventRef.current();
      }, DEBOUNCE_MS);
    };

    const ensureSse = () => {
      if (cancelled || sseCleanup) return;
      sseCleanup = openRoomSse(roomId, schedule);
      if (process.env.NODE_ENV === "development") {
        console.info("[realtime] using Postgres SSE for room", roomId);
      }
    };

    const cleanups: Array<() => void> = [];

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
              supabaseSubscribed = true;
              if (fallbackTimer !== undefined) {
                window.clearTimeout(fallbackTimer);
                fallbackTimer = undefined;
              }
              if (process.env.NODE_ENV === "development") {
                console.info("[realtime] Supabase channel subscribed", channelName);
              }
              return;
            }
            if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
              if (process.env.NODE_ENV === "development") {
                console.warn(
                  "[realtime] Supabase WS failed; falling back to SSE",
                  status,
                  err?.message ?? err,
                );
              }
              void supabase.removeChannel(channel);
              ensureSse();
            }
          });

          cleanups.push(() => {
            void supabase.removeChannel(channel);
          });

          fallbackTimer = window.setTimeout(() => {
            if (!cancelled && !supabaseSubscribed) ensureSse();
          }, SSE_FALLBACK_MS);
        } catch (error) {
          if (process.env.NODE_ENV === "development") {
            console.warn("[realtime] Supabase subscribe skipped; using SSE", error);
          }
          ensureSse();
        }
      } else {
        ensureSse();
      }
    } else {
      ensureSse();
    }

    const onVisible = () => {
      if (document.visibilityState === "visible") schedule();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisible);
      if (debounceId !== undefined) window.clearTimeout(debounceId);
      if (fallbackTimer !== undefined) window.clearTimeout(fallbackTimer);
      sseCleanup?.();
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
 * Live user updates for testing dashboard (Supabase WS preferred, SSE fallback).
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
    let sseCleanup: (() => void) | undefined;
    let fallbackTimer: number | undefined;
    let supabaseSubscribed = false;

    const schedule = () => {
      if (cancelled) return;
      if (debounceId !== undefined) window.clearTimeout(debounceId);
      debounceId = window.setTimeout(() => {
        if (!cancelled) onEventRef.current();
      }, DEBOUNCE_MS);
    };

    const ensureSse = () => {
      if (cancelled || sseCleanup) return;
      sseCleanup = openUserSse(userId, schedule);
    };

    const cleanups: Array<() => void> = [];

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
              if (status === "SUBSCRIBED") {
                supabaseSubscribed = true;
                if (fallbackTimer !== undefined) {
                  window.clearTimeout(fallbackTimer);
                  fallbackTimer = undefined;
                }
                return;
              }
              if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
                if (process.env.NODE_ENV === "development") {
                  console.warn(
                    "[realtime] Supabase user channel failed; SSE fallback",
                    err?.message ?? err,
                  );
                }
                void supabase.removeChannel(channel);
                ensureSse();
              }
            });

          cleanups.push(() => {
            void supabase.removeChannel(channel);
          });

          fallbackTimer = window.setTimeout(() => {
            if (!cancelled && !supabaseSubscribed) ensureSse();
          }, SSE_FALLBACK_MS);
        } catch (error) {
          if (process.env.NODE_ENV === "development") {
            console.warn("[realtime] Supabase user subscribe skipped; using SSE", error);
          }
          ensureSse();
        }
      } else {
        ensureSse();
      }
    } else {
      ensureSse();
    }

    const onVisible = () => {
      if (document.visibilityState === "visible") schedule();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisible);
      if (debounceId !== undefined) window.clearTimeout(debounceId);
      if (fallbackTimer !== undefined) window.clearTimeout(fallbackTimer);
      sseCleanup?.();
      for (const cleanup of cleanups) cleanup();
    };
  }, [userId, enabled]);
}
