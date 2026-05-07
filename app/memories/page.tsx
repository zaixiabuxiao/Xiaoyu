import PageHeader from "@/components/PageHeader";

export default function MemoriesPage() {
  return (
    <div className="space-y-4">
      <PageHeader title="回忆" subtitle="MEMORIES" />

      <section className="pixel-card-orange">
        <p className="text-xl">那些值得反复翻阅的小瞬间。</p>
      </section>

      <div className="grid grid-cols-2 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="pixel-card aspect-square flex items-center justify-center"
          >
            <span className="font-pixel text-xs">#{i.toString().padStart(2, "0")}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
