"use client";

import { useState } from "react";
import type { TodayMode } from "@/lib/mock-data";

const modes: { value: TodayMode; glyph: string }[] = [
  { value: "今天想宅家", glyph: "♨" },
  { value: "今天想出去走走", glyph: "✦" },
  { value: "今天想认真聊聊", glyph: "✎" },
  { value: "今天有点累", glyph: "☾" },
];

type Props = {
  initial?: TodayMode;
};

export default function TodayModeSelector({ initial }: Props) {
  const [selected, setSelected] = useState<TodayMode | undefined>(initial);

  return (
    <div className="grid grid-cols-2 gap-2">
      {modes.map((m) => {
        const active = selected === m.value;
        return (
          <button
            key={m.value}
            type="button"
            onClick={() => setSelected(m.value)}
            className={`border-3 px-3 py-3 text-left font-pixel text-[11px] leading-snug transition-transform active:translate-x-[1px] active:translate-y-[1px] ${
              active
                ? "bg-navy text-cream border-navy shadow-pixel-sm"
                : "bg-white text-navy border-navy shadow-pixel-sm hover:bg-cream"
            }`}
          >
            <span className="block text-warm-orange text-sm mb-1">
              {m.glyph}
            </span>
            {m.value}
          </button>
        );
      })}
    </div>
  );
}
