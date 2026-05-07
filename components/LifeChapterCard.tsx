import type { LifeChapter, ChapterStatus } from "@/lib/mock-data";

type Props = {
  chapter: LifeChapter;
  compact?: boolean;
};

const statusStyles: Record<ChapterStatus, string> = {
  想做: "bg-cream text-navy border-navy",
  计划中: "bg-warm-orange-soft text-navy border-navy",
  已记录: "bg-warm-orange text-cream border-navy",
  想再来一次: "bg-navy text-cream border-navy",
};

export default function LifeChapterCard({ chapter, compact = false }: Props) {
  return (
    <article className="bg-white border-3 border-navy shadow-pixel p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-pixel text-[10px] text-warm-orange tracking-widest">
            #{chapter.number.toString().padStart(2, "0")} · {chapter.category}
          </p>
          <h3 className="font-pixel text-xs mt-1 leading-snug">
            {chapter.title}
          </h3>
        </div>
        <span
          className={`shrink-0 border-2 px-2 py-1 font-pixel text-[9px] ${statusStyles[chapter.status]}`}
        >
          {chapter.status}
        </span>
      </div>

      {!compact ? (
        <>
          <p className="text-lg mt-3 leading-snug text-navy/90">
            {chapter.suggestedContext}
          </p>
          <p className="text-base mt-1 text-navy/70 italic">
            “{chapter.meaning}”
          </p>
          {chapter.completedDate || chapter.location ? (
            <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 font-pixel text-[10px] text-navy/70">
              {chapter.completedDate ? (
                <span>◷ {chapter.completedDate}</span>
              ) : null}
              {chapter.location ? <span>◎ {chapter.location}</span> : null}
            </div>
          ) : null}
        </>
      ) : null}
    </article>
  );
}
