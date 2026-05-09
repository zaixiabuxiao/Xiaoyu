"use client";

import { useEffect, useState } from "react";
import DiaryCard from "./DiaryCard";
import CoupleCutout from "./CoupleCutout";
import {
  getCoreImportantDate,
  IMPORTANT_DATES_EVENT,
  SEED_ENGAGED_ID,
  SEED_MET_ID,
  SEED_TOGETHER_ID,
} from "@/lib/important-dates";
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

function loadCoreEvents(): CoreEvent[] {
  return CORE_IDS.map((c) => ({
    brandLabel: c.brandLabel,
    date: getCoreImportantDate(c.id).date,
  }));
}

export default function BrandSummaryCard() {
  const [events, setEvents] = useState<CoreEvent[] | null>(null);
  const [days, setDays] = useState<number[] | null>(null);

  useEffect(() => {
    const refresh = () => {
      const next = loadCoreEvents();
      setEvents(next);
      setDays(next.map((e) => daysSinceInLosAngeles(e.date)));
    };
    refresh();
    window.addEventListener(IMPORTANT_DATES_EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(IMPORTANT_DATES_EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  const displayEvents = events ?? CORE_IDS.map((c) => ({
    brandLabel: c.brandLabel,
    date: getCoreImportantDate(c.id).date,
  }));

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
                  {days?.[i] ?? "…"}
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
