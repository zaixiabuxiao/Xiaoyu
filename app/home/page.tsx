import BrandSummaryCard from "@/components/BrandSummaryCard";
import HomeChapterCalendar from "@/components/HomeChapterCalendar";
import HomeChapterChooser from "@/components/HomeChapterChooser";
import VolumeProgressCard from "@/components/VolumeProgressCard";
import { getActiveVolume } from "@/lib/mock-data";

export default function HomePage() {
  const activeVolume = getActiveVolume();

  return (
    <div className="space-y-3">
      <h1 className="diary-page-title text-center mb-2">羽扬日记</h1>

      <BrandSummaryCard />

      <HomeChapterCalendar />

      <VolumeProgressCard
        volumeNumber={activeVolume.number}
        volumeTitle={activeVolume.title}
        completed={activeVolume.completedCount}
        total={activeVolume.totalCount}
      />

      <HomeChapterChooser />
    </div>
  );
}
