import DiaryCard from "./DiaryCard";

type Props = {
  volumeNumber: number;
  volumeTitle: string;
  completed: number;
  total: number;
};

export default function VolumeProgressCard({
  volumeNumber,
  volumeTitle,
  completed,
  total,
}: Props) {
  const percent = Math.min(100, Math.max(0, (completed / total) * 100));
  const numberCN = volumeNumber === 1 ? "一" : volumeNumber === 2 ? "二" : "三";
  return (
    <DiaryCard>
      <div className="flex items-center gap-3">
        <div
          className="flex flex-col items-center justify-center text-cream font-pixel border-2 border-navy rounded-sm shrink-0"
          style={{
            width: 40,
            height: 44,
            background: "#3A4778",
            boxShadow:
              "inset 0 -3px 0 0 #1B2A4E, inset 0 2px 0 0 #5D72A8",
          }}
        >
          <span className="text-[8px] leading-none">VOL</span>
          <span className="text-[14px] leading-none mt-1 text-gold">
            {volumeNumber}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-display text-[17px] leading-tight text-navy">
            第{numberCN}卷 · {volumeTitle}
          </p>
          <p className="text-[12px] text-diary-ink-soft mt-0.5">
            我们已经写下{" "}
            <span className="font-pixel text-[11px] text-diary-orange-d">
              {completed}
            </span>
            <span className="text-diary-ink-soft"> / </span>
            <span className="font-pixel text-[11px] text-navy">{total}</span>{" "}
            页。
          </p>
          <div className="diary-pbar mt-2">
            <span style={{ width: `${percent}%` }} />
          </div>
        </div>
      </div>
    </DiaryCard>
  );
}
