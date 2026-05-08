"use client";

import dynamic from "next/dynamic";
import DiaryCard from "./DiaryCard";

// Loading the real card pulls in @supabase/supabase-js, which is ~60 kB on
// its own. Until Phase 9F switches the rest of the app to the cloud, we
// don't want every /us visit to ship that library, so split it into a
// separate chunk that only loads after /us hydrates in the browser.
const CloudMigrationCard = dynamic(() => import("./CloudMigrationCard"), {
  ssr: false,
  loading: () => (
    <DiaryCard variant="soft">
      <p className="font-pixel text-[10px] text-navy/50">…</p>
    </DiaryCard>
  ),
});

export default CloudMigrationCard;
