import PixelHeader from "@/components/PixelHeader";
import PixelCard from "@/components/PixelCard";
import FeatherDivider from "@/components/FeatherDivider";
import YangMascot from "@/components/YangMascot";
import LocalDataPanel from "@/components/LocalDataPanel";
import { chapterVolumes } from "@/lib/mock-data";

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
          <YangMascot size={56} />
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

      <section>
        <h2 className="font-pixel text-xs mb-2">章节卷</h2>
        <ul className="space-y-3">
          {chapterVolumes.map((vol) => {
            const numCN = vol.number === 1 ? "一" : vol.number === 2 ? "二" : "三";
            return (
              <li key={vol.id}>
                <PixelCard variant={vol.active ? "orange" : "default"}>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-pixel text-[10px] tracking-widest text-warm-orange">
                        VOL · {vol.number}
                      </p>
                      <p className="font-pixel text-xs mt-1">
                        第{numCN}卷：{vol.title}
                      </p>
                    </div>
                    <span
                      className={`font-pixel text-[10px] border-2 px-2 py-1 ${
                        vol.active
                          ? "bg-navy text-cream border-navy"
                          : "bg-cream text-navy border-navy"
                      }`}
                    >
                      {vol.active ? "进行中" : "未开启"}
                    </span>
                  </div>
                </PixelCard>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
