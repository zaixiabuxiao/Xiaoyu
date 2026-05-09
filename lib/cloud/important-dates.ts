// Phase 9K: cloud-first important dates persisted into app_settings.data.
//
// Storage shape:
//   app_settings.data = {
//     importantDates: ImportantDate[],
//     ...other keys preserved untouched
//   }
//
// `loadCloudImportantDates` returns:
//   - ok(ImportantDate[])  when the row exists and `data.importantDates` is a
//                          valid array (possibly empty),
//   - ok(null)             when the row exists but no `importantDates` key is
//                          set yet (the caller should treat this as "seed me"),
//   - ok(null)             when the row is missing entirely,
//   - err(...)             on RLS / network / parse failure.
//
// `saveCloudImportantDates` UPSERTs the row preserving every other key in
// `app_settings.data`, so the importantDates write never clobbers unrelated
// settings.

import {
  ensureCloudClient,
  err,
  normalizeError,
  ok,
  type CloudResult,
} from "./errors";
import {
  getCloudAppSettings,
  updateCloudAppSettings,
} from "./diary-space";
import type { ImportantDate } from "../important-dates";

function isValidDate(s: unknown): s is string {
  return typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s);
}

function isImportantDate(value: unknown): value is ImportantDate {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.id === "string" &&
    typeof v.label === "string" &&
    isValidDate(v.date) &&
    typeof v.createdAt === "string" &&
    typeof v.updatedAt === "string" &&
    (v.note === undefined || v.note === null || typeof v.note === "string")
  );
}

function normalizeArray(value: unknown): ImportantDate[] | null {
  if (!Array.isArray(value)) return null;
  const valid = value.filter(isImportantDate);
  return valid.map((d) => ({
    id: d.id,
    label: d.label,
    date: d.date,
    note:
      typeof d.note === "string" && d.note.trim().length > 0
        ? d.note
        : undefined,
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
  }));
}

export async function loadCloudImportantDates(
  diarySpaceId: string,
): Promise<CloudResult<ImportantDate[] | null>> {
  if (!diarySpaceId) return err("NOT_FOUND", "diarySpaceId is required.");
  const guard = ensureCloudClient();
  if (!guard.ok) return guard;

  try {
    const settings = await getCloudAppSettings(diarySpaceId);
    if (!settings.ok) return settings;
    if (!settings.data) return ok(null);
    const raw = (settings.data.data as Record<string, unknown> | null)?.[
      "importantDates"
    ];
    if (raw === undefined) return ok(null);
    const dates = normalizeArray(raw);
    return ok(dates ?? []);
  } catch (cause) {
    return normalizeError(cause);
  }
}

export async function saveCloudImportantDates(
  diarySpaceId: string,
  dates: ImportantDate[],
): Promise<CloudResult<void>> {
  if (!diarySpaceId) return err("NOT_FOUND", "diarySpaceId is required.");
  const guard = ensureCloudClient();
  if (!guard.ok) return guard;

  try {
    const settings = await getCloudAppSettings(diarySpaceId);
    if (!settings.ok) return settings;
    const existing =
      (settings.data?.data as Record<string, unknown> | undefined) ?? {};
    const next: Record<string, unknown> = {
      ...existing,
      importantDates: dates,
    };
    const result = await updateCloudAppSettings(diarySpaceId, next);
    if (!result.ok) return result;
    return ok(undefined);
  } catch (cause) {
    return normalizeError(cause);
  }
}
