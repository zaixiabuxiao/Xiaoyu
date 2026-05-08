import type { ReactNode } from "react";

type Variant = "default" | "soft";

type Props = {
  children: ReactNode;
  variant?: Variant;
  className?: string;
};

export default function DiaryCard({
  children,
  variant = "default",
  className = "",
}: Props) {
  const base = variant === "soft" ? "diary-card-soft" : "diary-card";
  return (
    <div className={`${base} ${className}`}>
      <span className="absolute -top-[2px] -left-[2px] w-[6px] h-[6px] bg-navy" />
      <span className="absolute -top-[2px] -right-[2px] w-[6px] h-[6px] bg-navy" />
      <span className="absolute -bottom-[2px] -left-[2px] w-[6px] h-[6px] bg-navy" />
      <span className="absolute -bottom-[2px] -right-[2px] w-[6px] h-[6px] bg-navy" />
      {children}
    </div>
  );
}
