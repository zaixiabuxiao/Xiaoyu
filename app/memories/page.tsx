import PixelHeader from "@/components/PixelHeader";
import PixelCard from "@/components/PixelCard";
import MemoryTimelineCard from "@/components/MemoryTimelineCard";
import { getCompletedChapters } from "@/lib/mock-data";

const tabs = ["时间线", "相册", "地图", "年度回顾"];

export default function MemoriesPage() {
  const completed = getCompletedChapters();

  return (
    <div className="space-y-5">
      <PixelHeader
        eyebrow="MEMORIES"
        title="我们的回忆"
        subtitle="一段段被认真留下来的日子。"
      />

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

      {completed.length === 0 ? (
        <PixelCard>
          <p className="text-lg">还没有记录，慢慢来。</p>
        </PixelCard>
      ) : (
        <ul className="space-y-4">
          {completed.map((chapter) => (
            <li key={chapter.id}>
              <MemoryTimelineCard chapter={chapter} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
