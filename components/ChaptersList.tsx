"use client";

import { useMemo, useState } from "react";
import type { LifeChapter, ChapterStatus } from "@/lib/mock-data";
import { getTodayString } from "@/lib/local-records";
import { useDiaryData } from "@/lib/use-diary-data";
import ChapterListItem from "./ChapterListItem";
import RecordChapterDialog from "./RecordChapterDialog";
import RecordChapterForm, { type RecordPayload } from "./RecordChapterForm";

type Props = {
  chapters: LifeChapter[];
};

const CATEGORY_FILTERS: { label: string; match: string | null }[] = [
  { label: "全部", match: null },
  { label: "宅家", match: "宅家日常" },
  { label: "外出", match: "外出约会" },
  { label: "旅行", match: "旅行探索" },
  { label: "家庭", match: "家庭建设" },
  { label: "宝宝预备", match: "未来宝宝预备" },
  { label: "沟通", match: "沟通与修复" },
  { label: "信仰", match: "信仰与价值观" },
  { label: "未来", match: "未来梦想" },
];

type StatusFilterId = "全部" | "想做" | "计划中" | "已记录" | "想再来一次";

const STATUS_FILTERS: StatusFilterId[] = [
  "全部",
  "想做",
  "计划中",
  "已记录",
  "想再来一次",
];

function matchesStatus(
  filter: StatusFilterId,
  chapter: LifeChapter,
  planned: boolean,
): boolean {
  if (filter === "全部") return true;
  if (filter === "计划中")
    return planned || chapter.status === "计划中";
  if (filter === "想做") {
    return chapter.status === "想做" && !planned;
  }
  return chapter.status === (filter as ChapterStatus);
}

export default function ChaptersList({ chapters }: Props) {
  const data = useDiaryData();
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilterId>("全部");
  const [recordingChapter, setRecordingChapter] = useState<LifeChapter | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  const today = getTodayString();
  const todayRecord = data.records.find((r) => r.date === today);
  const plannedSet = useMemo(() => new Set(data.planned), [data.planned]);

  const filtered = useMemo(() => {
    return chapters.filter((c) => {
      if (categoryFilter && c.category !== categoryFilter) return false;
      const isPlanned = plannedSet.has(c.id);
      if (!matchesStatus(statusFilter, c, isPlanned)) return false;
      return true;
    });
  }, [chapters, categoryFilter, statusFilter, plannedSet]);

  async function handleSave(payload: RecordPayload) {
    const result = await data.saveDailyRecord(payload);
    if (result.ok) {
      setRecordingChapter(null);
      setError(null);
      return;
    }
    if (result.code === "DAILY_RECORD_EXISTS") {
      setError("今天已经写过一页了，剩下的明天再来。");
    } else if (result.code === "PHOTO_REQUIRED") {
      setError("这一页还缺一张今天的照片。");
    } else if (result.code === "NOT_AUTHENTICATED") {
      setError("云端身份断开了，请先重新连接。");
    } else {
      setError(result.message || "保存失败，请稍后再试。");
    }
  }

  return (
    <>
      <CategoryFilters
        active={categoryFilter}
        onChange={setCategoryFilter}
      />

      <StatusFilters active={statusFilter} onChange={setStatusFilter} />

      {!data.hydrated ? (
        <p className="font-pixel text-[10px] text-navy/50 px-1">…</p>
      ) : null}

      {filtered.length === 0 ? (
        <p className="text-[14px] text-diary-ink-soft text-center py-6">
          这一类还空着，先翻一翻别的章节吧。
        </p>
      ) : (
        <ul className="space-y-3">
          {filtered.map((chapter) => (
            <li key={chapter.id}>
              <ChapterListItem
                chapter={chapter}
                planned={plannedSet.has(chapter.id)}
                todayRecorded={Boolean(todayRecord)}
                onPlan={(c) => {
                  void data.addPlannedChapter(c.id);
                }}
                onUnplan={(c) => {
                  void data.removePlannedChapter(c.id);
                }}
                onRecord={(c) => setRecordingChapter(c)}
                onView={() => {
                  /* viewing a written chapter is handled in /memories */
                }}
              />
            </li>
          ))}
        </ul>
      )}

      <RecordChapterDialog
        open={Boolean(recordingChapter)}
        onClose={() => {
          setRecordingChapter(null);
          setError(null);
        }}
      >
        {recordingChapter ? (
          <>
            <RecordChapterForm
              date={today}
              chapterId={recordingChapter.id}
              volumeId={recordingChapter.volumeId}
              chapterTitle={recordingChapter.title}
              onSave={handleSave}
              onCancel={() => {
                setRecordingChapter(null);
                setError(null);
              }}
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

function CategoryFilters({
  active,
  onChange,
}: {
  active: string | null;
  onChange: (next: string | null) => void;
}) {
  return (
    <div className="-mx-4 px-4 overflow-x-auto no-scroll">
      <div className="flex items-center gap-2 pb-1">
        {CATEGORY_FILTERS.map((f) => {
          const isActive = active === f.match;
          return (
            <button
              key={f.label}
              type="button"
              onClick={() => onChange(f.match)}
              className={`shrink-0 font-display text-[13px] px-3 py-1 border-2 rounded-md whitespace-nowrap transition-colors ${
                isActive
                  ? "bg-warm-orange text-cream border-navy"
                  : "bg-cream text-navy border-navy/40 hover:border-navy"
              }`}
            >
              {f.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function StatusFilters({
  active,
  onChange,
}: {
  active: StatusFilterId;
  onChange: (next: StatusFilterId) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px]">
      {STATUS_FILTERS.map((s) => {
        const isActive = s === active;
        return (
          <button
            key={s}
            type="button"
            onClick={() => onChange(s)}
            className={`font-display py-0.5 ${
              isActive
                ? "text-navy underline decoration-warm-orange decoration-2 underline-offset-4"
                : "text-diary-ink-soft hover:text-navy"
            }`}
          >
            {s}
          </button>
        );
      })}
    </div>
  );
}
