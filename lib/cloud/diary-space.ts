// Diary space + app settings access.
//
// All functions assume the caller is authenticated (Supabase Auth session
// active in the browser). RLS policies will return zero rows / 401 when
// that's not the case; both paths normalize to a CloudResult error.

import {
  ensureCloudClient,
  err,
  normalizeError,
  ok,
  type CloudResult,
} from "./errors";
import type {
  CloudAppSettingsRow,
  CloudDiarySpace,
} from "./types";

/**
 * Returns the single diary_space row this user can see (RLS limits it to
 * one). `data` is `null` when the table is empty (no seed run yet) or when
 * the caller has no membership rows.
 */
export async function getCloudDiarySpace(): Promise<
  CloudResult<CloudDiarySpace | null>
> {
  const guard = ensureCloudClient();
  if (!guard.ok) return guard;

  try {
    const { data, error } = await guard.data
      .from("diary_spaces")
      .select(
        "id, name, passcode_hash, timezone, met_date, together_date, engagement_date, created_at, updated_at",
      )
      .limit(1)
      .maybeSingle();
    if (error) return normalizeError(error);
    return ok((data as CloudDiarySpace | null) ?? null);
  } catch (cause) {
    return normalizeError(cause);
  }
}

/**
 * Read app_settings.data for the given space. Returns `null` if no row
 * exists yet.
 */
export async function getCloudAppSettings(
  diarySpaceId: string,
): Promise<CloudResult<CloudAppSettingsRow | null>> {
  if (!diarySpaceId) return err("NOT_FOUND", "diarySpaceId is required.");

  const guard = ensureCloudClient();
  if (!guard.ok) return guard;

  try {
    const { data, error } = await guard.data
      .from("app_settings")
      .select("diary_space_id, data, updated_at")
      .eq("diary_space_id", diarySpaceId)
      .maybeSingle();
    if (error) return normalizeError(error);
    return ok((data as CloudAppSettingsRow | null) ?? null);
  } catch (cause) {
    return normalizeError(cause);
  }
}

/**
 * Upsert app_settings.data. The row is seeded by 001_initial_schema.sql, so
 * in steady state this performs an UPDATE; the upsert just keeps the
 * function safe even if the row was deleted manually.
 */
export async function updateCloudAppSettings(
  diarySpaceId: string,
  data: Record<string, unknown>,
): Promise<CloudResult<CloudAppSettingsRow>> {
  if (!diarySpaceId) return err("NOT_FOUND", "diarySpaceId is required.");

  const guard = ensureCloudClient();
  if (!guard.ok) return guard;

  try {
    const { data: row, error } = await guard.data
      .from("app_settings")
      .upsert(
        { diary_space_id: diarySpaceId, data },
        { onConflict: "diary_space_id" },
      )
      .select("diary_space_id, data, updated_at")
      .single();
    if (error) return normalizeError(error);
    return ok(row as CloudAppSettingsRow);
  } catch (cause) {
    return normalizeError(cause);
  }
}
