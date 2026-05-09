"use client";

// Manual migration of THIS browser's localStorage diary data into the
// shared Supabase cloud space.
//
// The eventual single source of truth is Supabase. Devices are only the
// doors that open it. This phase only *uploads* — the app still reads
// localStorage, localStorage is never deleted, and migration runs only
// when the user taps the manual button under /us.

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  getAlbumPhotos,
  getDailyRecords,
  getPlannedChapters,
  type AlbumPhoto,
  type DailyRecord,
} from "../local-records";
import {
  ensureCloudClient,
  err,
  normalizeError,
  ok,
  type CloudErrorCode,
  type CloudResult,
} from "./errors";
import { getCloudDiarySpace } from "./diary-space";
import { saveCloudDailyRecord } from "./daily-records";
import { addCloudPlannedChapter } from "./planned-chapters";
import { getOrCreateCloudMemoryFolder } from "./memory-folders";
import { DEFAULT_FOLDER_NAME } from "../memory-folders";
import {
  ALBUM_PHOTOS_BUCKET,
  DAILY_PHOTOS_BUCKET,
} from "./storage";

// ──────────────────────────────────────────────────────────────────────────
// Public types
// ──────────────────────────────────────────────────────────────────────────

export type LocalMigrationSummary = {
  dailyRecordsLocal: number;
  dailyRecordsWithPhotos: number;
  dailyRecordsWithoutPhotos: number;
  albumPhotosLocal: number;
  plannedChaptersLocal: number;
};

export type MigrationErrorEntry = {
  type: CloudErrorCode | "UNKNOWN";
  message: string;
  localId?: string;
  cause?: unknown;
};

export type MigrationCounts = {
  dailyRecordsTotal: number;
  dailyRecordsMigrated: number;
  albumPhotosTotal: number;
  albumPhotosMigrated: number;
  plannedChaptersTotal: number;
  plannedChaptersMigrated: number;
  skipped: number;
  failed: number;
};

export type MigrationResult = {
  ok: boolean;
  summary: MigrationCounts;
  errors: MigrationErrorEntry[];
};

// ──────────────────────────────────────────────────────────────────────────
// Local-side summary — read localStorage only; never touches the network.
// ──────────────────────────────────────────────────────────────────────────

export function getLocalMigrationSummary(): LocalMigrationSummary {
  if (typeof window === "undefined") {
    return {
      dailyRecordsLocal: 0,
      dailyRecordsWithPhotos: 0,
      dailyRecordsWithoutPhotos: 0,
      albumPhotosLocal: 0,
      plannedChaptersLocal: 0,
    };
  }
  const records = getDailyRecords();
  const album = getAlbumPhotos();
  const planned = getPlannedChapters();
  const withPhotos = records.filter((r) => r.photos.length > 0).length;
  return {
    dailyRecordsLocal: records.length,
    dailyRecordsWithPhotos: withPhotos,
    dailyRecordsWithoutPhotos: records.length - withPhotos,
    albumPhotosLocal: album.length,
    plannedChaptersLocal: planned.length,
  };
}

// ──────────────────────────────────────────────────────────────────────────
// Internal helpers
// ──────────────────────────────────────────────────────────────────────────

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isUuidish(value: string): boolean {
  return UUID_RE.test(value);
}

function freshUuid(): string {
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

async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  if (!dataUrl.startsWith("data:")) {
    throw new Error("photo is not a data URL");
  }
  const res = await fetch(dataUrl);
  return await res.blob();
}

function emptyCounts(): MigrationCounts {
  return {
    dailyRecordsTotal: 0,
    dailyRecordsMigrated: 0,
    albumPhotosTotal: 0,
    albumPhotosMigrated: 0,
    plannedChaptersTotal: 0,
    plannedChaptersMigrated: 0,
    skipped: 0,
    failed: 0,
  };
}

function recordError(
  errors: MigrationErrorEntry[],
  type: MigrationErrorEntry["type"],
  message: string,
  localId?: string,
  cause?: unknown,
) {
  errors.push({ type, message, localId, cause });
}

type MigrationContext = {
  client: SupabaseClient;
  diarySpaceId: string;
};

async function ensureMigrationContext(): Promise<
  CloudResult<MigrationContext>
> {
  const guard = ensureCloudClient();
  if (!guard.ok) return guard;

  const space = await getCloudDiarySpace();
  if (!space.ok) return space;
  if (!space.data) {
    return err("NOT_FOUND", "找不到云端日记空间。");
  }
  return ok({ client: guard.data, diarySpaceId: space.data.id });
}

