import PageHeader from "@/components/PageHeader";

export default function UsPage() {
  return (
    <div className="space-y-4">
      <PageHeader title="我们" subtitle="US" />

      <section className="pixel-card">
        <h2 className="font-pixel text-sm mb-2">羽 & 扬</h2>
        <p className="text-xl">
          一本只属于我们两个人的日记。
        </p>
      </section>

      <section className="pixel-card-orange">
        <h3 className="font-pixel text-xs mb-2">设置</h3>
        <p className="text-xl">主题、字体、备份 —— 之后再来这里调。</p>
      </section>
    </div>
  );
}
