"use client";

import { useState } from "react";
import type { LifeChapter } from "@/lib/mock-data";
import {
  getTodayString,
  saveDailyRecord,
  DailyRecordExistsError,
} from "@/lib/local-records";
import { useLocalRecords } from "@/lib/use-local-records";
import LifeChapterCard from "./LifeChapterCard";
import PixelButton from "./PixelButton";
import RecordChapterDialog from "./RecordChapterDialog";
import RecordChapterForm, { type RecordPayload } from "./RecordChapterForm";

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

  return (
    <>
      <LifeChapterCard chapter={chapter}>
        {!hydrated ? (
          <p className="font-pixel text-[10px] text-navy/60">…</p>
        ) : todayRecord ? (
          <p className="font-pixel text-[10px] text-navy/70">
            今天已经写好了，明天再写这件。
          </p>
        ) : (
          <PixelButton type="button" onClick={() => setOpen(true)}>
            今天就写这件
          </PixelButton>
        )}
      </LifeChapterCard>

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
