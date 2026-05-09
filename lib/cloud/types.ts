// Cloud row + input shapes and pure mappers to existing app shapes.
//
// Mappers are pure transforms — they do not call Supabase. Photo URL
// resolution is the caller's job (lib/cloud/storage.ts createSignedUrl).
// Mappers consume already-resolved URLs so they can be unit-tested without
// any network.

import type {
  AlbumPhoto,
  DailyRecord,
} from "../local-records";
import { LA_TIMEZONE } from "../date-utils";

// ──────────────────────────────────────────────────────────────────────────
// Row types — one-to-one with the SQL columns. snake_case, nullable where
// the column is nullable.
// ──────────────────────────────────────────────────────────────────────────

export type CloudDiarySpace = {
  id: string;
  name: string;
  passcode_hash: string | null;
  timezone: string;
  met_date: string;
  together_date: string;
  engagement_date: string;
  created_at: string;
  updated_at: string;
};

export type CloudDailyRecordRow = {
  id: string;
  diary_space_id: string;
  la_date: string;
  chapter_id: string;
  volume_id: string;
  title: string;
  note: string;
  memory: string | null;
  husband_reflection: string | null;
  wife_reflection: string | null;
  location: string | null;
  wants_to_repeat: boolean;
  time_label: string | null;
  recorded_at: string;
  created_at: string;
  updated_at: string;
};

export type CloudDailyRecordPhotoRow = {
  id: string;
  daily_record_id: string;
  storage_path: string;
  width: number | null;
  height: number | null;
  bytes: number | null;
  position: number;
  created_at: string;
};

export type CloudAlbumPhotoRow = {
  id: string;
  diary_space_id: string;
  storage_path: string;
  taken_on: string | null;
  location: string | null;
  note: string | null;
  // Phase 9H: nullable FK to memory_folders. Null means the row predates
  // the folder concept and the application treats it as belonging to the
  // default "没有地点的照片" folder.
  folder_id: string | null;
  width: number | null;
  height: number | null;
  bytes: number | null;
  created_at: string;
};

export type CloudMemoryFolderRow = {
  id: string;
  diary_space_id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
};

export type CloudMemoryFolderInput = {
  diarySpaceId: string;
  name: string;
  description?: string;
};

export type CloudMemoryFolderPatch = {
  name?: string;
  description?: string | null;
};

export type CloudPlannedChapterRow = {
  diary_space_id: string;
  chapter_id: string;
  created_at: string;
};

export type CloudAppSettingsRow = {
  diary_space_id: string;
  data: Record<string, unknown>;
  updated_at: string;
};

// ──────────────────────────────────────────────────────────────────────────
// Input types — what the data-access layer accepts from callers. camelCase
// to match the rest of the app. Photos carry storage paths, not data URLs:
// uploads happen separately so saveCloudDailyRecord can run inside the
// save_daily_record RPC transaction.
// ──────────────────────────────────────────────────────────────────────────

export type CloudDailyRecordPhotoInput = {
  storagePath: string;
  width?: number;
  height?: number;
  bytes?: number;
  position?: number;
};

export type CloudDailyRecordInput = {
  diarySpaceId: string;
  laDate: string;
  chapterId: string;
  volumeId: string;
  title: string;
  note: string;
  memory?: string;
  husbandReflection?: string;
  wifeReflection?: string;
  location?: string;
  wantsToRepeat?: boolean;
  timeLabel?: string;
  recordedAt?: string;
  photos: CloudDailyRecordPhotoInput[];
};

export type CloudDailyRecordPatch = {
  title?: string;
  note?: string;
  memory?: string | null;
  husbandReflection?: string | null;
  wifeReflection?: string | null;
  location?: string | null;
  wantsToRepeat?: boolean;
  timeLabel?: string | null;
};

export type CloudAlbumPhotoInput = {
  diarySpaceId: string;
  storagePath: string;
  takenOn?: string;
  location?: string;
  note?: string;
  folderId?: string;
  width?: number;
  height?: number;
  bytes?: number;
};

export type CloudAlbumPhotoPatch = {
  takenOn?: string | null;
  location?: string | null;
  note?: string | null;
  folderId?: string | null;
};

export type CloudPlannedChapterInput = {
  diarySpaceId: string;
  chapterId: string;
};

// ──────────────────────────────────────────────────────────────────────────
// Mappers — convert cloud rows to the existing app-facing shapes from
// lib/local-records.ts so the UI does not need a parallel data type.
// ──────────────────────────────────────────────────────────────────────────

/**
 * Convert a cloud daily_records row + ordered signed photo URLs into the
 * existing DailyRecord shape used throughout the app.
 *
 * `photoUrls` must already be in `position` order. Caller resolves URLs via
 * lib/cloud/storage.ts.
 */
export function mapCloudDailyRecordToDailyRecord(
  record: CloudDailyRecordRow,
  photoUrls: string[],
): DailyRecord {
  return {
    date: record.la_date,
    chapterId: record.chapter_id,
    volumeId: record.volume_id,
    title: record.title,
    note: record.note,
    memory: record.memory ?? undefined,
    husbandReflection: record.husband_reflection ?? undefined,
    wifeReflection: record.wife_reflection ?? undefined,
    location: record.location ?? undefined,
    wantsToRepeat: record.wants_to_repeat,
    photos: photoUrls,
    photoRequired: true,
    timezone: LA_TIMEZONE,
    timeLabel: record.time_label ?? undefined,
    createdAt: record.created_at,
  };
}

/**
 * Convert a cloud album_photos row + a resolved signed URL into the existing
 * AlbumPhoto shape used by /memories album view.
 */
export function mapCloudAlbumPhotoToAlbumPhoto(
  row: CloudAlbumPhotoRow,
  photoUrl: string,
  folderName?: string,
): AlbumPhoto {
  return {
    id: row.id,
    photo: photoUrl,
    date: row.taken_on ?? undefined,
    location: row.location ?? undefined,
    note: row.note ?? undefined,
    folderId: row.folder_id ?? undefined,
    folderName,
    createdAt: row.created_at,
    timezone: LA_TIMEZONE,
  };
}
