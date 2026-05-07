"use client";

import { useState } from "react";

export type YangMascotSize = "sm" | "md" | "lg";

const dimensions: Record<YangMascotSize, number> = {
  sm: 32,
  md: 64,
  lg: 96,
};

const sources: Record<YangMascotSize, string> = {
  sm: "/brand/yang-mascot-small.png",
  md: "/brand/yang-mascot.png",
  lg: "/brand/yang-mascot.png",
};

type Props = {
  size?: YangMascotSize;
  className?: string;
};

export default function YangMascot({ size = "md", className = "" }: Props) {
  const [errored, setErrored] = useState(false);
  const px = dimensions[size];

  if (errored) {
    return <SvgFallback size={px} className={className} />;
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={sources[size]}
      alt="羽扬"
      width={px}
      height={px}
      className={`inline-block align-middle ${className}`}
      style={{ imageRendering: "pixelated" }}
      onError={() => setErrored(true)}
    />
  );
}

function SvgFallback({ size, className }: { size: number; className: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      shapeRendering="crispEdges"
      className={className}
      aria-label="羽扬"
      role="img"
    >
      <g fill="#1B2A4E">
        <rect x="5" y="2" width="6" height="1" />
        <rect x="4" y="3" width="1" height="1" />
        <rect x="11" y="3" width="1" height="1" />
        <rect x="3" y="4" width="1" height="6" />
        <rect x="12" y="4" width="1" height="6" />
        <rect x="4" y="10" width="1" height="1" />
        <rect x="11" y="10" width="1" height="1" />
        <rect x="5" y="11" width="6" height="1" />
        <rect x="6" y="12" width="1" height="2" />
        <rect x="9" y="12" width="1" height="2" />
      </g>
      <g fill="#FBF3E2">
        <rect x="5" y="3" width="6" height="7" />
      </g>
      <g fill="#1B2A4E">
        <rect x="6" y="5" width="1" height="1" />
        <rect x="9" y="5" width="1" height="1" />
        <rect x="7" y="7" width="2" height="1" />
      </g>
      <g fill="#E8743B">
        <rect x="2" y="6" width="1" height="3" />
        <rect x="13" y="6" width="1" height="3" />
        <rect x="7" y="8" width="2" height="1" />
      </g>
    </svg>
  );
}
