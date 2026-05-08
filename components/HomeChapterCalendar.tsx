"use client";

import Link from "next/link";
import { useMemo } from "react";
import DiaryCard from "./DiaryCard";
import { PixelHeart } from "./PixelIcons";
import { lifeChapters } from "@/lib/mock-data";
import { getTodayString } from "@/lib/local-records";
import { useLocalRecords } from "@/lib/use-local-records";

type CellState = "default" | "planned" | "written" | "today";

const cellClassMap: Record<CellState, string> = {
  default: "bg-cream border border-navy/30",
  planned: "bg-warm-orange-soft border border-navy",
  written: "bg-warm-orange border border-navy",
  today: "bg-warm-orange border-2 border-navy",
};

function stateForChapter(
  chapterId: string,
  chapterStatus: string,
  writtenSet: Set<string>,
  plannedSet: Set<string>,
  todayChapterId?: string,
): CellState {
  if (todayChapterId && todayChapterId === chapterId) return "today";
  if (writtenSet.has(chapterId) || chapterStatus === "已记录") return "written";
  if (plannedSet.has(chapterId)) return "planned";
  return "default";
}

const stateLabel: Record<CellState, string> = {
  default: "未写",
  planned: "已放进想做",
  written: "已写过",
  today: "今天写的",
};

export default function HomeChapterCalendar() {
  const { records, planned, hydrated } = useLocalRecords();
  const today = getTodayString();

  const writtenSet = useMemo(
    () => new Set(records.map((r) => r.chapterId)),
    [records],
  );
  const plannedSet = useMemo(() => new Set(planned), [planned]);
  const todayChapterId = useMemo(
    () => records.find((r) => r.date === today)?.chapterId,
    [records, today],
  );

  return (
    <DiaryCard variant="soft">
      <p className="font-pixel text-[10px] tracking-widest text-warm-orange">
        OUR CALENDAR
      </p>
      <h2 className="font-display text-[18px] text-navy mt-1 leading-tight">
        第一卷的小日历
      </h2>
      <p className="text-[12px] text-diary-ink-soft mt-1">
        今天写完一页，这里就会亮起一格。
      </p>

      <div className="grid grid-cols-10 gap-[3px] mt-3">
        {lifeChapters.map((chapter) => {
          const state: CellState = hydrated
            ? stateForChapter(
                chapter.id,
                chapter.status,
                writtenSet,
                plannedSet,
                todayChapterId,
              )
            : "default";
          return (
            <Link
              key={chapter.id}
              href="/chapters"
              aria-label={`No.${chapter.number} · ${chapter.title} · ${stateLabel[state]}`}
              title={`No.${chapter.number} · ${chapter.title}`}
              className={`block aspect-square ${cellClassMap[state]} flex items-center justify-center`}
            >
              {state === "today" ? (
                <PixelHeart size={6} color="#FBF3E2" shadow="#E8743B" />
              ) : null}
            </Link>
          );
        })}
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-[11px] text-navy/75">
        <Legend swatch="bg-cream border border-navy/30" label="未写" />
        <Legend
          swatch="bg-warm-orange-soft border border-navy"
          label="已放进想做"
        />
        <Legend
          swatch="bg-warm-orange border border-navy"
          label="已写过"
        />
        <Legend
          swatch="bg-warm-orange border-2 border-navy"
          label="今天写的"
          withHeart
        />
      </div>
    </DiaryCard>
  );
}

function Legend({
  swatch,
  label,
  withHeart,
}: {
  swatch: string;
  label: string;
  withHeart?: boolean;
}) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className={`block w-3 h-3 ${swatch} flex items-center justify-center`}
      >
        {withHeart ? (
          <PixelHeart size={5} color="#FBF3E2" shadow="#E8743B" />
        ) : null}
      </span>
      <span className="font-display">{label}</span>
    </span>
  );
}