// ──────────────────────────────────────────────────────────────────────────
// DailyRecords migration
// ──────────────────────────────────────────────────────────────────────────

export async function migrateDailyRecordsToCloud(
  context?: MigrationContext,
): Promise<MigrationResult> {
  const summary = emptyCounts();
  const errors: MigrationErrorEntry[] = [];

  let ctx = context;
  if (!ctx) {
    const ready = await ensureMigrationContext();
    if (!ready.ok) {
      recordError(errors, ready.code, ready.message);
      return { ok: false, summary, errors };
    }
    ctx = ready.data;
  }

  const records = getDailyRecords();
  summary.dailyRecordsTotal = records.length;

  // Pre-fetch existing la_dates so we can skip without uploading photos.
  const existingDates = new Set<string>();
  try {
    const { data, error } = await ctx.client
      .from("daily_records")
      .select("la_date")
      .eq("diary_space_id", ctx.diarySpaceId);
    if (error) {
      const norm = normalizeError(error);
      if (!norm.ok) recordError(errors, norm.code, norm.message);
      return { ok: false, summary, errors };
    }
    for (const row of (data ?? []) as Array<{ la_date: string }>) {
      existingDates.add(row.la_date);
    }
  } catch (cause) {
    const norm = normalizeError(cause);
    if (!norm.ok) recordError(errors, norm.code, norm.message, undefined, cause);
    return { ok: false, summary, errors };
  }

  for (const record of records) {
    const localId = record.date;

    if (record.photos.length === 0) {
      recordError(
        errors,
        "PHOTO_REQUIRED",
        `${localId}：这一页缺少照片，暂时不能迁移到云端。`,
        localId,
      );
      summary.skipped++;
      continue;
    }

    if (existingDates.has(record.date)) {
      summary.skipped++;
      continue;
    }

    const uploaded = await uploadDailyRecordPhotosForMigration(
      ctx,
      record,
      errors,
    );
    if (!uploaded) {
      summary.failed++;
      continue;
    }

    const saveResult = await saveCloudDailyRecord({
      diarySpaceId: ctx.diarySpaceId,
      laDate: record.date,
      chapterId: record.chapterId,
      volumeId: record.volumeId,
      title: record.title,
      note: record.note,
      memory: record.memory,
      husbandReflection: record.husbandReflection,
      wifeReflection: record.wifeReflection,
      location: record.location,
      wantsToRepeat: record.wantsToRepeat,
      timeLabel: record.timeLabel,
      recordedAt: record.createdAt,
      photos: uploaded.map((u) => ({
        storagePath: u.storagePath,
        position: u.position,
      })),
    });

    if (saveResult.ok) {
      summary.dailyRecordsMigrated++;
      existingDates.add(record.date);
      continue;
    }

    if (saveResult.code === "DAILY_RECORD_EXISTS") {
      summary.skipped++;
      existingDates.add(record.date);
      continue;
    }

    recordError(
      errors,
      saveResult.code,
      `${localId}：${saveResult.message}`,
      localId,
      saveResult.cause,
    );
    summary.failed++;
  }

  return {
    ok: summary.failed === 0,
    summary,
    errors,
  };
}

async function uploadDailyRecordPhotosForMigration(
  ctx: MigrationContext,
  record: DailyRecord,
  errors: MigrationErrorEntry[],
): Promise<Array<{ storagePath: string; position: number }> | null> {
  const result: Array<{ storagePath: string; position: number }> = [];
  for (let i = 0; i < record.photos.length; i++) {
    const photo = record.photos[i];
    const filename = `${i}-${freshUuid()}.jpg`;
    // Migration-only path layout: {diary_space_id}/migrated/{la_date}/...
    // RLS only requires the leading {diary_space_id}/ segment. Subsequent
    // diary writes (post-9F) use the canonical
    // {diary_space_id}/{daily_record_id}/{position}-{uuid}.jpg layout.
    const storagePath = `${ctx.diarySpaceId}/migrated/${record.date}/${filename}`;

    let blob: Blob;
    try {
      blob = await dataUrlToBlob(photo);
    } catch (cause) {
      recordError(
        errors,
        "UNKNOWN",
        `${record.date}：这张照片读不进来。`,
        record.date,
        cause,
      );
      return null;
    }

    try {
      const { error: uploadError } = await ctx.client.storage
        .from(DAILY_PHOTOS_BUCKET)
        .upload(storagePath, blob, {
          contentType: "image/jpeg",
          upsert: true,
        });
      if (uploadError) {
        const norm = normalizeError(uploadError);
        recordError(
          errors,
          norm.ok ? "UNKNOWN" : norm.code,
          `${record.date}：照片上传失败。`,
          record.date,
          uploadError,
        );
        return null;
      }
    } catch (cause) {
      const norm = normalizeError(cause);
      recordError(
        errors,
        norm.ok ? "UNKNOWN" : norm.code,
        `${record.date}：照片上传失败。`,
        record.date,
        cause,
      );
      return null;
    }
    result.push({ storagePath, position: i });
  }
  return result;
}

