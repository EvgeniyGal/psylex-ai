/**
 * Shared Postgres client options for Supabase cloud (pooler requires TLS).
 */
export function postgresSslOption(url: string | undefined): "require" | undefined {
  if (!url) return undefined;
  try {
    const host = new URL(url).hostname;
    if (host.includes("supabase.co") || host.includes("pooler.supabase.com")) {
      return "require";
    }
  } catch {
    /* ignore */
  }
  return undefined;
}
