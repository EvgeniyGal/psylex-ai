"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let browserClient: SupabaseClient | null | undefined;

/**
 * Returns a browser Supabase client for Realtime, or null if env is not configured.
 * App auth stays on NextAuth; this client is used only for postgres_changes when WS works.
 */
export function getSupabaseBrowserClient(): SupabaseClient | null {
  if (browserClient !== undefined) return browserClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (!url || !anonKey) {
    browserClient = null;
    return null;
  }

  browserClient = createClient(url, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: {
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
        "x-api-key": anonKey,
      },
    },
    realtime: {
      params: {
        apikey: anonKey,
        eventsPerSecond: 10,
      },
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
        "x-api-key": anonKey,
      },
    },
  });

  return browserClient;
}

export function isSupabaseRealtimeConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim(),
  );
}

/**
 * True when the browser is allowed to open a Supabase Realtime WebSocket.
 * HTTPS pages cannot connect to ws:// (mixed content) — skip in that case and use SSE.
 */
export function canUseSupabaseRealtimeWebSocket() {
  if (typeof window === "undefined") return false;
  if (!isSupabaseRealtimeConfigured()) return false;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!.trim().toLowerCase();

  // Secure page + insecure Supabase URL → browser blocks ws:// and may throw.
  if (window.location.protocol === "https:" && url.startsWith("http:")) {
    return false;
  }

  return true;
}
