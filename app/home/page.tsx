import PixelHeader from "@/components/PixelHeader";
import PixelCard from "@/components/PixelCard";
import ProgressGrid100 from "@/components/ProgressGrid100";
import TodayModeSelector from "@/components/TodayModeSelector";
import LifeChapterCard from "@/components/LifeChapterCard";
import MemoryTimelineCard from "@/components/MemoryTimelineCard";
import FeatherDivider from "@/components/FeatherDivider";
import {
  chapterVolumes,
  countByStatus,
  getActiveVolume,
  getCompletedChapters,
  lifeChapters,
  todayRecord,
} from "@/lib/mock-data";

export default function HomePage() {
  const activeVolume = getActiveVolume();
  const planning = countByStatus("计划中", activeVolume.id);
  const repeat = countByStatus("想再来一次", activeVolume.id);
  const recommended = lifeChapters.find(
    (c) => c.id === todayRecord.recommendedChapterId,
  );
  const recentMemory = getCompletedChapters(activeVolume.id)[0];

  return (
    <div className="space-y-5">
      <PixelHeader
        eyebrow="羽扬日记"
        title="羽扬日记"
        subtitle="让平凡的日子，也长出被记住的羽毛。"
        showMascot
      />

      <PixelCard variant="orange">
        <p className="font-pixel text-[10px] tracking-widest text-warm-orange">
          当前章节卷
        </p>
        <p className="font-pixel text-xs mt-1">
          第{activeVolume.number === 1 ? "一" : activeVolume.number}卷：
          {activeVolume.title}
        </p>
        <p className="text-lg mt-2 leading-snug">
          慢慢写，每天一件就够了。
        </p>
      </PixelCard>

      <PixelCard>
        <p className="font-pixel text-[10px] tracking-widest text-warm-orange">
          今日小结
        </p>
        <ul className="mt-2 space-y-1 text-lg">
          <li>· 婚后第 365 天</li>
          <li>· 距离下一次纪念日还有 18 天</li>
          <li>
            · 已记录 {activeVolume.completedCount} / {activeVolume.totalCount} 件
          </li>
          <li>· 计划中 {planning} 件</li>
          <li>· 想再来一次 {repeat} 件</li>
        </ul>
      </PixelCard>

      <section>
        <h2 className="font-pixel text-xs mb-2">今天的状态</h2>
        <TodayModeSelector initial={todayRecord.todayMode} />
      </section>

      {recommended ? (
        <section>
          <h2 className="font-pixel text-xs mb-2">为今天推荐</h2>
          <LifeChapterCard chapter={recommended} />
        </section>
      ) : null}

      <FeatherDivider />

      <section>
        <h2 className="font-pixel text-xs mb-2">100 件章节进度</h2>
        <PixelCard>
          <ProgressGrid100
            total={activeVolume.totalCount}
            completed={activeVolume.completedCount}
            planning={planning}
          />
        </PixelCard>
      </section>

      {recentMemory ? (
        <section>
          <h2 className="font-pixel text-xs mb-2">最近的一段</h2>
          <MemoryTimelineCard chapter={recentMemory} />
        </section>
      ) : null}

      <p className="font-pixel text-[10px] text-navy/60 text-center pt-2">
        共 {chapterVolumes.length} 卷 · 当前在第{activeVolume.number}卷
      </p>
    </div>
  );
}
