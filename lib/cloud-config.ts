// Cloud sync feature flag.
//
// The app runs on localStorage by default. Cloud sync is only considered
// "enabled" when ALL of the following are true:
//   1. NEXT_PUBLIC_CLOUD_ENABLED === "true" (literal string)
//   2. NEXT_PUBLIC_SUPABASE_URL is set
//   3. NEXT_PUBLIC_SUPABASE_ANON_KEY is set
//
// Missing env vars never throw — the app falls back to localStorage.

import { hasSupabaseEnv } from "./supabase-client";

function readEnv(name: string): string | undefined {
  const value = process.env[name];
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export type CloudConfigStatus = {
  enabled: boolean;
  flagValue: string | undefined;
  hasSupabaseUrl: boolean;
  hasSupabaseAnonKey: boolean;
  reason: "ok" | "flag-off" | "missing-url" | "missing-anon-key";
};

/**
 * Returns true only when the feature flag is the literal string "true" AND
 * both Supabase env vars are present. Default is false in every other case.
 */
export function isCloudEnabled(): boolean {
  return getCloudConfigStatus().enabled;
}

export function getCloudConfigStatus(): CloudConfigStatus {
  const flagValue = readEnv("NEXT_PUBLIC_CLOUD_ENABLED");
  const hasSupabaseUrl = Boolean(readEnv("NEXT_PUBLIC_SUPABASE_URL"));
  const hasSupabaseAnonKey = Boolean(
    readEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  );
  const flagOn = flagValue === "true";

  let reason: CloudConfigStatus["reason"];
  if (!flagOn) {
    reason = "flag-off";
  } else if (!hasSupabaseUrl) {
    reason = "missing-url";
  } else if (!hasSupabaseAnonKey) {
    reason = "missing-anon-key";
  } else {
    reason = "ok";
  }

  const enabled = flagOn && hasSupabaseEnv();

  return {
    enabled,
    flagValue,
    hasSupabaseUrl,
    hasSupabaseAnonKey,
    reason,
  };
}
