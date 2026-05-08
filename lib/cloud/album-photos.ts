// Album-only photo CRUD against Supabase.
//
// Album photos are independent of daily_records:
//   - they do NOT light the Home 100-grid
//   - they do NOT trigger the one-record-per-day rule
//   - they have optional `taken_on` and `location`
// This module only writes the row. Photo upload to the album-photos bucket
// happens through lib/cloud/storage.ts uploadAlbumPhoto().

import {
  ensureCloudClient,
  err,
  normalizeError,
  ok,
  type CloudResult,
} from "./errors";
import type {
  CloudAlbumPhotoInput,
  CloudAlbumPhotoRow,
} from "./types";

const ALBUM_FIELDS =
  "id, diary_space_id, storage_path, taken_on, location, note, width, height, bytes, created_at";

/**
 * List a diary_space's album photos, newest first. Sort prefers `taken_on`
 * (the user-provided date) and falls back to `created_at` when null.
 */
export async function listCloudAlbumPhotos(
  diarySpaceId: string,
): Promise<CloudResult<CloudAlbumPhotoRow[]>> {
  if (!diarySpaceId) return err("NOT_FOUND", "diarySpaceId is required.");

  const guard = ensureCloudClient();
  if (!guard.ok) return guard;

  try {
    const { data, error } = await guard.data
      .from("album_photos")
      .select(ALBUM_FIELDS)
      .eq("diary_space_id", diarySpaceId)
      .order("taken_on", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false });
    if (error) return normalizeError(error);
    return ok((data ?? []) as CloudAlbumPhotoRow[]);
  } catch (cause) {
    return normalizeError(cause);
  }
}

/**
 * Insert one album photo row. Caller must have already uploaded the file
 * to the album-photos bucket via uploadAlbumPhoto() and pass the resulting
 * `storagePath` here. The new row's id is returned in the result.
 */
export async function saveCloudAlbumPhoto(
  input: CloudAlbumPhotoInput,
): Promise<CloudResult<CloudAlbumPhotoRow>> {
  if (!input.diarySpaceId)
    return err("NOT_FOUND", "diarySpaceId is required.");
  if (!input.storagePath)
    return err("NOT_FOUND", "storagePath is required.");

  const guard = ensureCloudClient();
  if (!guard.ok) return guard;

  const row: Record<string, unknown> = {
    diary_space_id: input.diarySpaceId,
    storage_path: input.storagePath,
    taken_on: input.takenOn ?? null,
    location: input.location ?? null,
    note: input.note ?? null,
    width: input.width ?? null,
    height: input.height ?? null,
    bytes: input.bytes ?? null,
  };

  try {
    const { data, error } = await guard.data
      .from("album_photos")
      .insert(row)
      .select(ALBUM_FIELDS)
      .single();
    if (error) return normalizeError(error);
    return ok(data as CloudAlbumPhotoRow);
  } catch (cause) {
    return normalizeError(cause);
  }
}

/**
 * Delete one album photo row by id. The storage file in album-photos is
 * not auto-cascaded; caller should follow up with deletePhoto().
 */
export async function deleteCloudAlbumPhoto(
  id: string,
): Promise<CloudResult<void>> {
  if (!id) return err("NOT_FOUND", "id is required.");

  const guard = ensureCloudClient();
  if (!guard.ok) return guard;

  try {
    const { error } = await guard.data
      .from("album_photos")
      .delete()
      .eq("id", id);
    if (error) return normalizeError(error);
    return ok(undefined);
  } catch (cause) {
    return normalizeError(cause);
  }
}
