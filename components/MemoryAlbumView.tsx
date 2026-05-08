"use client";

import { useMemo, useState } from "react";
import {
  deleteAlbumPhoto,
  saveAlbumPhoto,
  type AlbumPhoto,
  type DailyRecord,
} from "@/lib/local-records";
import { formatDateForDisplay } from "@/lib/date-utils";
import { useLocalRecords } from "@/lib/use-local-records";
import DiaryCard from "./DiaryCard";
import DiaryButton from "./DiaryButton";
import RecordChapterDialog from "./RecordChapterDialog";
import AlbumUploadForm, { type AlbumUploadPayload } from "./AlbumUploadForm";
import { PixelPin } from "./PixelIcons";

type DailyAlbumItem = {
  source: "daily";
  id: string;
  photo: string;
  sortDate: string;
  displayDate?: string;
  title?: string;
  location?: string;
  note?: string;
};

type AlbumOnlyItem = {
  source: "album";
  id: string;
  photo: string;
  sortDate: string;
  displayDate?: string;
  title?: string;
  location?: string;
  note?: string;
};

type AlbumItem = DailyAlbumItem | AlbumOnlyItem;

function buildItems(
  records: DailyRecord[],
  album: AlbumPhoto[],
): AlbumItem[] {
  const dailyItems: DailyAlbumItem[] = records
    .filter((r) => r.photos.length > 0)
    .map((r) => ({
      source: "daily",
      id: `daily-${r.date}`,
      photo: r.photos[0],
      sortDate: r.date,
      displayDate: formatDateForDisplay(r.date),
      title: r.title,
      location: r.location,
      note: r.note,
    }));
  const albumItems: AlbumOnlyItem[] = album.map((p) => ({
    source: "album",
    id: p.id,
    photo: p.photo,
    sortDate: p.date ?? p.createdAt.slice(0, 10),
    displayDate: p.date ? formatDateForDisplay(p.date) : undefined,
    location: p.location,
    note: p.note,
  }));
  return [...dailyItems, ...albumItems].sort((a, b) =>
    b.sortDate.localeCompare(a.sortDate),
  );
}

export default function MemoryAlbumView() {
  const { records, album, hydrated } = useLocalRecords();
  const [uploadOpen, setUploadOpen] = useState(false);

  const items = useMemo(() => buildItems(records, album), [records, album]);

  function handleSave(payload: AlbumUploadPayload) {
    saveAlbumPhoto(payload);
    setUploadOpen(false);
  }

  function handleDelete(id: string) {
    if (typeof window === "undefined") return;
    if (window.confirm("把这张照片从相册里取出来吗？")) {
      deleteAlbumPhoto(id);
    }
  }

  if (!hydrated) {
    return (
      <DiaryCard variant="soft">
        <p className="font-pixel text-[10px] text-navy/50">…</p>
      </DiaryCard>
    );
  }

  if (items.length === 0) {
    return (
      <>
        <DiaryCard variant="soft">
          <p className="font-display text-[16px] text-navy leading-snug">
            相册还空着。
          </p>
          <div className="dash-h my-3" />
          <p className="text-[13px] text-diary-ink-soft leading-relaxed">
            可以从今天开始，也可以先放进一张以前的照片。
          </p>
          <div className="mt-3">
            <DiaryButton type="button" onClick={() => setUploadOpen(true)}>
              放进我们的相册
            </DiaryButton>
          </div>
        </DiaryCard>
        <UploadDialog
          open={uploadOpen}
          onClose={() => setUploadOpen(false)}
          onSave={handleSave}
        />
      </>
    );
  }

  return (
    <>
      <div className="flex justify-end mb-3">
        <DiaryButton
          type="button"
          variant="small"
          onClick={() => setUploadOpen(true)}
        >
          放进我们的相册
        </DiaryButton>
      </div>

      <ul className="grid grid-cols-2 gap-3">
        {items.map((item) => (
          <li key={`${item.source}-${item.id}`}>
            <AlbumCard item={item} onDelete={handleDelete} />
          </li>
        ))}
      </ul>

      <UploadDialog
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onSave={handleSave}
      />
    </>
  );
}

function AlbumCard({
  item,
  onDelete,
}: {
  item: AlbumItem;
  onDelete: (id: string) => void;
}) {
  const isAlbum = item.source === "album";
  return (
    <div className="relative bg-white border-3 border-navy shadow-pixel-sm p-2">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={item.photo}
        alt={item.title ?? item.note ?? "相册照片"}
        className="block w-full aspect-square object-cover border-2 border-navy bg-cream"
        style={{ imageRendering: "auto" }}
      />

      <span
        className={`absolute top-3 left-3 font-pixel text-[8px] tracking-widest px-1.5 py-0.5 border-2 ${
          isAlbum
            ? "bg-cream text-navy border-navy"
            : "bg-warm-orange text-cream border-navy"
        }`}
      >
        {isAlbum ? "相册照片" : "日记照片"}
      </span>

      {isAlbum ? (
        <button
          type="button"
          onClick={() => onDelete(item.id)}
          aria-label="移除这张照片"
          className="absolute top-3 right-3 w-6 h-6 grid place-items-center bg-cream border-2 border-navy text-navy hover:bg-warm-orange hover:text-cream font-pixel text-xs"
        >
          ×
        </button>
      ) : null}

      <div className="mt-2 space-y-0.5">
        {item.displayDate ? (
          <p className="font-pixel text-[10px] text-diary-orange-d">
            {item.displayDate}
          </p>
        ) : (
          <p className="font-pixel text-[10px] text-diary-ink-soft">
            未注明日期
          </p>
        )}
        {item.title ? (
          <h3 className="font-display text-[14px] leading-snug text-navy line-clamp-2 break-words">
            {item.title}
          </h3>
        ) : null}
        {item.note && !item.title ? (
          <p className="text-[12px] text-navy line-clamp-2 leading-snug">
            {item.note}
          </p>
        ) : null}
        {item.location ? (
          <p className="inline-flex items-center gap-1 font-display text-[12px] text-diary-ink-soft">
            <PixelPin size={10} /> {item.location}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function UploadDialog({
  open,
  onClose,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (payload: AlbumUploadPayload) => void;
}) {
  return (
    <RecordChapterDialog open={open} onClose={onClose}>
      <AlbumUploadForm onSave={onSave} onCancel={onClose} />
    </RecordChapterDialog>
  );
}
