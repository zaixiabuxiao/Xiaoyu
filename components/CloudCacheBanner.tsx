"use client";

// Phase 9J: gentle banner reminding the user this device is reading from
// localStorage cache because the cloud is configured but no Supabase session
// exists. Stays out of the way when cloud is fully active or fully disabled.

import { useDiaryData } from "@/lib/use-diary-data";

export default function CloudCacheBanner() {
  const data = useDiaryData();

  if (!data.hydrated) return null;
  // Show only when cloud is configured (so we have a session to fall back
  // FROM) but currently inactive — i.e. signed out, or cloud fetch failed.
  const showSignedOutCopy =
    !data.cloudActive && data.source === "local" && !data.signedIn;
  const showCacheCopy = data.source === "cache";

  if (!showSignedOutCopy && !showCacheCopy) return null;

  return (
    <p className="font-pixel text-[10px] text-navy/55 leading-relaxed bg-diary-cream-2 border-2 border-navy/20 px-3 py-2">
      {showCacheCopy
        ? "云端暂时没有连上，这台设备先显示本地记录。"
        : "还没有连接云端身份。这台设备会先使用本地记录。"}
    </p>
  );
}
