"use client";

import { useState } from "react";
import type { LifeChapter } from "@/lib/mock-data";
import DiaryCard from "./DiaryCard";
import DiaryButton from "./DiaryButton";
import MemoryThumbnail from "./MemoryThumbnail";
import { PixelCalendar, PixelHeart, PixelPin } from "./PixelIcons";

type ActionKind = "primary" | "muted" | "info";

type Props = {
  chapter: LifeChapter;
  planned: boolean;
  todayRecorded: boolean;
  onPlan: (chapter: LifeChapter) => void;
  onUnplan: (chapter: LifeChapter) => void;
  onRecord: (chapter: LifeChapter) => void;
  onView: (chapter: LifeChapter) => void;
};

type Pill = {
  text: string;
  className: string;
};

function pillFor(chapter: LifeChapter, planned: boolean): Pill {
  if (chapter.status === "已记录") {
    return {
      text: "已写过",
      className: "bg-warm-orange text-cream border-2 border-navy",
    };
  }
  if (chapter.status === "想再来一次") {
    return {
      text: "想再来一次",
      className: "bg-heart text-cream border-2 border-navy",
    };
  }
  if (planned) {
    return {
      text: "已放进想做",
      className: "bg-warm-orange-soft text-navy border-2 border-navy",
    };
  }
  return {
    text: "想做",
    className: "bg-cream text-navy/80 border-2 border-navy/50",
  };
}

type Action = {
  label: string;
  kind: ActionKind;
  onClick?: () => void;
};

function actionFor(
  chapter: LifeChapter,
  planned: boolean,
  todayRecorded: boolean,
  handlers: Pick<Props, "onPlan" | "onUnplan" | "onRecord" | "onView">,
): Action {
  if (chapter.status === "已记录") {
    return {
      label: "打开这页日记",
      kind: "primary",
      onClick: () => handlers.onView(chapter),
    };
  }
  if (chapter.status === "想再来一次") {
    return {
      label: "再放进计划",
      kind: "primary",
      onClick: () => handlers.onPlan(chapter),
    };
  }
  if (todayRecorded) {
    return { label: "留到下一天", kind: "muted" };
  }
  if (planned || chapter.status === "计划中") {
    return {
      label: "今天写这一页",
      kind: "primary",
      onClick: () => handlers.onRecord(chapter),
    };
  }
  return {
    label: "放进想做",
    kind: "primary",
    onClick: () => handlers.onPlan(chapter),
  };
}

export default function ChapterListItem({
  chapter,
  planned,
  todayRecorded,
  onPlan,
  onUnplan,
  onRecord,
  onView,
}: Props) {
  const [expanded, setExpanded] = useState(false);
  const pill = pillFor(chapter, planned);
  const action = actionFor(chapter, planned, todayRecorded, {
    onPlan,
    onUnplan,
    onRecord,
    onView,
  });
  const numberLabel = `No.${chapter.number.toString().padStart(2, "0")}`;

  return (
    <DiaryCard>
      <span className="absolute top-3 right-3 z-10">
        <PixelHeart
          size={11}
          color={planned ? "#EE6F7E" : "#F3B06F"}
          shadow={planned ? "#D04A5B" : "#C66A2F"}
        />
      </span>

      <div className="grid gap-2.5" style={{ gridTemplateColumns: "72px 1fr" }}>
        <MemoryThumbnail
          category={chapter.category}
          tag={numberLabel}
          height={84}
        />

        <div className="min-w-0 flex flex-col">
          <div className="flex items-start justify-between gap-2">
            <p className="font-pixel text-[10px] text-diary-orange-d tracking-wide">
              {numberLabel}{" "}
              <span className="font-display text-[12px] text-diary-ink-soft">
                · {chapter.category}
              </span>
            </p>
            <span
              className={`shrink-0 font-display text-[10px] px-2 py-0.5 leading-tight whitespace-nowrap ${pill.className}`}
            >
              {pill.text}
            </span>
          </div>

          <h3 className="font-display text-[16px] leading-snug text-navy mt-0.5 break-words">
            {chapter.title}
          </h3>

          <p className="text-[12px] text-diary-ink-soft italic leading-snug mt-1 line-clamp-1">
            “{chapter.meaning}”
          </p>
        </div>
      </div>

      {expanded ? (
        <div className="mt-3 pl-[84px]">
          <div className="dash-h mb-2" />
          <p className="text-[13px] text-navy leading-relaxed">
            {chapter.suggestedContext}
          </p>
          {chapter.completedDate || chapter.location ? (
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px]">
              {chapter.completedDate ? (
                <span className="inline-flex items-center gap-1.5 font-display text-navy">
                  <PixelCalendar size={11} /> {chapter.completedDate}
                </span>
              ) : null}
              {chapter.location ? (
                <span className="inline-flex items-center gap-1.5 font-display text-navy">
                  <PixelPin size={11} /> {chapter.location}
                </span>
              ) : null}
            </div>
          ) : null}
          {chapter.husbandReflection || chapter.wifeReflection ? (
            <div className="mt-2 space-y-0.5 text-[12px] text-navy leading-relaxed">
              {chapter.husbandReflection ? (
                <p>
                  <span className="font-display text-warm-orange">我：</span>
                  {chapter.husbandReflection}
                </p>
              ) : null}
              {chapter.wifeReflection ? (
                <p>
                  <span className="font-display text-heart-d">她：</span>
                  {chapter.wifeReflection}
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="mt-3 pt-3 border-t-2 border-dashed border-navy/25 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="font-display text-[13px] text-diary-ink-soft hover:text-navy underline decoration-dotted underline-offset-4"
        >
          {expanded ? "收起" : "翻开看看"}
        </button>

        <div className="flex items-center gap-2">
          {planned && action.kind === "primary" ? (
            <button
              type="button"
              onClick={() => onUnplan(chapter)}
              className="font-display text-[12px] text-diary-ink-soft hover:text-navy"
            >
              移出想做
            </button>
          ) : null}
          {action.kind === "primary" ? (
            <DiaryButton
              type="button"
              variant="small"
              onClick={action.onClick}
            >
              {action.label}
            </DiaryButton>
          ) : (
            <span className="inline-flex items-center justify-center min-h-[36px] px-3 py-1.5 font-display text-sm border-2 border-navy/40 bg-cream text-navy/60 rounded-lg">
              {action.label}
            </span>
          )}
        </div>
      </div>
    </DiaryCard>
  );
}
