"use client";

import { useCallback, useEffect, useState } from "react";
import {
  IMPORTANT_DATES_EVENT,
  getImportantDates,
  type ImportantDate,
} from "./important-dates";

export function useImportantDates() {
  const [dates, setDates] = useState<ImportantDate[]>([]);
  const [hydrated, setHydrated] = useState(false);

  const refresh = useCallback(() => {
    setDates(getImportantDates());
  }, []);

  useEffect(() => {
    refresh();
    setHydrated(true);
    const handler = () => refresh();
    window.addEventListener(IMPORTANT_DATES_EVENT, handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener(IMPORTANT_DATES_EVENT, handler);
      window.removeEventListener("storage", handler);
    };
  }, [refresh]);

  return { dates, hydrated, refresh };
}
