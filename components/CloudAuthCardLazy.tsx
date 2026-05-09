"use client";

import dynamic from "next/dynamic";
import DiaryCard from "./DiaryCard";

// Same lazy pattern as CloudMigrationCardLazy: keep the supabase-js auth
// surface out of /us's First Load JS until the page hydrates.
const CloudAuthCard = dynamic(() => import("./CloudAuthCard"), {
  ssr: false,
  loading: () => (
    <DiaryCard variant="soft">
      <p className="font-pixel text-[10px] text-navy/50">…</p>
    </DiaryCard>
  ),
});

export default CloudAuthCard;
