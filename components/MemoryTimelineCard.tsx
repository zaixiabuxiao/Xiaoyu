import type { LifeChapter } from "@/lib/mock-data";

type Props = {
  chapter: LifeChapter;
};

export default function MemoryTimelineCard({ chapter }: Props) {
  return (
    <article className="relative pl-6">
      <span className="absolute left-0 top-2 h-3 w-3 bg-warm-orange border-2 border-navy" />
      <span className="absolute left-[5px] top-5 bottom-0 w-[2px] bg-navy/30" />

      <div className="bg-white border-3 border-navy shadow-pixel p-4">
        <p className="font-pixel text-[10px] text-warm-orange tracking-widest">
          {chapter.completedDate ?? "未注明日期"} · {chapter.category}
        </p>
        <h3 className="font-pixel text-xs mt-1 leading-snug">
          {chapter.title}
        </h3>
        {chapter.note ? (
          <p className="text-lg mt-2 leading-snug">{chapter.note}</p>
        ) : null}
        {chapter.location ? (
          <p className="font-pixel text-[10px] text-navy/70 mt-2">
            ◎ {chapter.location}
          </p>
        ) : null}
        {chapter.wantsToRepeat ? (
          <p className="font-pixel text-[10px] text-warm-orange mt-2">
            ✦ 想再来一次
          </p>
        ) : null}
      </div>
    </article>
  );
}
