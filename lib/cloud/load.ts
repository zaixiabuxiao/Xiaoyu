"use client";

// Phase 9J cloud loader.
//
// One-shot fetch of every domain we want to render cloud-first:
//   - daily_records (+ daily_record_photos with signed URLs in position order)
//   - album_photos  (with signed URLs and folder_id)
//   - planned_chapters
//   - memory_folders
//
// Returns a snapshot already mapped into the existing local-records shapes
// (DailyRecord, AlbumPhoto, MemoryFolder, planned: string[]) so consumers
// that previously read localStorage can render it without changes.
//
// Signed URLs expire (default 1h). The loader caches them only inside the
// returned snapshot — never to localStorage — so a later refresh always
// regenerates them.

import type { AlbumPhoto, DailyRecord } from "../local-records";
import type { MemoryFolder } from "../memory-folders";
import { LA_TIMEZONE } from "../date-utils";
import { listCloudAlbumPhotos } from "./album-photos";
import { listCloudDailyRecords } from "./daily-records";
import { listCloudMemoryFolders } from "./memory-folders";
import { listCloudPlannedChapters } from "./planned-chapters";
import {
  ALBUM_PHOTOS_BUCKET,
  DAILY_PHOTOS_BUCKET,
  getSignedPhotoUrl,
} from "./storage";
import {
  mapCloudAlbumPhotoToAlbumPhoto,
  mapCloudDailyRecordToDailyRecord,
  type CloudAlbumPhotoRow,
  type CloudMemoryFolderRow,
} from "./types";
import {
  err,
  normalizeError,
  ok,
  type CloudResult,
} from "./errors";

export type CloudSnapshot = {
  records: DailyRecord[];
  planned: string[];
  album: AlbumPhoto[];
  folders: MemoryFolder[];
  // Reverse maps used by mutations:
  cloudRecordIdByDate: Map<string, string>;
  cloudAlbumStoragePathById: Map<string, string>;
  cloudAlbumFolderIdById: Map<string, string | null>;
  cloudFolderIdByName: Map<string, string>;
  cloudDailyPhotoStoragePathsByDate: Map<string, string[]>;
};

function emptySnapshot(): CloudSnapshot {
  return {
    records: [],
    planned: [],
    album: [],
    folders: [],
    cloudRecordIdByDate: new Map(),
    cloudAlbumStoragePathById: new Map(),
    cloudAlbumFolderIdById: new Map(),
    cloudFolderIdByName: new Map(),
    cloudDailyPhotoStoragePathsByDate: new Map(),
  };
}

function mapCloudFolderToMemoryFolder(row: CloudMemoryFolderRow): MemoryFolder {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function resolveDailyPhotoUrls(
  storagePaths: string[],
): Promise<string[]> {
  const urls = await Promise.all(
    storagePaths.map(async (path) => {
      const r = await getSignedPhotoUrl(DAILY_PHOTOS_BUCKET, path);
      return r.ok ? r.data : null;
    }),
  );
  return urls.filter((u): u is string => typeof u === "string");
}

async function resolveAlbumPhotoUrl(
  storagePath: string,
): Promise<string | null> {
  const r = await getSignedPhotoUrl(ALBUM_PHOTOS_BUCKET, storagePath);
  return r.ok ? r.data : null;
}

/**
 * Fetch every cloud-backed domain for the given diary_space and return them
 * already mapped to the local app shapes. Photo URLs are resolved as signed
 * URLs from private buckets.
 *
 * If any sub-fetch fails, the whole call returns an `err` result so the
 * caller can fall back to local cache cleanly.
 */
export async function loadCloudSnapshot(
  diarySpaceId: string,
): Promise<CloudResult<CloudSnapshot>> {
  if (!diarySpaceId) return err("NOT_FOUND", "diarySpaceId is required.");

  try {
    const [recordsResult, albumResult, plannedResult, foldersResult] =
      await Promise.all([
        listCloudDailyRecords(diarySpaceId),
        listCloudAlbumPhotos(diarySpaceId),
        listCloudPlannedChapters(diarySpaceId),
        listCloudMemoryFolders(diarySpaceId),
      ]);

    if (!recordsResult.ok) return recordsResult;
    if (!albumResult.ok) return albumResult;
    if (!plannedResult.ok) return plannedResult;
    if (!foldersResult.ok) return foldersResult;

    const snapshot = emptySnapshot();

    // Folders
    for (const row of foldersResult.data) {
      snapshot.folders.push(mapCloudFolderToMemoryFolder(row));
      snapshot.cloudFolderIdByName.set(row.name, row.id);
    }
    const folderNameById = new Map<string, string>();
    for (const f of snapshot.folders) folderNameById.set(f.id, f.name);

    // Records + their signed photo URLs
    const recordPromises = recordsResult.data.map(async ({ record, photos }) => {
      const storagePaths = photos.map((p) => p.storage_path);
      const urls = await resolveDailyPhotoUrls(storagePaths);
      const mapped = mapCloudDailyRecordToDailyRecord(record, urls);
      snapshot.cloudRecordIdByDate.set(record.la_date, record.id);
      snapshot.cloudDailyPhotoStoragePathsByDate.set(
        record.la_date,
        storagePaths,
      );
      return mapped;
    });
    snapshot.records = await Promise.all(recordPromises);

    // Album photos with signed URLs
    const albumPromises = albumResult.data.map(async (row: CloudAlbumPhotoRow) => {
      const url = await resolveAlbumPhotoUrl(row.storage_path);
      const folderName =
        row.folder_id !== null
          ? folderNameById.get(row.folder_id)
          : undefined;
      snapshot.cloudAlbumStoragePathById.set(row.id, row.storage_path);
      snapshot.cloudAlbumFolderIdById.set(row.id, row.folder_id);
      return mapCloudAlbumPhotoToAlbumPhoto(row, url ?? "", folderName);
    });
    snapshot.album = await Promise.all(albumPromises);

    // Planned chapters
    snapshot.planned = plannedResult.data;

    return ok(snapshot);
  } catch (cause) {
    return normalizeError(cause);
  }
}

/**
 * Same shape as `mapCloudDailyRecordToDailyRecord` but with the timezone tag
 * already pinned. Used when the loader appends a single fresh record after a
 * write, so we don't need to re-fetch the whole list.
 */
export function localizeCloudRecord(
  record: DailyRecord,
): DailyRecord {
  return { ...record, timezone: LA_TIMEZONE };
}
