import PageHeader from "@/components/PageHeader";

export default function HomePage() {
  return (
    <div className="space-y-4">
      <PageHeader title="今天" subtitle="HOME" />

      <section className="pixel-card">
        <h2 className="font-pixel text-sm mb-2">欢迎回来</h2>
        <p className="text-xl leading-snug">
          这里是我们的小本子。{"\n"}
          慢慢写，慢慢看。
        </p>
      </section>

      <div className="pixel-divider" />

      <section className="pixel-card-orange">
        <h3 className="font-pixel text-xs mb-2">今日提示</h3>
        <p className="text-xl">写一句话，关于今天的天气。</p>
      </section>
    </div>
  );
}
