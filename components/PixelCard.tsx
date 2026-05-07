import type { ReactNode } from "react";

type Variant = "default" | "orange" | "ghost" | "navy";

type Props = {
  children: ReactNode;
  variant?: Variant;
  className?: string;
};

const variantClasses: Record<Variant, string> = {
  default: "bg-white border-navy text-navy shadow-pixel",
  orange: "bg-cream border-warm-orange text-navy shadow-pixel-orange",
  ghost: "bg-cream border-navy text-navy shadow-pixel-sm",
  navy: "bg-navy border-navy text-cream shadow-pixel",
};

export default function PixelCard({
  children,
  variant = "default",
  className = "",
}: Props) {
  return (
    <div
      className={`border-3 p-4 ${variantClasses[variant]} ${className}`}
    >
      {children}
    </div>
  );
}
