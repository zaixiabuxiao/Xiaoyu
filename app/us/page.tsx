import PixelHeader from "@/components/PixelHeader";
import PixelCard from "@/components/PixelCard";
import FeatherDivider from "@/components/FeatherDivider";
import YangMascot from "@/components/YangMascot";
import LocalDataPanel from "@/components/LocalDataPanel";
import CloudAuthCard from "@/components/CloudAuthCardLazy";
import CloudMigrationCard from "@/components/CloudMigrationCardLazy";
import VolumeListSection from "@/components/VolumeListSection";
import ImportantDatesEditor from "@/components/ImportantDatesEditor";
import CloudCacheBanner from "@/components/CloudCacheBanner";

const lifestyle = [
  "平时喜欢宅家",
  "偶尔想出去走走",
  "喜欢旅行",
  "正在温柔地预备未来家庭",
];

const promises = [
  "睡前不带着情绪入睡。",
  "再忙也留十分钟好好说话。",
  "每周一次安静的小复盘。",
];

const futureNotes = [
  "希望我们一直愿意，先听对方说完。",
  "希望未来的家，进门是温的。",
  "希望我们慢慢变成更柔软的人。",
];

export default function UsPage() {
  return (
    <div className="space-y-5">
      <PixelHeader eyebrow="US" title="我们" />

      <PixelCard>
        <div className="flex items-center gap-3">
          <YangMascot size="md" />
          <div>
            <p className="font-pixel text-[10px] tracking-widest text-warm-orange">
              小羽 & 扬扬
            </p>
            <p className="font-pixel text-xs mt-1">羽 · 扬</p>
            <p className="text-lg mt-1">两个人，一本日记。</p>
          </div>
        </div>
      </PixelCard>

      <section>
        <h2 className="font-pixel text-xs mb-2">我们的日历</h2>
        <ImportantDatesEditor />
      </section>

      <section>
        <h2 className="font-pixel text-xs mb-2">生活倾向</h2>
        <PixelCard variant="orange">
          <ul className="space-y-1 text-lg">
            {lifestyle.map((line) => (
              <li key={line}>· {line}</li>
            ))}
          </ul>
        </PixelCard>
      </section>

      <section>
        <h2 className="font-pixel text-xs mb-2">我们的约定</h2>
        <PixelCard>
          <ul className="space-y-1 text-lg">
            {promises.map((line) => (
              <li key={line}>· {line}</li>
            ))}
          </ul>
        </PixelCard>
      </section>

      <section>
        <h2 className="font-pixel text-xs mb-2">给未来的我们</h2>
        <PixelCard variant="ghost">
          <ul className="space-y-2 text-lg italic">
            {futureNotes.map((line) => (
              <li key={line}>“{line}”</li>
            ))}
          </ul>
        </PixelCard>
      </section>

      <FeatherDivider />

      <section>
        <h2 className="font-pixel text-xs mb-2">本地数据</h2>
        <LocalDataPanel />
      </section>

      <CloudCacheBanner />

      <section>
        <h2 className="font-pixel text-xs mb-2">云端身份</h2>
        <CloudAuthCard />
      </section>

      <section>
        <h2 className="font-pixel text-xs mb-2">云端同步准备</h2>
        <CloudMigrationCard />
      </section>

      <section>
        <h2 className="font-pixel text-xs mb-2">添加到手机主屏幕</h2>
        <PixelCard variant="ghost">
          <p className="text-lg leading-snug">
            在 iPhone Safari 中打开后，点击分享按钮，选择「添加到主屏幕」，就可以像 App 一样使用。
          </p>
        </PixelCard>
      </section>

      <section>
        <h2 className="font-pixel text-xs mb-2">章节卷</h2>
        <VolumeListSection />
      </section>
    </div>
  );
}
