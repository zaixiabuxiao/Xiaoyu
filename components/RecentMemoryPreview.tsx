"use client";

import type { LifeChapter } from "@/lib/mock-data";
import { useLocalRecords } from "@/lib/use-local-records";
import LocalMemoryCard from "./LocalMemoryCard";
import MemoryTimelineCard from "./MemoryTimelineCard";
import PixelCard from "./PixelCard";

type Props = {
  fallback?: LifeChapter;
};

export default function RecentMemoryPreview({ fallback }: Props) {
  const { records, hydrated } = useLocalRecords();

  if (!hydrated) {
    return (
      <PixelCard>
        <p className="font-pixel text-[10px] text-navy/60">…</p>
      </PixelCard>
    );
  }

  const recent = [...records].sort((a, b) => b.date.localeCompare(a.date))[0];

  if (recent) {
    return <LocalMemoryCard record={recent} />;
  }

  if (fallback) {
    return <MemoryTimelineCard chapter={fallback} />;
  }

  return (
    <PixelCard>
      <p className="text-lg">还没有记录，慢慢来。</p>
    </PixelCard>
  );
}
