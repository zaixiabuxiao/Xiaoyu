// Browser-safe Supabase client.
//
// IMPORTANT
// - Only the public client key is read here. The service-role / "secret" key
//   must never reach the client bundle.
// - The app currently runs on localStorage. This client is *prepared* but not
//   used by any data path yet. See `lib/cloud-config.ts` for the gating flag.
// - If the env vars are missing, every helper here returns `null` so the app
//   keeps building and running in localStorage mode.
//
// Real reads/writes are introduced in a later phase (9D onward).
//
// Public key naming
// -----------------
// Supabase renamed the browser-safe client key in 2024:
//   - Older projects:    NEXT_PUBLIC_SUPABASE_ANON_KEY        (JWT, "eyJ...")
//   - Newer projects:    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ("sb_publishable_...")
// Both are functionally identical (RLS gates everything either way), so we
// accept either env name. Set whichever your dashboard exposes.

import {
  createClient,
  type SupabaseClient,
} from "@supabase/supabase-js";

let cachedClient: SupabaseClient | null | undefined;

// Each NEXT_PUBLIC_* env var must be referenced via a literal static property
// access (e.g. `process.env.NEXT_PUBLIC_SUPABASE_URL`) so Next.js's build-time
// substitution can inline its value into the browser bundle. A dynamic
// `process.env[name]` lookup is NOT replaced and would always be undefined in
// client components.
function readEnv(value: string | undefined): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

/**
 * Read the public client key from either supported env name.
 * Returns `undefined` when neither is set.
 */
function readPublicClientKey(): string | undefined {
  return (
    readEnv(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) ??
    readEnv(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  );
}

/**
 * Returns a memoized browser-safe Supabase client, or `null` if env is missing.
 * Safe to call repeatedly. Never throws on missing env.
 */
export function getSupabaseClient(): SupabaseClient | null {
  if (cachedClient !== undefined) return cachedClient;

  const url = readEnv(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const key = readPublicClientKey();

  if (!url || !key) {
    cachedClient = null;
    return cachedClient;
  }

  cachedClient = createClient(url, key, {
    auth: {
      // Supabase manages its own session storage under its own
      // localStorage key (separate from our `life_*` keys). Persisting +
      // auto-refreshing the access token is what makes the cloud-identity
      // sign-in survive page reloads.
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
    },
  });
  return cachedClient;
}

/**
 * Convenience for "do we have a usable client?" without creating one.
 */
export function hasSupabaseEnv(): boolean {
  return Boolean(
    readEnv(process.env.NEXT_PUBLIC_SUPABASE_URL) && readPublicClientKey(),
  );
}

/**
 * Returns the Supabase project host (e.g. `xxx.supabase.co`) parsed from
 * NEXT_PUBLIC_SUPABASE_URL. Safe to display — the host is not a secret.
 * Returns `null` when the URL is missing or unparseable.
 */
export function getCloudProjectHost(): string | null {
  const url = readEnv(process.env.NEXT_PUBLIC_SUPABASE_URL);
  if (!url) return null;
  try {
    return new URL(url).host;
  } catch {
    return null;
  }
}
