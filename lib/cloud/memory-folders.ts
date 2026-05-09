// Memory folders CRUD against Supabase (Phase 9H).
//
// Folders are the unit of the unified 地图相册 view. The default folder
// "没有地点的照片" is seeded by migration 003 for every diary_space and the
// application treats a null folder_id on album_photos as that default.
//
// Like every other lib/cloud/* helper this module returns CloudResult<T> so
// the UI can branch on `result.ok` without try/catch.

import {
  ensureCloudClient,
  err,
  normalizeError,
  ok,
  type CloudResult,
} from "./errors";
import type {
  CloudMemoryFolderInput,
  CloudMemoryFolderPatch,
  CloudMemoryFolderRow,
} from "./types";

const FOLDER_FIELDS =
  "id, diary_space_id, name, description, created_at, updated_at";

export async function listCloudMemoryFolders(
  diarySpaceId: string,
): Promise<CloudResult<CloudMemoryFolderRow[]>> {
  if (!diarySpaceId) return err("NOT_FOUND", "diarySpaceId is required.");

  const guard = ensureCloudClient();
  if (!guard.ok) return guard;

  try {
    const { data, error } = await guard.data
      .from("memory_folders")
      .select(FOLDER_FIELDS)
      .eq("diary_space_id", diarySpaceId)
      .order("name", { ascending: true });
    if (error) return normalizeError(error);
    return ok((data ?? []) as CloudMemoryFolderRow[]);
  } catch (cause) {
    return normalizeError(cause);
  }
}

export async function createCloudMemoryFolder(
  input: CloudMemoryFolderInput,
): Promise<CloudResult<CloudMemoryFolderRow>> {
  if (!input.diarySpaceId)
    return err("NOT_FOUND", "diarySpaceId is required.");
  const trimmedName = input.name.trim();
  if (!trimmedName)
    return err("UNKNOWN", "文件夹名称不能为空。");

  const guard = ensureCloudClient();
  if (!guard.ok) return guard;

  const row: Record<string, unknown> = {
    diary_space_id: input.diarySpaceId,
    name: trimmedName,
    description: input.description?.trim() || null,
  };

  try {
    const { data, error } = await guard.data
      .from("memory_folders")
      .insert(row)
      .select(FOLDER_FIELDS)
      .single();
    if (error) return normalizeError(error);
    return ok(data as CloudMemoryFolderRow);
  } catch (cause) {
    return normalizeError(cause);
  }
}

export async function updateCloudMemoryFolder(
  folderId: string,
  patch: CloudMemoryFolderPatch,
): Promise<CloudResult<CloudMemoryFolderRow>> {
  if (!folderId) return err("NOT_FOUND", "folderId is required.");

  const guard = ensureCloudClient();
  if (!guard.ok) return guard;

  const update: Record<string, unknown> = {};
  if (patch.name !== undefined) {
    const trimmed = patch.name.trim();
    if (!trimmed) return err("UNKNOWN", "文件夹名称不能为空。");
    update.name = trimmed;
  }
  if (patch.description !== undefined) {
    if (patch.description === null) {
      update.description = null;
    } else {
      const trimmed = patch.description.trim();
      update.description = trimmed.length > 0 ? trimmed : null;
    }
  }

  try {
    const { data, error } = await guard.data
      .from("memory_folders")
      .update(update)
      .eq("id", folderId)
      .select(FOLDER_FIELDS)
      .single();
    if (error) return normalizeError(error);
    return ok(data as CloudMemoryFolderRow);
  } catch (cause) {
    return normalizeError(cause);
  }
}

export async function deleteCloudMemoryFolder(
  folderId: string,
): Promise<CloudResult<void>> {
  if (!folderId) return err("NOT_FOUND", "folderId is required.");

  const guard = ensureCloudClient();
  if (!guard.ok) return guard;

  try {
    const { error } = await guard.data
      .from("memory_folders")
      .delete()
      .eq("id", folderId);
    if (error) return normalizeError(error);
    return ok(undefined);
  } catch (cause) {
    return normalizeError(cause);
  }
}

/**
 * Look up an existing folder by (diary_space_id, name) or create one. Used
 * by the album migration so each local photo's location/folderName lands in
 * a real cloud folder. Idempotent: re-running with the same name returns the
 * existing row.
 */
export async function getOrCreateCloudMemoryFolder(
  diarySpaceId: string,
  name: string,
): Promise<CloudResult<CloudMemoryFolderRow>> {
  if (!diarySpaceId) return err("NOT_FOUND", "diarySpaceId is required.");
  const trimmed = name.trim();
  if (!trimmed) return err("UNKNOWN", "文件夹名称不能为空。");

  const guard = ensureCloudClient();
  if (!guard.ok) return guard;

  try {
    const { data: existing, error: selectError } = await guard.data
      .from("memory_folders")
      .select(FOLDER_FIELDS)
      .eq("diary_space_id", diarySpaceId)
      .eq("name", trimmed)
      .maybeSingle();
    if (selectError) return normalizeError(selectError);
    if (existing) return ok(existing as CloudMemoryFolderRow);
  } catch (cause) {
    return normalizeError(cause);
  }

  return createCloudMemoryFolder({ diarySpaceId, name: trimmed });
}
