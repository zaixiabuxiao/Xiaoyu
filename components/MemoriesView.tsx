"use client";

import { useState } from "react";
import type { LifeChapter } from "@/lib/mock-data";
import {
  deleteDailyRecord,
  updateDailyRecord,
  type DailyRecord,
} from "@/lib/local-records";
import { useLocalRecords } from "@/lib/use-local-records";
import LocalMemoryCard from "./LocalMemoryCard";
import MemoryTimelineCard from "./MemoryTimelineCard";
import PixelCard from "./PixelCard";
import RecordChapterDialog from "./RecordChapterDialog";
import RecordChapterForm, { type RecordPayload } from "./RecordChapterForm";

type Props = {
  mockMemories: LifeChapter[];
};

const tabs = ["时间线", "相册", "地图", "年度回顾"];

export default function MemoriesView({ mockMemories }: Props) {
  const { records, hydrated } = useLocalRecords();
  const [editing, setEditing] = useState<DailyRecord | null>(null);

  const sortedLocal = [...records].sort((a, b) =>
    b.date.localeCompare(a.date),
  );

  function handleEditSave(payload: RecordPayload) {
    if (!editing) return;
    updateDailyRecord(editing.date, payload);
    setEditing(null);
  }

  function handleDelete(record: DailyRecord) {
    if (typeof window !== "undefined") {
      const ok = window.confirm(`确定删除 ${record.date} 这条本地记录吗？`);
      if (!ok) return;
    }
    deleteDailyRecord(record.date);
  }

  return (
    <>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {tabs.map((tab, i) => (
          <span
            key={tab}
            className={`border-3 px-3 py-1 font-pixel text-[10px] whitespace-nowrap ${
              i === 0
                ? "bg-navy text-cream border-navy"
                : "bg-white text-navy border-navy shadow-pixel-sm"
            }`}
          >
            {tab}
          </span>
        ))}
      </div>

      {!hydrated ? (
        <PixelCard>
          <p className="font-pixel text-[10px] text-navy/60">…</p>
        </PixelCard>
      ) : null}

      {hydrated && sortedLocal.length > 0 ? (
        <section className="space-y-4">
          <h2 className="font-pixel text-xs">本地记录</h2>
          <ul className="space-y-4">
            {sortedLocal.map((record) => (
              <li key={record.date}>
                <LocalMemoryCard
                  record={record}
                  showActions
                  onEdit={(r) => setEditing(r)}
                  onDelete={handleDelete}
                />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="space-y-4">
        <h2 className="font-pixel text-xs">章节里的回忆</h2>
        {mockMemories.length === 0 ? (
          <PixelCard>
            <p className="text-lg">还没有记录，慢慢来。</p>
          </PixelCard>
        ) : (
          <ul className="space-y-4">
            {mockMemories.map((chapter) => (
              <li key={chapter.id}>
                <MemoryTimelineCard chapter={chapter} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <RecordChapterDialog
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
      >
        {editing ? (
          <RecordChapterForm
            date={editing.date}
            existing={editing}
            onSave={handleEditSave}
            onCancel={() => setEditing(null)}
            saveLabel="保存修改"
            cancelLabel="取消"
          />
        ) : null}
      </RecordChapterDialog>
    </>
  );
}
