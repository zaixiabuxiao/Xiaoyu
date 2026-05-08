"use client";

import { useMemo } from "react";
import type { DailyRecord } from "@/lib/local-records";
import { formatDateForDisplay } from "@/lib/date-utils";
import { useLocalRecords } from "@/lib/use-local-records";
import DiaryCard from "./DiaryCard";
import { PixelPin } from "./PixelIcons";

export default function MemoryMapView() {
  const { records, hydrated } = useLocalRecords();

  const withLocation = useMemo(
    () =>
      records
        .filter((r) => r.location && r.location.trim().length > 0)
        .sort((a, b) => b.date.localeCompare(a.date)),
    [records],
  );

  if (!hydrated) {
    return (
      <DiaryCard variant="soft">
        <p className="font-pixel text-[10px] text-navy/50">…</p>
      </DiaryCard>
    );
  }

  if (withLocation.length === 0) {
    return (
      <DiaryCard variant="soft">
        <p className="font-display text-[16px] text-navy leading-snug">
          地图还没有被点亮。
        </p>
        <div className="dash-h my-3" />
        <p className="text-[13px] text-diary-ink-soft leading-relaxed">
          等我们写下一页带地点的日记，这里就会多一个小标记。
        </p>
      </DiaryCard>
    );
  }

  const byLocation = new Map<string, DailyRecord[]>();
  for (const r of withLocation) {
    const key = r.location ?? "";
    const arr = byLocation.get(key) ?? [];
    arr.push(r);
    byLocation.set(key, arr);
  }

  return (
    <ul className="space-y-3">
      {[...byLocation.entries()].map(([loc, rs]) => (
        <li key={loc}>
          <DiaryCard>
            <div className="flex items-baseline gap-2">
              <PixelPin size={14} />
              <h3 className="font-display text-[18px] text-navy leading-tight break-words">
                {loc}
              </h3>
              <span className="ml-auto font-pixel text-[10px] text-diary-orange-d shrink-0">
                {rs.length} 页
              </span>
            </div>
            <div className="dash-h my-3" />
            <ul className="space-y-3">
              {rs.map((r) => (
                <li key={r.date} className="flex gap-3">
                  {r.photos[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={r.photos[0]}
                      alt=""
                      className="shrink-0 w-16 h-16 object-cover border-2 border-navy bg-cream"
                      style={{ imageRendering: "auto" }}
                    />
                  ) : (
                    <span className="shrink-0 w-16 h-16 grid place-items-center border-2 border-navy/40 bg-cream">
                      <PixelPin size={20} color="#C66A2F" />
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-pixel text-[10px] text-diary-orange-d">
                      {formatDateForDisplay(r.date)}
                    </p>
                    <p className="font-display text-[14px] leading-snug text-navy mt-0.5 break-words">
                      {r.title}
                    </p>
                    {r.note ? (
                      <p className="text-[12px] text-diary-ink-soft mt-1 line-clamp-2 leading-snug">
                        {r.note}
                      </p>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          </DiaryCard>
        </li>
      ))}
    </ul>
  );
}
