// Daily-record CRUD against Supabase.
//
// saveCloudDailyRecord goes through the save_daily_record RPC so that:
//   - photo-required is enforced server-side (`23514 photo_required`)
//   - one-record-per-LA-date is enforced via the unique constraint (`23505`)
//   - record + photo rows insert atomically
//
// The RPC expects already-uploaded storage paths in `photos`. Photo upload
// orchestration lives in lib/cloud/storage.ts and a future migration phase;
// this module does not touch Storage on its own.

import {
  ensureCloudClient,
  err,
  normalizeError,
  ok,
  type CloudResult,
} from "./errors";
import type {
  CloudDailyRecordInput,
  CloudDailyRecordPatch,
  CloudDailyRecordPhotoRow,
  CloudDailyRecordRow,
} from "./types";

export type CloudDailyRecordWithPhotos = {
  record: CloudDailyRecordRow;
  photos: CloudDailyRecordPhotoRow[];
};

const RECORD_FIELDS =
  "id, diary_space_id, la_date, chapter_id, volume_id, title, note, memory, husband_reflection, wife_reflection, location, wants_to_repeat, time_label, recorded_at, created_at, updated_at";
const PHOTO_FIELDS =
  "id, daily_record_id, storage_path, width, height, bytes, position, created_at";

/**
 * List the diary_space's daily_records with their photo rows attached.
 * Photos are sorted by `position` ascending so callers can render them in
 * stable order.
 */
export async function listCloudDailyRecords(
  diarySpaceId: string,
): Promise<CloudResult<CloudDailyRecordWithPhotos[]>> {
  if (!diarySpaceId) return err("NOT_FOUND", "diarySpaceId is required.");

  const guard = ensureCloudClient();
  if (!guard.ok) return guard;

  try {
    const { data, error } = await guard.data
      .from("daily_records")
      .select(`${RECORD_FIELDS}, daily_record_photos (${PHOTO_FIELDS})`)
      .eq("diary_space_id", diarySpaceId)
      .order("la_date", { ascending: false });
    if (error) return normalizeError(error);

    type Joined = CloudDailyRecordRow & {
      daily_record_photos?: CloudDailyRecordPhotoRow[] | null;
    };

    const items = ((data ?? []) as Joined[]).map((row) => {
      const { daily_record_photos: photos, ...record } = row;
      const orderedPhotos = (photos ?? []).slice().sort(
        (a, b) => a.position - b.position,
      );
      return {
        record: record as CloudDailyRecordRow,
        photos: orderedPhotos,
      };
    });
    return ok(items);
  } catch (cause) {
    return normalizeError(cause);
  }
}

/**
 * Insert a daily_record + photo rows in one transaction via the RPC.
 *
 * Returns the new record's `id` on success. On failure, errors map to
 * stable codes:
 *   - PHOTO_REQUIRED — input.photos is empty, OR the RPC raised 23514.
 *   - DAILY_RECORD_EXISTS — duplicate (diary_space_id, la_date).
 *   - NOT_ALLOWED — caller is not a member of the diary_space.
 *   - NOT_AUTHENTICATED — no active Supabase Auth session.
 */
export async function saveCloudDailyRecord(
  input: CloudDailyRecordInput,
): Promise<CloudResult<string>> {
  if (input.photos.length === 0) {
    return err("PHOTO_REQUIRED", "这一页还缺一张今天的照片。");
  }

  const guard = ensureCloudClient();
  if (!guard.ok) return guard;

  const photosJson = input.photos.map((p, i) => ({
    storage_path: p.storagePath,
    width: p.width ?? null,
    height: p.height ?? null,
    bytes: p.bytes ?? null,
    position: p.position ?? i,
  }));

  try {
    const { data, error } = await guard.data.rpc("save_daily_record", {
      p_diary_space_id: input.diarySpaceId,
      p_la_date: input.laDate,
      p_chapter_id: input.chapterId,
      p_volume_id: input.volumeId,
      p_title: input.title,
      p_note: input.note,
      p_memory: input.memory ?? null,
      p_husband_reflection: input.husbandReflection ?? null,
      p_wife_reflection: input.wifeReflection ?? null,
      p_location: input.location ?? null,
      p_wants_to_repeat: input.wantsToRepeat ?? false,
      p_time_label: input.timeLabel ?? null,
      p_recorded_at: input.recordedAt ?? null,
      p_photos: photosJson,
    });
    if (error) return normalizeError(error);
    if (typeof data !== "string") {
      return err("UNKNOWN", "save_daily_record did not return an id.");
    }
    return ok(data);
  } catch (cause) {
    return normalizeError(cause);
  }
}

/**
 * Update an existing daily_record's text/metadata fields. Photos are
 * managed through dedicated functions (added later) so this never mutates
 * the photo array.
 */
export async function updateCloudDailyRecord(
  id: string,
  patch: CloudDailyRecordPatch,
): Promise<CloudResult<CloudDailyRecordRow>> {
  if (!id) return err("NOT_FOUND", "id is required.");

  const guard = ensureCloudClient();
  if (!guard.ok) return guard;

  const updates: Record<string, unknown> = {};
  if (patch.title !== undefined) updates.title = patch.title;
  if (patch.note !== undefined) updates.note = patch.note;
  if (patch.memory !== undefined) updates.memory = patch.memory;
  if (patch.husbandReflection !== undefined)
    updates.husband_reflection = patch.husbandReflection;
  if (patch.wifeReflection !== undefined)
    updates.wife_reflection = patch.wifeReflection;
  if (patch.location !== undefined) updates.location = patch.location;
  if (patch.wantsToRepeat !== undefined)
    updates.wants_to_repeat = patch.wantsToRepeat;
  if (patch.timeLabel !== undefined) updates.time_label = patch.timeLabel;

  if (Object.keys(updates).length === 0) {
    return err("UNKNOWN", "patch is empty — nothing to update.");
  }

  try {
    const { data, error } = await guard.data
      .from("daily_records")
      .update(updates)
      .eq("id", id)
      .select(RECORD_FIELDS)
      .single();
    if (error) return normalizeError(error);
    return ok(data as CloudDailyRecordRow);
  } catch (cause) {
    return normalizeError(cause);
  }
}

/**
 * Delete a daily_record by id. Photo child rows cascade-delete via the FK,
 * but storage objects do not — caller should also delete the photo files
 * via deletePhoto().
 */
export async function deleteCloudDailyRecord(
  id: string,
): Promise<CloudResult<void>> {
  if (!id) return err("NOT_FOUND", "id is required.");

  const guard = ensureCloudClient();
  if (!guard.ok) return guard;

  try {
    const { error } = await guard.data
      .from("daily_records")
      .delete()
      .eq("id", id);
    if (error) return normalizeError(error);
    return ok(undefined);
  } catch (cause) {
    return normalizeError(cause);
  }
}
