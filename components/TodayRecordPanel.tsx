"use client";

import { getTodayString } from "@/lib/local-records";
import { useLocalRecords } from "@/lib/use-local-records";
import DiaryCard from "./DiaryCard";

export default function TodayRecordPanel() {
  const { records, hydrated } = useLocalRecords();
  const today = getTodayString();
  const todayRecord = records.find((r) => r.date === today);

  return (
    <div className="relative pt-[26px]">
      <div className="absolute -top-[1px] left-1/2 -translate-x-1/2 z-10">
        <span className="diary-banner-tab">今天这一页</span>
      </div>

      <DiaryCard>
        <div className="flex items-center justify-center text-center px-2 py-3 min-h-[64px]">
          {!hydrated ? (
            <p className="font-pixel text-[10px] text-navy/50">…</p>
          ) : todayRecord ? (
            <div className="leading-relaxed">
              <p className="font-display text-[17px] text-navy">
                今天这一页，已经写好了。
              </p>
              <p className="text-[13.5px] text-diary-ink-soft mt-1">
                今天已经有一件被认真记住了。
              </p>
            </div>
          ) : (
            <p className="text-[13.5px] text-diary-ink-soft leading-relaxed">
              不急，我们只认真写下一件就好。
            </p>
          )}
        </div>
      </DiaryCard>
    </div>
  );
}
