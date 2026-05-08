import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "default" | "small";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: Variant;
};

export default function DiaryButton({
  children,
  variant = "default",
  className = "",
  ...rest
}: Props) {
  const base = variant === "small" ? "diary-pbtn-small" : "diary-pbtn";
  return (
    <button className={`${base} ${className}`} {...rest}>
      {children}
    </button>
  );
}
