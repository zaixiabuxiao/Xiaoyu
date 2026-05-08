"use client";

import DiaryCard from "./DiaryCard";
import { chapterVolumes } from "@/lib/mock-data";
import { useLocalRecords } from "@/lib/use-local-records";

export default function ChaptersVolumeBar() {
  const { records, hydrated } = useLocalRecords();
  const v1 = chapterVolumes.find((v) => v.id === "v1") ?? chapterVolumes[0];
  const written = hydrated
    ? v1.completedCount + records.filter((r) => r.volumeId === v1.id).length
    : v1.completedCount;
  const percent = Math.min(100, Math.max(0, (written / v1.totalCount) * 100));

  return (
    <DiaryCard variant="soft">
      <div className="flex items-baseline justify-between gap-2">
        <p className="font-display text-[16px] text-navy leading-none">
          第一卷 · 二人世界
        </p>
        <p className="text-[12px] text-diary-ink-soft">
          已写下{" "}
          <span className="font-pixel text-[11px] text-diary-orange-d">
            {written}
          </span>{" "}
          /{" "}
          <span className="font-pixel text-[11px] text-navy">
            {v1.totalCount}
          </span>{" "}
          页
        </p>
      </div>
      <div className="diary-pbar mt-2">
        <span style={{ width: `${percent}%` }} />
      </div>
    </DiaryCard>
  );
}
