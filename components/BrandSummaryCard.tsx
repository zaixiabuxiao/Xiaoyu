import DiaryCard from "./DiaryCard";
import CoupleCutout from "./CoupleCutout";

type Props = {
  daysMarried: number;
  daysUntilAnniversary: number;
};

export default function BrandSummaryCard({
  daysMarried,
  daysUntilAnniversary,
}: Props) {
  return (
    <DiaryCard className="overflow-hidden">
      <div
        className="grid items-stretch gap-2"
        style={{ gridTemplateColumns: "1fr 76px", minHeight: 100 }}
      >
        <div className="min-w-0 self-center">
          <p className="font-display text-[21px] leading-none tracking-wide text-navy whitespace-nowrap">
            小羽 <span className="text-diary-orange-d">&amp;</span> 扬扬
          </p>
          <div className="dash-h my-1.5" />
          <p className="flex items-baseline gap-1.5 whitespace-nowrap">
            <span className="font-display text-[15px] text-navy">婚后第</span>
            <span className="font-pixel text-[18px] text-diary-orange-d">
              {daysMarried}
            </span>
            <span className="font-display text-[15px] text-navy">天</span>
          </p>
          <p className="text-[12px] text-diary-ink-soft mt-1 whitespace-nowrap">
            距下次纪念日{" "}
            <span className="font-pixel text-[10px] text-diary-orange-d">
              {daysUntilAnniversary}
            </span>{" "}
            天
          </p>
        </div>
        <CoupleCutout height={98} className="self-end" />
      </div>

      <p className="diary-quote-box mt-3 text-[15px]">
        让平凡的日子，
        <br />
        也长出被记住的羽毛。
      </p>
    </DiaryCard>
  );
}
