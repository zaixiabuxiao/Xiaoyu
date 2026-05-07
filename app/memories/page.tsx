import PixelHeader from "@/components/PixelHeader";
import MemoriesView from "@/components/MemoriesView";
import { getCompletedChapters } from "@/lib/mock-data";

export default function MemoriesPage() {
  const completed = getCompletedChapters();

  return (
    <div className="space-y-5">
      <PixelHeader
        eyebrow="MEMORIES"
        title="我们的回忆"
        subtitle="一段段被认真留下来的日子。"
      />

      <MemoriesView mockMemories={completed} />
    </div>
  );
}