// ──────────────────────────────────────────────────────────────────────────
// AlbumPhotos migration
// ──────────────────────────────────────────────────────────────────────────

export async function migrateAlbumPhotosToCloud(
  context?: MigrationContext,
): Promise<MigrationResult> {
  const summary = emptyCounts();
  const errors: MigrationErrorEntry[] = [];

  let ctx = context;
  if (!ctx) {
    const ready = await ensureMigrationContext();
    if (!ready.ok) {
      recordError(errors, ready.code, ready.message);
      return { ok: false, summary, errors };
    }
    ctx = ready.data;
  }

  const photos = getAlbumPhotos();
  summary.albumPhotosTotal = photos.length;

  // Pre-fetch existing cloud album_photos.id values so we can skip
  // already-migrated rows when the local id is a UUID.
  const existingIds = new Set<string>();
  try {
    const { data, error } = await ctx.client
      .from("album_photos")
      .select("id")
      .eq("diary_space_id", ctx.diarySpaceId);
    if (error) {
      const norm = normalizeError(error);
      if (!norm.ok) recordError(errors, norm.code, norm.message);
      return { ok: false, summary, errors };
    }
    for (const row of (data ?? []) as Array<{ id: string }>) {
      existingIds.add(row.id);
    }
  } catch (cause) {
    const norm = normalizeError(cause);
    if (!norm.ok) recordError(errors, norm.code, norm.message, undefined, cause);
    return { ok: false, summary, errors };
  }

  for (const photo of photos) {
    const result = await migrateOneAlbumPhoto(
      ctx,
      photo,
      existingIds,
      errors,
    );
    if (result === "migrated") summary.albumPhotosMigrated++;
    else if (result === "skipped") summary.skipped++;
    else summary.failed++;
  }

  return {
    ok: summary.failed === 0,
    summary,
    errors,
  };
}

async function migrateOneAlbumPhoto(
  ctx: MigrationContext,
  photo: AlbumPhoto,
  existingIds: Set<string>,
  errors: MigrationErrorEntry[],
): Promise<"migrated" | "skipped" | "failed"> {
  // Idempotency: when the local id is already a UUID we use it directly,
  // so a retried run hits the same primary key and is skipped via
  // existingIds. Local ids generated by the timestamp-fallback path are
  // not UUIDs — those rows get a fresh cloud UUID and may produce a
  // duplicate row on retry. See lib/cloud/README.md "Album-photo
  // idempotency limit".
  const localIsUuid = isUuidish(photo.id);
  const cloudId = localIsUuid ? photo.id : freshUuid();

  if (localIsUuid && existingIds.has(cloudId)) {
    return "skipped";
  }

  // Phase 9H: resolve the cloud folder for this photo before uploading.
  // Precedence: explicit folderName > legacy location > default folder.
  // Failure to resolve the folder is non-fatal — we fall back to null
  // folder_id and rely on the application treating null as the default.
  let folderId: string | null = null;
  const folderName =
    photo.folderName?.trim() ||
    photo.location?.trim() ||
    DEFAULT_FOLDER_NAME;
  const folderResult = await getOrCreateCloudMemoryFolder(
    ctx.diarySpaceId,
    folderName,
  );
  if (folderResult.ok) {
    folderId = folderResult.data.id;
  } else {
    recordError(
      errors,
      folderResult.code,
      `相册照片文件夹「${folderName}」处理失败，照片仍会上传但暂无文件夹。`,
      photo.id,
      folderResult.cause,
    );
  }

  const storagePath = `${ctx.diarySpaceId}/${cloudId}.jpg`;

  let blob: Blob;
  try {
    blob = await dataUrlToBlob(photo.photo);
  } catch (cause) {
    recordError(
      errors,
      "UNKNOWN",
      "这张相册照片读不进来。",
      photo.id,
      cause,
    );
    return "failed";
  }

  try {
    const { error: uploadError } = await ctx.client.storage
      .from(ALBUM_PHOTOS_BUCKET)
      .upload(storagePath, blob, {
        contentType: "image/jpeg",
        upsert: true,
      });
    if (uploadError) {
      const norm = normalizeError(uploadError);
      recordError(
        errors,
        norm.ok ? "UNKNOWN" : norm.code,
        "相册照片上传失败。",
        photo.id,
        uploadError,
      );
      return "failed";
    }
  } catch (cause) {
    const norm = normalizeError(cause);
    recordError(
      errors,
      norm.ok ? "UNKNOWN" : norm.code,
      "相册照片上传失败。",
      photo.id,
      cause,
    );
    return "failed";
  }

  try {
    const { error: insertError } = await ctx.client
      .from("album_photos")
      .upsert(
        {
          id: cloudId,
          diary_space_id: ctx.diarySpaceId,
          storage_path: storagePath,
          taken_on: photo.date ?? null,
          location: photo.location ?? null,
          note: photo.note ?? null,
          folder_id: folderId,
          created_at: photo.createdAt,
        },
        { onConflict: "id", ignoreDuplicates: true },
      );
    if (insertError) {
      const norm = normalizeError(insertError);
      recordError(
        errors,
        norm.ok ? "UNKNOWN" : norm.code,
        "相册照片记录写入失败。",
        photo.id,
        insertError,
      );
      return "failed";
    }
  } catch (cause) {
    const norm = normalizeError(cause);
    recordError(
      errors,
      norm.ok ? "UNKNOWN" : norm.code,
      "相册照片记录写入失败。",
      photo.id,
      cause,
    );
    return "failed";
  }

  existingIds.add(cloudId);
  return "migrated";
}

