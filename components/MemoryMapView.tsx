"use client";

import { useMemo } from "react";
import type { AlbumPhoto, DailyRecord } from "@/lib/local-records";
import { formatDateForDisplay } from "@/lib/date-utils";
import { useLocalRecords } from "@/lib/use-local-records";
import DiaryCard from "./DiaryCard";
import { PixelPin } from "./PixelIcons";

type MapItem = {
  source: "daily" | "album";
  id: string;
  photo?: string;
  sortDate: string;
  displayDate?: string;
  title?: string;
  note?: string;
  location: string;
};

function buildItems(
  records: DailyRecord[],
  album: AlbumPhoto[],
): MapItem[] {
  const dailyItems: MapItem[] = records
    .filter((r) => r.location && r.location.trim().length > 0)
    .map((r) => ({
      source: "daily",
      id: `daily-${r.date}`,
      photo: r.photos[0],
      sortDate: r.date,
      displayDate: formatDateForDisplay(r.date),
      title: r.title,
      note: r.note,
      location: r.location!,
    }));
  const albumItems: MapItem[] = album
    .filter((p) => p.location && p.location.trim().length > 0)
    .map((p) => ({
      source: "album",
      id: p.id,
      photo: p.photo,
      sortDate: p.date ?? p.createdAt.slice(0, 10),
      displayDate: p.date ? formatDateForDisplay(p.date) : undefined,
      note: p.note,
      location: p.location!,
    }));
  return [...dailyItems, ...albumItems].sort((a, b) =>
    b.sortDate.localeCompare(a.sortDate),
  );
}

export default function MemoryMapView() {
  const { records, album, hydrated } = useLocalRecords();
  const items = useMemo(() => buildItems(records, album), [records, album]);

  if (!hydrated) {
    return (
      <DiaryCard variant="soft">
        <p className="font-pixel text-[10px] text-navy/50">…</p>
      </DiaryCard>
    );
  }

  if (items.length === 0) {
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

  // Group by location for an "atlas" feel
  const byLocation = new Map<string, MapItem[]>();
  for (const item of items) {
    const arr = byLocation.get(item.location) ?? [];
    arr.push(item);
    byLocation.set(item.location, arr);
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
                <li key={`${r.source}-${r.id}`} className="flex gap-3">
                  {r.photo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={r.photo}
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
                    <div className="flex items-baseline gap-2">
                      {r.displayDate ? (
                        <p className="font-pixel text-[10px] text-diary-orange-d">
                          {r.displayDate}
                        </p>
                      ) : (
                        <p className="font-pixel text-[10px] text-diary-ink-soft">
                          未注明日期
                        </p>
                      )}
                      <span
                        className={`font-pixel text-[8px] tracking-widest px-1.5 py-0.5 border ${
                          r.source === "album"
                            ? "bg-cream text-navy border-navy"
                            : "bg-warm-orange text-cream border-navy"
                        }`}
                      >
                        {r.source === "album" ? "相册照片" : "日记照片"}
                      </span>
                    </div>
                    {r.title ? (
                      <p className="font-display text-[14px] leading-snug text-navy mt-0.5 break-words">
                        {r.title}
                      </p>
                    ) : null}
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
