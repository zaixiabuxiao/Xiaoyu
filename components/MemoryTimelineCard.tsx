import type { LifeChapter } from "@/lib/mock-data";
import DiaryCard from "./DiaryCard";
import MemoryThumbnail from "./MemoryThumbnail";
import { PixelCalendar, PixelHeart, PixelPin } from "./PixelIcons";

type Props = {
  chapter: LifeChapter;
  compact?: boolean;
};

export default function MemoryTimelineCard({ chapter, compact = false }: Props) {
  if (compact) {
    return (
      <DiaryCard variant="soft">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-1.5">
              <PixelCalendar size={12} />
              <span className="font-pixel text-[10px] text-diary-orange-d">
                {chapter.completedDate ?? "未注明日期"}
              </span>
            </div>
            <h3 className="font-display text-lg text-navy leading-tight mt-1">
              {chapter.title}
            </h3>
          </div>
          <PixelHeart size={12} className="shrink-0 mt-1" />
        </div>
        {chapter.note ? (
          <>
            <div className="dash-h my-2" />
            <p className="text-base text-navy leading-snug">{chapter.note}</p>
          </>
        ) : null}
        {chapter.location ? (
          <p className="mt-2 inline-flex items-center gap-1.5 font-display text-sm text-navy/80">
            <PixelPin size={12} /> {chapter.location}
          </p>
        ) : null}
      </DiaryCard>
    );
  }

  return (
    <DiaryCard>
      <span className="absolute top-3 right-3 z-10">
        <PixelHeart size={14} />
      </span>

      <div className="grid grid-cols-[112px_1fr] gap-3">
        <MemoryThumbnail
          category={chapter.category}
          tag={chapter.category.slice(0, 2)}
          label={chapter.title}
          height={108}
        />

        <div className="flex flex-col min-w-0 pr-5">
          <div className="inline-flex items-center gap-1.5">
            <PixelCalendar size={12} />
            <span className="font-pixel text-[10px] text-diary-orange-d">
              {chapter.completedDate ?? "未注明日期"}
            </span>
          </div>

          <h3 className="font-display text-[20px] leading-tight text-navy mt-1 break-words">
            {chapter.title}
          </h3>

          <div className="dash-h my-2" />

          {chapter.note ? (
            <p className="text-[13px] text-navy leading-relaxed">
              {chapter.note}
            </p>
          ) : (
            <p className="text-[13px] text-navy/70 italic leading-relaxed">
              “{chapter.meaning}”
            </p>
          )}

          {chapter.location ? (
            <p className="mt-2 inline-flex items-center gap-1.5 font-display text-sm text-navy">
              <PixelPin size={12} /> {chapter.location}
            </p>
          ) : null}

          {chapter.wantsToRepeat ? (
            <p className="mt-1 inline-flex items-center gap-1.5 font-display text-sm text-heart-d">
              <PixelHeart size={11} /> 想再来一次
            </p>
          ) : null}
        </div>
      </div>
    </DiaryCard>
  );
}
