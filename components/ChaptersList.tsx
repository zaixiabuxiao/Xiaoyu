"use client";

import { useState } from "react";
import type { LifeChapter } from "@/lib/mock-data";
import {
  addPlannedChapter,
  removePlannedChapter,
  saveDailyRecord,
  getTodayString,
  DailyRecordExistsError,
} from "@/lib/local-records";
import { useLocalRecords } from "@/lib/use-local-records";
import LifeChapterCard from "./LifeChapterCard";
import PixelButton from "./PixelButton";
import RecordChapterDialog from "./RecordChapterDialog";
import RecordChapterForm, { type RecordPayload } from "./RecordChapterForm";

type Props = {
  chapters: LifeChapter[];
};

export default function ChaptersList({ chapters }: Props) {
  const { records, planned, hydrated } = useLocalRecords();
  const [recordingChapter, setRecordingChapter] = useState<LifeChapter | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  const today = getTodayString();
  const todayRecord = records.find((r) => r.date === today);

  function handleSave(payload: RecordPayload) {
    try {
      saveDailyRecord(payload);
      setRecordingChapter(null);
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
      <ul className="space-y-3">
        {chapters.map((chapter) => {
          const isPlanned = planned.includes(chapter.id);
          const isCompleted = chapter.status === "已记录";
          return (
            <li key={chapter.id}>
              <LifeChapterCard chapter={chapter}>
                {isCompleted ? (
                  <p className="font-pixel text-[10px] text-navy/60">
                    已经写过了。
                  </p>
                ) : (
                  <ChapterActions
                    hydrated={hydrated}
                    isPlanned={isPlanned}
                    todayRecorded={Boolean(todayRecord)}
                    onPlan={() => addPlannedChapter(chapter.id)}
                    onUnplan={() => removePlannedChapter(chapter.id)}
                    onRecord={() => setRecordingChapter(chapter)}
                  />
                )}
              </LifeChapterCard>
            </li>
          );
        })}
      </ul>

      <RecordChapterDialog
        open={Boolean(recordingChapter)}
        onClose={() => setRecordingChapter(null)}
      >
        {recordingChapter ? (
          <>
            <RecordChapterForm
              date={today}
              chapterId={recordingChapter.id}
              volumeId={recordingChapter.volumeId}
              chapterTitle={recordingChapter.title}
              onSave={handleSave}
              onCancel={() => setRecordingChapter(null)}
            />
            {error ? (
              <p className="font-pixel text-[10px] text-warm-orange mt-2">
                {error}
              </p>
            ) : null}
          </>
        ) : null}
      </RecordChapterDialog>
    </>
  );
}

function ChapterActions({
  hydrated,
  isPlanned,
  todayRecorded,
  onPlan,
  onUnplan,
  onRecord,
}: {
  hydrated: boolean;
  isPlanned: boolean;
  todayRecorded: boolean;
  onPlan: () => void;
  onUnplan: () => void;
  onRecord: () => void;
}) {
  if (!hydrated) {
    return <p className="font-pixel text-[10px] text-navy/60">…</p>;
  }

  return (
    <div className="flex flex-wrap gap-2 items-center">
      {isPlanned ? (
        <>
          <span className="font-pixel text-[10px] text-warm-orange border-2 border-navy bg-cream px-2 py-1">
            ✓ 已加入计划
          </span>
          <PixelButton type="button" variant="ghost" onClick={onUnplan}>
            移出计划
          </PixelButton>
        </>
      ) : (
        <PixelButton type="button" variant="soft" onClick={onPlan}>
          先放进想做的那一页
        </PixelButton>
      )}
      {todayRecorded ? (
        <span className="font-pixel text-[10px] text-navy/70">明天再写</span>
      ) : (
        <PixelButton type="button" onClick={onRecord}>
          今天就写这件
        </PixelButton>
      )}
    </div>
  );
}
