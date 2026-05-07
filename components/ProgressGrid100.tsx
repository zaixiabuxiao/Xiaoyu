type Props = {
  total?: number;
  completed: number;
  planning?: number;
  className?: string;
};

export default function ProgressGrid100({
  total = 100,
  completed,
  planning = 0,
  className = "",
}: Props) {
  const cells = Array.from({ length: total }, (_, i) => {
    if (i < completed) return "completed" as const;
    if (i < completed + planning) return "planning" as const;
    return "empty" as const;
  });

  return (
    <div className={className}>
      <div className="grid grid-cols-10 gap-[3px]">
        {cells.map((kind, i) => (
          <span
            key={i}
            className={
              kind === "completed"
                ? "aspect-square bg-warm-orange border border-navy"
                : kind === "planning"
                  ? "aspect-square bg-warm-orange-soft border border-navy"
                  : "aspect-square bg-cream border border-navy/40"
            }
          />
        ))}
      </div>
      <div className="mt-3 flex items-center justify-between text-[11px] font-pixel">
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 bg-warm-orange border border-navy" />
          已记录
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 bg-warm-orange-soft border border-navy" />
          计划中
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 bg-cream border border-navy/60" />
          待开启
        </span>
      </div>
    </div>
  );
}
