type IconProps = {
  size?: number;
  className?: string;
};

export function PixelHeart({
  size = 14,
  color = "#EE6F7E",
  shadow = "#D04A5B",
  className = "",
}: IconProps & { color?: string; shadow?: string }) {
  return (
    <svg
      width={size}
      height={size * (6 / 7)}
      viewBox="0 0 7 6"
      shapeRendering="crispEdges"
      className={`inline-block align-middle ${className}`}
      aria-hidden="true"
    >
      <rect x="1" y="0" width="2" height="1" fill={color} />
      <rect x="4" y="0" width="2" height="1" fill={color} />
      <rect x="0" y="1" width="7" height="2" fill={color} />
      <rect x="1" y="3" width="5" height="1" fill={color} />
      <rect x="2" y="4" width="3" height="1" fill={color} />
      <rect x="3" y="5" width="1" height="1" fill={color} />
      <rect x="6" y="1" width="1" height="1" fill={shadow} />
      <rect x="5" y="2" width="2" height="1" fill={shadow} />
      <rect x="4" y="3" width="2" height="1" fill={shadow} />
      <rect x="3" y="4" width="2" height="1" fill={shadow} />
      <rect x="3" y="5" width="1" height="1" fill={shadow} />
      <rect x="2" y="1" width="1" height="1" fill="#FFD1D6" />
    </svg>
  );
}

export function PixelPin({
  size = 14,
  color = "#E8743B",
  className = "",
}: IconProps & { color?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 7 7"
      shapeRendering="crispEdges"
      className={`inline-block align-middle ${className}`}
      aria-hidden="true"
    >
      <rect x="2" y="0" width="3" height="1" fill="#1B2A4E" />
      <rect x="1" y="1" width="5" height="1" fill="#1B2A4E" />
      <rect x="1" y="1" width="5" height="3" fill={color} />
      <rect x="2" y="2" width="3" height="2" fill="#FFF5DC" />
      <rect x="3" y="2" width="1" height="1" fill={color} />
      <rect x="0" y="2" width="1" height="2" fill="#1B2A4E" />
      <rect x="6" y="2" width="1" height="2" fill="#1B2A4E" />
      <rect x="1" y="4" width="5" height="1" fill="#1B2A4E" />
      <rect x="2" y="5" width="3" height="1" fill="#1B2A4E" />
      <rect x="3" y="6" width="1" height="1" fill="#1B2A4E" />
    </svg>
  );
}

export function PixelCalendar({
  size = 14,
  accent = "#E8743B",
  className = "",
}: IconProps & { accent?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 10 10"
      shapeRendering="crispEdges"
      className={`inline-block align-middle ${className}`}
      aria-hidden="true"
    >
      <rect x="0" y="2" width="10" height="8" fill="#1B2A4E" />
      <rect x="1" y="3" width="8" height="6" fill="#FFF5DC" />
      <rect x="0" y="2" width="10" height="2" fill={accent} />
      <rect x="2" y="0" width="1" height="3" fill="#1B2A4E" />
      <rect x="7" y="0" width="1" height="3" fill="#1B2A4E" />
      <rect x="3" y="5" width="4" height="3" fill={accent} />
    </svg>
  );
}

export function Sparkle({
  size = 8,
  color = "#F0C451",
  className = "",
}: IconProps & { color?: string }) {
  return (
    <span
      className={`inline-block align-middle ${className}`}
      style={{
        width: size,
        height: size,
        background: color,
        clipPath:
          "polygon(50% 0, 60% 40%, 100% 50%, 60% 60%, 50% 100%, 40% 60%, 0 50%, 40% 40%)",
      }}
      aria-hidden="true"
    />
  );
}

export function PixelTriangle({
  size = 8,
  color = "#EE6F7E",
  className = "",
}: IconProps & { color?: string }) {
  return (
    <span
      className={`inline-block align-middle ${className}`}
      style={{
        width: 0,
        height: 0,
        borderLeft: `${size}px solid transparent`,
        borderRight: `${size}px solid transparent`,
        borderTop: `${size}px solid ${color}`,
      }}
      aria-hidden="true"
    />
  );
}
