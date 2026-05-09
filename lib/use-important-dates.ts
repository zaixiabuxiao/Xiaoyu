"use client";

// Phase 9K: thin facade over `useDiaryData` so 我们的日历 / important dates
// share the same cloud-first source as the rest of the app. The legacy
// shape is preserved for existing call sites; mutations are now exposed
// on the same hook.

import { useDiaryData } from "./use-diary-data";

export function useImportantDates() {
  const data = useDiaryData();
  return {
    dates: data.importantDates,
    hydrated: data.hydrated,
    source: data.source,
    refresh: data.refresh,
    addImportantDate: data.addImportantDate,
    updateImportantDate: data.updateImportantDate,
    deleteImportantDate: data.deleteImportantDate,
  };
}
