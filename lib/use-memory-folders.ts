"use client";

// Phase 9J: thin facade over `useDiaryData` so AlbumUploadForm,
// AlbumPhotoEditForm, and MemoryFolderView see cloud-backed folders when
// the user is signed in.

import { useDiaryData } from "./use-diary-data";

export function useMemoryFolders() {
  const data = useDiaryData();
  return {
    folders: data.folders,
    hydrated: data.hydrated,
    refresh: data.refresh,
  };
}