// ──────────────────────────────────────────────────────────────────────────
// PlannedChapters migration
// ──────────────────────────────────────────────────────────────────────────

export async function migratePlannedChaptersToCloud(
  context?: MigrationContext,
): Promise<MigrationResult> {
  const summary = emptyCounts();
  const errors: MigrationErrorEntry[] = [];

  let ctx = context;
  if (!ctx) {
    const ready = await ensureMigrationContext();
    if (!ready.ok) {
      recordError(errors, ready.code, ready.message);
      return { ok: false, summary, errors };
    }
    ctx = ready.data;
  }

  const planned = getPlannedChapters();
  summary.plannedChaptersTotal = planned.length;

  for (const chapterId of planned) {
    const result = await addCloudPlannedChapter(ctx.diarySpaceId, chapterId);
    if (result.ok) {
      summary.plannedChaptersMigrated++;
    } else {
      recordError(
        errors,
        result.code,
        `${chapterId}：${result.message}`,
        chapterId,
        result.cause,
      );
      summary.failed++;
    }
  }

  return {
    ok: summary.failed === 0,
    summary,
    errors,
  };
}

// ──────────────────────────────────────────────────────────────────────────
// Orchestrator: run all three migrations sequentially, share the context.
// ──────────────────────────────────────────────────────────────────────────

export type MigrationOptions = {
  // intentionally empty for now; reserved for future flags like dryRun
};

export async function migrateLocalDataToCloud(
  _options?: MigrationOptions,
): Promise<MigrationResult> {
  const summary = emptyCounts();
  const errors: MigrationErrorEntry[] = [];

  const ready = await ensureMigrationContext();
  if (!ready.ok) {
    recordError(errors, ready.code, ready.message);
    return { ok: false, summary, errors };
  }
  const ctx = ready.data;

  const dr = await migrateDailyRecordsToCloud(ctx);
  summary.dailyRecordsTotal = dr.summary.dailyRecordsTotal;
  summary.dailyRecordsMigrated = dr.summary.dailyRecordsMigrated;
  summary.skipped += dr.summary.skipped;
  summary.failed += dr.summary.failed;
  errors.push(...dr.errors);

  const ap = await migrateAlbumPhotosToCloud(ctx);
  summary.albumPhotosTotal = ap.summary.albumPhotosTotal;
  summary.albumPhotosMigrated = ap.summary.albumPhotosMigrated;
  summary.skipped += ap.summary.skipped;
  summary.failed += ap.summary.failed;
  errors.push(...ap.errors);

  const pc = await migratePlannedChaptersToCloud(ctx);
  summary.plannedChaptersTotal = pc.summary.plannedChaptersTotal;
  summary.plannedChaptersMigrated = pc.summary.plannedChaptersMigrated;
  summary.failed += pc.summary.failed;
  errors.push(...pc.errors);

  return {
    ok: summary.failed === 0,
    summary,
    errors,
  };
}
