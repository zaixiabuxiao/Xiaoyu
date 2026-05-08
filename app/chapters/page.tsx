import ChaptersList from "@/components/ChaptersList";
import ChaptersVolumeBar from "@/components/ChaptersVolumeBar";
import { getActiveVolume, lifeChapters } from "@/lib/mock-data";

export default function ChaptersPage() {
  const activeVolume = getActiveVolume();
  const chapters = lifeChapters.filter(
    (c) => c.volumeId === activeVolume.id,
  );

  return (
    <div className="space-y-4">
      <header className="text-center pt-1">
        <h1 className="diary-page-title">100 件生活章节</h1>
        <p className="font-display text-[14px] text-diary-orange-d mt-2">
          第一卷 · 二人世界
        </p>
        <p className="text-[13px] text-diary-ink-soft mt-1.5 leading-relaxed">
          一天一页，慢慢写完这一卷。
        </p>
      </header>

      <ChaptersVolumeBar />

      <ChaptersList chapters={chapters} />
    </div>
  );
}
