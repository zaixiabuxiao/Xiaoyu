import BrandSummaryCard from "@/components/BrandSummaryCard";
import TodayRecordPanel from "@/components/TodayRecordPanel";
import VolumeProgressCard from "@/components/VolumeProgressCard";
import RecommendedChapterAction from "@/components/RecommendedChapterAction";
import {
  getActiveVolume,
  lifeChapters,
  todayRecord,
} from "@/lib/mock-data";

export default function HomePage() {
  const activeVolume = getActiveVolume();
  const recommended = lifeChapters.find(
    (c) => c.id === todayRecord.recommendedChapterId,
  );

  return (
    <div className="space-y-3">
      <h1 className="diary-page-title text-center mb-2">羽扬日记</h1>

      <BrandSummaryCard />

      <TodayRecordPanel />

      <VolumeProgressCard
        volumeNumber={activeVolume.number}
        volumeTitle={activeVolume.title}
        completed={activeVolume.completedCount}
        total={activeVolume.totalCount}
      />

      {recommended ? <RecommendedChapterAction chapter={recommended} /> : null}
    </div>
  );
}
