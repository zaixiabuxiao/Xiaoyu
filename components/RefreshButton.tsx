"use client";

// Phase 9L: in-app refresh button. Calls `useDiaryData().refresh()` so the
// snapshot is re-fetched from Supabase without reloading the browser and
// without re-rendering PasscodeGate (i.e. the user does NOT need to retype
// 0515).
//
// Sits at the bottom-right safe area, stacked above MusicPlayer so neither
// covers the bottom nav.

import { useState } from "react";
import { useDiaryData } from "@/lib/use-diary-data";

type Status =
  | { kind: "idle" }
  | { kind: "syncing" }
  | { kind: "ok" }
  | { kind: "fail"; copy: string };

export default function RefreshButton() {
  const data = useDiaryData();
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  if (!data.hydrated) return null;

  async function handleClick() {
    if (status.kind === "syncing") return;
    setStatus({ kind: "syncing" });
    try {
      await data.refresh();
    } catch {
      // Defensive — refresh() shouldn't throw, but treat any throw as failure.
    }
    if (!data.cloudActive) {
      setStatus({
        kind: "fail",
        copy: data.signedIn
          ? "云端暂时没有连上，这台设备先显示本地记录。"
          : "还没有连接云端身份。",
      });
      window.setTimeout(() => setStatus({ kind: "idle" }), 3000);
      return;
    }
    if (data.source === "cache") {
      setStatus({
        kind: "fail",
        copy: "云端暂时没有连上，这台设备先显示本地记录。",
      });
      window.setTimeout(() => setStatus({ kind: "idle" }), 3000);
      return;
    }
    setStatus({ kind: "ok" });
    window.setTimeout(() => setStatus({ kind: "idle" }), 1500);
  }

  return (
    <div
      className="fixed right-3 z-40"
      style={{ bottom: "calc(8.5rem + env(safe-area-inset-bottom))" }}
    >
      <button
        type="button"
        onClick={handleClick}
        aria-label="刷新同步"
        className="bg-cream border-2 border-navy rounded-full px-3 py-1 shadow font-pixel text-[10px] text-navy disabled:opacity-50"
        disabled={status.kind === "syncing"}
      >
        {status.kind === "syncing"
          ? "正在同步…"
          : status.kind === "ok"
            ? "已同步"
            : status.kind === "fail"
              ? "同步未完成"
              : "♻ 同步"}
      </button>
      {status.kind === "fail" ? (
        <p className="mt-1 max-w-[200px] bg-cream border-2 border-navy rounded-md px-2 py-1 font-pixel text-[10px] text-warm-orange leading-relaxed text-right">
          {status.copy}
        </p>
      ) : null}
    </div>
  );
}
