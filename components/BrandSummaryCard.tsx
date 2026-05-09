"use client";

import { useMemo } from "react";
import DiaryCard from "./DiaryCard";
import CoupleCutout from "./CoupleCutout";
import {
  SEED_ENGAGED_ID,
  SEED_MET_ID,
  SEED_TOGETHER_ID,
  getSeedImportantDates,
} from "@/lib/important-dates";
import { useDiaryData } from "@/lib/use-diary-data";
import {
  daysSinceInLosAngeles,
  formatDateForDisplay,
} from "@/lib/date-utils";

const CORE_IDS = [
  { id: SEED_MET_ID, brandLabel: "相识" },
  { id: SEED_TOGETHER_ID, brandLabel: "在一起" },
  { id: SEED_ENGAGED_ID, brandLabel: "订婚" },
] as const;

type CoreEvent = { brandLabel: string; date: string };

export default function BrandSummaryCard() {
  const data = useDiaryData();

  const displayEvents: CoreEvent[] = useMemo(() => {
    const seeds = getSeedImportantDates();
    return CORE_IDS.map((c) => {
      const found = data.importantDates.find((d) => d.id === c.id);
      const fallback = seeds.find((d) => d.id === c.id)!;
      return {
        brandLabel: c.brandLabel,
        date: (found ?? fallback).date,
      };
    });
  }, [data.importantDates]);

  const days = useMemo(
    () => displayEvents.map((e) => daysSinceInLosAngeles(e.date)),
    [displayEvents],
  );

  return (
    <DiaryCard className="overflow-hidden">
      <div
        className="grid items-stretch gap-2"
        style={{ gridTemplateColumns: "1fr 76px", minHeight: 110 }}
      >
        <div className="min-w-0 self-center">
          <p className="font-display text-[20px] leading-none tracking-wide text-navy whitespace-nowrap">
            小羽 <span className="text-diary-orange-d">&amp;</span> 扬扬
          </p>
          <div className="dash-h my-1.5" />
          <ul className="space-y-[2px]">
            {displayEvents.map((e, i) => (
              <li
                key={e.brandLabel}
                className="flex items-baseline gap-1 whitespace-nowrap"
              >
                <span className="font-display text-[13px] text-navy">
                  {e.brandLabel}于
                </span>
                <span className="font-pixel text-[10px] text-diary-orange-d">
                  {formatDateForDisplay(e.date)}
                </span>
                <span className="font-display text-[12px] text-diary-ink-soft">
                  · 第
                </span>
                <span className="font-pixel text-[10px] text-diary-orange-d">
                  {data.hydrated ? days[i] : "…"}
                </span>
                <span className="font-display text-[12px] text-diary-ink-soft">
                  天
                </span>
              </li>
            ))}
          </ul>
          <p className="text-[11.5px] text-diary-ink-soft mt-2 whitespace-nowrap">
            今天按洛杉矶时间记录。
          </p>
        </div>
        <CoupleCutout height={108} className="self-end" />
      </div>

      <p className="diary-quote-box mt-3 text-[15px]">
        让平凡的日子，
        <br />
        也长出被记住的羽毛。
      </p>
    </DiaryCard>
  );
}
