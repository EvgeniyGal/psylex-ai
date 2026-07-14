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
      // Self-hosted Kong often requires x-api-key on the WS upgrade.
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
