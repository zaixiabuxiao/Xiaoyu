"use client";

import { useState } from "react";
import type { LifeChapter } from "@/lib/mock-data";
import {
  getTodayString,
  saveDailyRecord,
  DailyRecordExistsError,
} from "@/lib/local-records";
import { useLocalRecords } from "@/lib/use-local-records";
import DiaryCard from "./DiaryCard";
import DiaryButton from "./DiaryButton";
import MemoryThumbnail from "./MemoryThumbnail";
import RecordChapterDialog from "./RecordChapterDialog";
import RecordChapterForm, { type RecordPayload } from "./RecordChapterForm";
import { PixelHeart, Sparkle } from "./PixelIcons";

type Props = {
  chapter: LifeChapter;
};

export default function RecommendedChapterAction({ chapter }: Props) {
  const { records, hydrated } = useLocalRecords();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const today = getTodayString();
  const todayRecord = records.find((r) => r.date === today);

  function handleSave(payload: RecordPayload) {
    try {
      saveDailyRecord(payload);
      setOpen(false);
      setError(null);
    } catch (e) {
      if (e instanceof DailyRecordExistsError) {
        setError("今天已经写过一件了，剩下的明天再来。");
      } else {
        setError("保存失败，请稍后再试。");
      }
    }
  }

  const numberLabel = `No.${chapter.number.toString().padStart(2, "0")}`;

  return (
    <>
      <DiaryCard>
        <div className="flex items-center gap-2 mb-2">
          <PixelHeart size={12} />
          <span className="font-display text-[18px] text-navy leading-none">
            今天可以写这一页
          </span>
          <Sparkle size={6} />
        </div>

        <div
          className="grid gap-2 border-2 border-navy rounded-lg p-2.5"
          style={{ gridTemplateColumns: "92px 1fr", background: "#FFFBE9" }}
        >
          <MemoryThumbnail
            category={chapter.category}
            tag={numberLabel}
            label={chapter.title}
            height={92}
          />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-diary-orange-d">
              <span className="font-pixel text-[10px]">{numberLabel}</span>
              <span className="font-display text-[13px] text-diary-ink-soft">
                · {chapter.category}
              </span>
            </div>
            <p className="font-display text-[18px] text-navy mt-0.5 leading-tight break-words">
              {chapter.title}
            </p>
            <div className="dash-h my-1.5" />
            <p className="text-[12px] text-diary-ink-soft leading-relaxed italic">
              “{chapter.meaning}”
            </p>
          </div>
        </div>

        <div className="flex justify-end mt-2.5">
          {!hydrated ? (
            <span className="font-pixel text-[10px] text-navy/50">…</span>
          ) : todayRecord ? (
            <span className="font-display text-[13px] text-diary-ink-soft">
              今天已经写好了，明天再写这件。
            </span>
          ) : (
            <DiaryButton
              type="button"
              variant="small"
              onClick={() => setOpen(true)}
            >
              写下这一页
            </DiaryButton>
          )}
        </div>
      </DiaryCard>

      <RecordChapterDialog open={open} onClose={() => setOpen(false)}>
        <RecordChapterForm
          date={today}
          chapterId={chapter.id}
          volumeId={chapter.volumeId}
          chapterTitle={chapter.title}
          onSave={handleSave}
          onCancel={() => setOpen(false)}
        />
        {error ? (
          <p className="font-pixel text-[10px] text-warm-orange mt-2">
            {error}
          </p>
        ) : null}
      </RecordChapterDialog>
    </>
  );
}
