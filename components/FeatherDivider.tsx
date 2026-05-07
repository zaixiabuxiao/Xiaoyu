type Props = {
  className?: string;
};

export default function FeatherDivider({ className = "" }: Props) {
  return (
    <div
      className={`flex items-center gap-2 text-warm-orange ${className}`}
      aria-hidden="true"
    >
      <span className="flex-1 pixel-divider" />
      <svg
        viewBox="0 0 16 16"
        className="h-4 w-4 shrink-0"
        shapeRendering="crispEdges"
      >
        <g fill="currentColor">
          <rect x="7" y="1" width="2" height="2" />
          <rect x="6" y="3" width="4" height="2" />
          <rect x="5" y="5" width="6" height="2" />
          <rect x="4" y="7" width="8" height="2" />
          <rect x="5" y="9" width="6" height="2" />
          <rect x="7" y="11" width="2" height="4" />
        </g>
      </svg>
      <span className="flex-1 pixel-divider" />
    </div>
  );
}
