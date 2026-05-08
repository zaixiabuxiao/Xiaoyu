// Browser-safe Supabase client.
//
// IMPORTANT
// - Only the anon key is read here. The service-role key must never reach the
//   client bundle.
// - The app currently runs on localStorage. This client is *prepared* but not
//   used by any data path yet. See `lib/cloud-config.ts` for the gating flag.
// - If the env vars are missing, every helper here returns `null` so the app
//   keeps building and running in localStorage mode.
//
// Real reads/writes are introduced in a later phase (9D onward).

import {
  createClient,
  type SupabaseClient,
} from "@supabase/supabase-js";

let cachedClient: SupabaseClient | null | undefined;

function readEnv(name: string): string | undefined {
  const value = process.env[name];
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

/**
 * Returns a memoized browser-safe Supabase client, or `null` if env is missing.
 * Safe to call repeatedly. Never throws on missing env.
 */
export function getSupabaseClient(): SupabaseClient | null {
  if (cachedClient !== undefined) return cachedClient;

  const url = readEnv("NEXT_PUBLIC_SUPABASE_URL");
  const key = readEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");

  if (!url || !key) {
    cachedClient = null;
    return cachedClient;
  }

  cachedClient = createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
  return cachedClient;
}

/**
 * Convenience for "do we have a usable client?" without creating one.
 */
export function hasSupabaseEnv(): boolean {
  return Boolean(
    readEnv("NEXT_PUBLIC_SUPABASE_URL") &&
      readEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  );
}
