// Single dynamic-import barrel for the cloud helpers.
//
// Phase 9J: `useDiaryData` keeps `@supabase/supabase-js` out of the main
// bundle by `await import("./cloud/bridge")` instead of statically pulling
// each helper at the top of the file. All consumers go through this barrel
// so the `supabase-js` code lands in exactly one async chunk.

export {
  saveCloudDailyRecord,
  updateCloudDailyRecord,
  deleteCloudDailyRecord,
  listCloudDailyRecords,
} from "./daily-records";

export {
  saveCloudAlbumPhoto,
  updateCloudAlbumPhoto,
  deleteCloudAlbumPhoto,
  listCloudAlbumPhotos,
} from "./album-photos";

export {
  addCloudPlannedChapter,
  removeCloudPlannedChapter,
  listCloudPlannedChapters,
} from "./planned-chapters";

export {
  createCloudMemoryFolder,
  updateCloudMemoryFolder,
  deleteCloudMemoryFolder,
  getOrCreateCloudMemoryFolder,
  listCloudMemoryFolders,
} from "./memory-folders";

export {
  ALBUM_PHOTOS_BUCKET,
  DAILY_PHOTOS_BUCKET,
  deletePhoto,
  getSignedPhotoUrl,
  uploadAlbumPhoto,
  uploadDailyPhoto,
} from "./storage";

export { getCloudDiarySpace } from "./diary-space";

export {
  loadCloudImportantDates,
  saveCloudImportantDates,
} from "./important-dates";

export {
  getCurrentCloudSession,
  signInCloud,
  signOutCloud,
  subscribeCloudAuthChanges,
} from "./auth";

export { loadCloudSnapshot } from "./load";

export { getSupabaseClient } from "../supabase-client";
