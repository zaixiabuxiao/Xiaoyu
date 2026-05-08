"use client";

import { useEffect, type ReactNode } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
};

export default function RecordChapterDialog({
  open,
  onClose,
  children,
}: Props) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handler);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-navy/40 px-3 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative bg-cream border-3 border-navy shadow-pixel max-w-md w-full max-h-[85dvh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="关闭"
          className="absolute top-2 right-2 z-20 w-9 h-9 grid place-items-center bg-cream border-2 border-navy text-navy hover:bg-warm-orange hover:text-cream transition-colors"
        >
          <span className="font-pixel text-base leading-none">×</span>
        </button>

        <div
          className="pt-2 pb-1 flex justify-center pointer-events-none"
          aria-hidden="true"
        >
          <span className="block w-10 h-1 bg-navy/25 rounded-sm" />
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain px-4 pb-0">
          {children}
        </div>
      </div>
    </div>
  );
}
