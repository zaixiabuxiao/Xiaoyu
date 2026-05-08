// Photo upload / signed-URL / delete for the two private buckets.
//
// Path conventions (must match storage RLS policies in migration 002):
//   daily-photos/{diary_space_id}/{daily_record_id}/{position}-{uuid}.jpg
//   album-photos/{diary_space_id}/{album_photo_id}.jpg
//
// All operations use the anon-keyed Supabase client. The user must already
// have an authenticated session AND a row in diary_space_members for the
// target space; RLS rejects everything else.

import {
  ensureCloudClient,
  err,
  normalizeError,
  ok,
  type CloudResult,
} from "./errors";

export const DAILY_PHOTOS_BUCKET = "daily-photos";
export const ALBUM_PHOTOS_BUCKET = "album-photos";

const SIGNED_URL_TTL_SECONDS = 60 * 60; // 1 hour

export type StoragePath = string;

export type UploadResult = {
  bucket: string;
  storagePath: StoragePath;
};

function safeUuid(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

/**
 * Upload one daily-record photo to the daily-photos bucket.
 *
 * - `position` is the 0-based ordering used by daily_record_photos.position.
 * - The filename embeds a fresh uuid so retries / duplicate uploads land at
 *   distinct paths and never collide.
 * - `upsert: false` so an unexpected path collision surfaces as an error
 *   instead of silently overwriting.
 */
export async function uploadDailyPhoto(params: {
  diarySpaceId: string;
  dailyRecordId: string;
  position: number;
  blob: Blob;
  contentType?: string;
}): Promise<CloudResult<UploadResult>> {
  if (!params.diarySpaceId || !params.dailyRecordId) {
    return err("NOT_FOUND", "diarySpaceId and dailyRecordId are required.");
  }

  const guard = ensureCloudClient();
  if (!guard.ok) return guard;

  const filename = `${params.position}-${safeUuid()}.jpg`;
  const storagePath = `${params.diarySpaceId}/${params.dailyRecordId}/${filename}`;

  try {
    const { error } = await guard.data.storage
      .from(DAILY_PHOTOS_BUCKET)
      .upload(storagePath, params.blob, {
        contentType: params.contentType ?? "image/jpeg",
        upsert: false,
      });
    if (error) return normalizeError(error);
    return ok({ bucket: DAILY_PHOTOS_BUCKET, storagePath });
  } catch (cause) {
    return normalizeError(cause);
  }
}

/**
 * Upload one album-only photo to the album-photos bucket. The album row's
 * id is used as the filename so the file path is stable across retries
 * (subsequent uploads with `upsert: false` will fail loudly, which is the
 * desired behavior).
 */
export async function uploadAlbumPhoto(params: {
  diarySpaceId: string;
  albumPhotoId: string;
  blob: Blob;
  contentType?: string;
}): Promise<CloudResult<UploadResult>> {
  if (!params.diarySpaceId || !params.albumPhotoId) {
    return err("NOT_FOUND", "diarySpaceId and albumPhotoId are required.");
  }

  const guard = ensureCloudClient();
  if (!guard.ok) return guard;

  const storagePath = `${params.diarySpaceId}/${params.albumPhotoId}.jpg`;

  try {
    const { error } = await guard.data.storage
      .from(ALBUM_PHOTOS_BUCKET)
      .upload(storagePath, params.blob, {
        contentType: params.contentType ?? "image/jpeg",
        upsert: false,
      });
    if (error) return normalizeError(error);
    return ok({ bucket: ALBUM_PHOTOS_BUCKET, storagePath });
  } catch (cause) {
    return normalizeError(cause);
  }
}

/**
 * Generate a short-lived signed URL for a private object. Default TTL is
 * 1 hour. Caller is expected to refresh the URL when it's about to expire;
 * never store signed URLs alongside the underlying record.
 */
export async function getSignedPhotoUrl(
  bucket: string,
  storagePath: string,
  expiresInSec: number = SIGNED_URL_TTL_SECONDS,
): Promise<CloudResult<string>> {
  if (!bucket || !storagePath) {
    return err("NOT_FOUND", "bucket and storagePath are required.");
  }

  const guard = ensureCloudClient();
  if (!guard.ok) return guard;

  try {
    const { data, error } = await guard.data.storage
      .from(bucket)
      .createSignedUrl(storagePath, expiresInSec);
    if (error) return normalizeError(error);
    if (!data?.signedUrl) {
      return err("NOT_FOUND", "Signed URL was not returned by the server.");
    }
    return ok(data.signedUrl);
  } catch (cause) {
    return normalizeError(cause);
  }
}

/**
 * Delete a photo file. Use after deleting the parent record (storage is
 * not auto-cascaded by row deletes).
 */
export async function deletePhoto(
  bucket: string,
  storagePath: string,
): Promise<CloudResult<void>> {
  if (!bucket || !storagePath) {
    return err("NOT_FOUND", "bucket and storagePath are required.");
  }

  const guard = ensureCloudClient();
  if (!guard.ok) return guard;

  try {
    const { error } = await guard.data.storage
      .from(bucket)
      .remove([storagePath]);
    if (error) return normalizeError(error);
    return ok(undefined);
  } catch (cause) {
    return normalizeError(cause);
  }
}
