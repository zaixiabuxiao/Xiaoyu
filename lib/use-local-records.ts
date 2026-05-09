"use client";

// Phase 9J: this hook is now a thin facade over the shared `useDiaryData`
// context so /home, /chapters, /memories all see the same source — cloud
// when active, localStorage cache otherwise. The legacy 5-field shape is
// preserved so existing call sites need no change.

import { useDiaryData } from "./use-diary-data";

export function useLocalRecords() {
  const data = useDiaryData();
  return {
    records: data.records,
    planned: data.planned,
    album: data.album,
    hydrated: data.hydrated,
    refresh: data.refresh,
  };
}
