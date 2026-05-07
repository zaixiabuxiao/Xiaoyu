import PageHeader from "@/components/PageHeader";

export default function ChaptersPage() {
  return (
    <div className="space-y-4">
      <PageHeader title="章节" subtitle="CHAPTERS" />

      <section className="pixel-card">
        <p className="text-xl">把日子分成一段段的故事。</p>
      </section>

      <ul className="space-y-3">
        {["序章", "第一章", "第二章"].map((name) => (
          <li key={name} className="pixel-card flex items-center justify-between">
            <span className="font-pixel text-xs">{name}</span>
            <span className="text-lg text-warm-orange">▶</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
