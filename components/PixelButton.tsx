import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "ghost" | "soft";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: Variant;
  active?: boolean;
};

const base =
  "inline-flex items-center justify-center px-4 py-2 min-h-[44px] border-3 font-pixel text-[10px] tracking-wide select-none transition-transform active:translate-x-[2px] active:translate-y-[2px]";

const styles: Record<Variant, string> = {
  primary:
    "bg-warm-orange text-cream border-navy shadow-pixel hover:brightness-105",
  ghost:
    "bg-cream text-navy border-navy shadow-pixel-sm hover:bg-white",
  soft:
    "bg-warm-orange-soft text-navy border-navy shadow-pixel-sm hover:brightness-105",
};

export default function PixelButton({
  children,
  variant = "primary",
  active,
  className = "",
  ...rest
}: Props) {
  const variantClass = active
    ? "bg-navy text-cream border-navy shadow-pixel-sm"
    : styles[variant];
  return (
    <button className={`${base} ${variantClass} ${className}`} {...rest}>
      {children}
    </button>
  );
}
