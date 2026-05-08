"use client";

import { formatDateForDisplay } from "@/lib/date-utils";
import { useLocalRecords } from "@/lib/use-local-records";
import DiaryCard from "./DiaryCard";
import { PixelPin } from "./PixelIcons";

export default function MemoryAlbumView() {
  const { records, hydrated } = useLocalRecords();

  if (!hydrated) {
    return (
      <DiaryCard variant="soft">
        <p className="font-pixel text-[10px] text-navy/50">…</p>
      </DiaryCard>
    );
  }

  const withPhotos = records
    .filter((r) => r.photos.length > 0)
    .sort((a, b) => b.date.localeCompare(a.date));

  if (withPhotos.length === 0) {
    return (
      <DiaryCard variant="soft">
        <p className="font-display text-[16px] text-navy leading-snug">
          相册还空着。
        </p>
        <div className="dash-h my-3" />
        <p className="text-[13px] text-diary-ink-soft leading-relaxed">
          等我们写下第一篇带照片的日记，它就会出现在这里。
        </p>
      </DiaryCard>
    );
  }

  return (
    <ul className="grid grid-cols-2 gap-3">
      {withPhotos.map((record) => (
        <li key={record.date}>
          <div className="bg-white border-3 border-navy shadow-pixel-sm p-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={record.photos[0]}
              alt={record.title}
              className="block w-full aspect-square object-cover border-2 border-navy bg-cream"
              style={{ imageRendering: "auto" }}
            />
            <p className="font-pixel text-[10px] text-diary-orange-d mt-2">
              {formatDateForDisplay(record.date)}
            </p>
            <h3 className="font-display text-[14px] leading-snug mt-0.5 line-clamp-2 text-navy break-words">
              {record.title}
            </h3>
            {record.location ? (
              <p className="mt-1 inline-flex items-center gap-1 font-display text-[12px] text-diary-ink-soft">
                <PixelPin size={10} /> {record.location}
              </p>
            ) : null}
          </div>
        </li>
      ))}
    </ul>
  );
}
