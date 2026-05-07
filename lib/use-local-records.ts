"use client";

import { useCallback, useEffect, useState } from "react";
import {
  getDailyRecords,
  getPlannedChapters,
  STORAGE_EVENTS,
  type DailyRecord,
} from "./local-records";

export function useLocalRecords() {
  const [records, setRecords] = useState<DailyRecord[]>([]);
  const [planned, setPlanned] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);

  const refresh = useCallback(() => {
    setRecords(getDailyRecords());
    setPlanned(getPlannedChapters());
  }, []);

  useEffect(() => {
    refresh();
    setHydrated(true);
    const handler = () => refresh();
    window.addEventListener(STORAGE_EVENTS.records, handler);
    window.addEventListener(STORAGE_EVENTS.planned, handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener(STORAGE_EVENTS.records, handler);
      window.removeEventListener(STORAGE_EVENTS.planned, handler);
      window.removeEventListener("storage", handler);
    };
  }, [refresh]);

  return { records, planned, hydrated, refresh };
}
