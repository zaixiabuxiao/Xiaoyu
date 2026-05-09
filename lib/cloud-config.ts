// Cloud sync feature flag.
//
// The app runs on localStorage by default. Cloud sync is only considered
// "enabled" when ALL of the following are true:
//   1. NEXT_PUBLIC_CLOUD_ENABLED === "true" (literal string)
//   2. NEXT_PUBLIC_SUPABASE_URL is set
//   3. The public client key is set as either:
//        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (newer Supabase projects)
//      OR
//        NEXT_PUBLIC_SUPABASE_ANON_KEY        (older Supabase projects)
//
// Missing env vars never throw — the app falls back to localStorage.

import { hasSupabaseEnv } from "./supabase-client";

// Each NEXT_PUBLIC_* env var must be referenced via a literal static property
// access (e.g. `process.env.NEXT_PUBLIC_CLOUD_ENABLED`) so Next.js's build-time
// substitution can inline its value into the browser bundle. A dynamic
// `process.env[name]` lookup is NOT replaced and would always be undefined in
// client components.
function readEnv(value: string | undefined): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export type CloudConfigStatus = {
  enabled: boolean;
  flagValue: string | undefined;
  hasSupabaseUrl: boolean;
  hasSupabaseClientKey: boolean;
  reason: "ok" | "flag-off" | "missing-url" | "missing-client-key";
};

/**
 * Returns true only when the feature flag is the literal string "true" AND
 * both Supabase env vars are present. Default is false in every other case.
 */
export function isCloudEnabled(): boolean {
  return getCloudConfigStatus().enabled;
}

export function getCloudConfigStatus(): CloudConfigStatus {
  const flagValue = readEnv(process.env.NEXT_PUBLIC_CLOUD_ENABLED);
  const hasSupabaseUrl = Boolean(
    readEnv(process.env.NEXT_PUBLIC_SUPABASE_URL),
  );
  const hasSupabaseClientKey = Boolean(
    readEnv(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) ??
      readEnv(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
  );
  const flagOn = flagValue === "true";

  let reason: CloudConfigStatus["reason"];
  if (!flagOn) {
    reason = "flag-off";
  } else if (!hasSupabaseUrl) {
    reason = "missing-url";
  } else if (!hasSupabaseClientKey) {
    reason = "missing-client-key";
  } else {
    reason = "ok";
  }

  const enabled = flagOn && hasSupabaseEnv();

  return {
    enabled,
    flagValue,
    hasSupabaseUrl,
    hasSupabaseClientKey,
    reason,
  };
}
