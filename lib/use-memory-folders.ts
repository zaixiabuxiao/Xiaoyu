"use client";

import { useCallback, useEffect, useState } from "react";
import {
  MEMORY_FOLDERS_EVENT,
  getMemoryFolders,
  type MemoryFolder,
} from "./memory-folders";

export function useMemoryFolders() {
  const [folders, setFolders] = useState<MemoryFolder[]>([]);
  const [hydrated, setHydrated] = useState(false);

  const refresh = useCallback(() => {
    setFolders(getMemoryFolders());
  }, []);

  useEffect(() => {
    refresh();
    setHydrated(true);
    const handler = () => refresh();
    window.addEventListener(MEMORY_FOLDERS_EVENT, handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener(MEMORY_FOLDERS_EVENT, handler);
      window.removeEventListener("storage", handler);
    };
  }, [refresh]);

  return { folders, hydrated, refresh };
}
