import PixelHeader from "@/components/PixelHeader";
import PixelCard from "@/components/PixelCard";
import ChaptersList from "@/components/ChaptersList";
import { getActiveVolume, lifeChapters } from "@/lib/mock-data";

const categoryFilters = [
  "全部",
  "宅家",
  "外出",
  "旅行",
  "家庭",
  "宝宝预备",
  "沟通",
  "信仰",
  "未来",
];

const statusFilters = ["全部", "想做", "计划中", "已记录", "想再来一次"];

export default function ChaptersPage() {
  const activeVolume = getActiveVolume();
  const chapters = lifeChapters.filter((c) => c.volumeId === activeVolume.id);

  return (
    <div className="space-y-5">
      <PixelHeader
        eyebrow="CHAPTERS"
        title="100 件生活章节"
        subtitle={`第${activeVolume.number === 1 ? "一" : activeVolume.number}卷：${activeVolume.title}`}
      />

      <PixelCard variant="orange">
        <p className="text-lg leading-snug">
          每天只能正式写下一件，其他可以先放进想做的那一页。
        </p>
      </PixelCard>

      <section>
        <p className="font-pixel text-[10px] text-warm-orange tracking-widest mb-2">
          类别
        </p>
        <div className="flex flex-wrap gap-2">
          {categoryFilters.map((label, i) => (
            <span
              key={label}
              className={`border-3 px-3 py-1 font-pixel text-[10px] ${
                i === 0
                  ? "bg-navy text-cream border-navy"
                  : "bg-white text-navy border-navy shadow-pixel-sm"
              }`}
            >
              {label}
            </span>
          ))}
        </div>
      </section>

      <section>
        <p className="font-pixel text-[10px] text-warm-orange tracking-widest mb-2">
          状态
        </p>
        <div className="flex flex-wrap gap-2">
          {statusFilters.map((label, i) => (
            <span
              key={label}
              className={`border-3 px-3 py-1 font-pixel text-[10px] ${
                i === 0
                  ? "bg-navy text-cream border-navy"
                  : "bg-white text-navy border-navy shadow-pixel-sm"
              }`}
            >
              {label}
            </span>
          ))}
        </div>
      </section>

      <ChaptersList chapters={chapters} />
    </div>
  );
}
