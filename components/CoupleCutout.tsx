type Props = {
  height?: number;
  className?: string;
};

export default function CoupleCutout({ height = 98, className = "" }: Props) {
  return (
    <div
      className={`relative ${className}`}
      style={{ height }}
      aria-hidden="true"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/brand/yangyang-cutout.png"
        alt=""
        style={{
          position: "absolute",
          bottom: 0,
          right: -2,
          height,
          width: "auto",
          imageRendering: "pixelated",
          filter: "drop-shadow(1px 2px 0 rgba(28,42,74,0.18))",
        }}
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/brand/xiaoyu-cutout.png"
        alt=""
        style={{
          position: "absolute",
          bottom: 0,
          right: 28,
          height,
          width: "auto",
          imageRendering: "pixelated",
          filter: "drop-shadow(1px 2px 0 rgba(28,42,74,0.18))",
        }}
      />
    </div>
  );
}
