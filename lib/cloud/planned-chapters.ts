// Planned chapters CRUD against Supabase.
//
// `planned_chapters` is a small join-style table with composite PK
// (diary_space_id, chapter_id). Listing returns just chapter ids in stable
// insertion order so the existing useLocalRecords hook can drop in cleanly.

import {
  ensureCloudClient,
  err,
  normalizeError,
  ok,
  type CloudResult,
} from "./errors";

type PlannedChapterRow = {
  chapter_id: string;
  created_at: string;
};

/**
 * List the chapter ids planned in this diary_space, in oldest-first order.
 */
export async function listCloudPlannedChapters(
  diarySpaceId: string,
): Promise<CloudResult<string[]>> {
  if (!diarySpaceId) return err("NOT_FOUND", "diarySpaceId is required.");

  const guard = ensureCloudClient();
  if (!guard.ok) return guard;

  try {
    const { data, error } = await guard.data
      .from("planned_chapters")
      .select("chapter_id, created_at")
      .eq("diary_space_id", diarySpaceId)
      .order("created_at", { ascending: true });
    if (error) return normalizeError(error);
    return ok(((data ?? []) as PlannedChapterRow[]).map((r) => r.chapter_id));
  } catch (cause) {
    return normalizeError(cause);
  }
}

/**
 * Idempotent insert: adds a chapter to the plan, no-ops if already present.
 */
export async function addCloudPlannedChapter(
  diarySpaceId: string,
  chapterId: string,
): Promise<CloudResult<void>> {
  if (!diarySpaceId || !chapterId) {
    return err(
      "NOT_FOUND",
      "diarySpaceId and chapterId are required.",
    );
  }

  const guard = ensureCloudClient();
  if (!guard.ok) return guard;

  try {
    const { error } = await guard.data
      .from("planned_chapters")
      .upsert(
        { diary_space_id: diarySpaceId, chapter_id: chapterId },
        { onConflict: "diary_space_id,chapter_id", ignoreDuplicates: true },
      );
    if (error) return normalizeError(error);
    return ok(undefined);
  } catch (cause) {
    return normalizeError(cause);
  }
}

/**
 * Remove a chapter from the plan. No-op if absent.
 */
export async function removeCloudPlannedChapter(
  diarySpaceId: string,
  chapterId: string,
): Promise<CloudResult<void>> {
  if (!diarySpaceId || !chapterId) {
    return err(
      "NOT_FOUND",
      "diarySpaceId and chapterId are required.",
    );
  }

  const guard = ensureCloudClient();
  if (!guard.ok) return guard;

  try {
    const { error } = await guard.data
      .from("planned_chapters")
      .delete()
      .eq("diary_space_id", diarySpaceId)
      .eq("chapter_id", chapterId);
    if (error) return normalizeError(error);
    return ok(undefined);
  } catch (cause) {
    return normalizeError(cause);
  }
}
