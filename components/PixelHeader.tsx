import type { ReactNode } from "react";
import YangMascot from "./YangMascot";
import FeatherDivider from "./FeatherDivider";

type Props = {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  showMascot?: boolean;
  rightSlot?: ReactNode;
};

export default function PixelHeader({
  title,
  subtitle,
  eyebrow,
  showMascot = false,
  rightSlot,
}: Props) {
  return (
    <header className="mb-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {eyebrow ? (
            <p className="font-pixel text-[10px] text-warm-orange tracking-[0.2em] uppercase">
              {eyebrow}
            </p>
          ) : null}
          <h1 className="font-pixel text-base mt-1 leading-snug break-words">
            {title}
          </h1>
          {subtitle ? (
            <p className="text-xl mt-2 leading-snug">{subtitle}</p>
          ) : null}
        </div>
        {showMascot ? <YangMascot size={56} /> : rightSlot}
      </div>
      <FeatherDivider className="mt-3" />
    </header>
  );
}
