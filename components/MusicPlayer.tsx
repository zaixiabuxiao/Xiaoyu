"use client";

import { useState } from "react";
import { useAppMusic } from "./AppMusic";

export default function MusicPlayer() {
  const music = useAppMusic();
  const [open, setOpen] = useState(false);

  if (!music.hydrated) return null;

  // Compact floating control above the bottom nav, respecting iPhone
  // safe-area. The button is a single tap target when collapsed, and expands
  // into a small panel with all controls when tapped.
  return (
    <div
      className="fixed right-3 z-40"
      style={{ bottom: "calc(5.25rem + env(safe-area-inset-bottom))" }}
    >
      {open ? (
        <div className="bg-cream border-2 border-navy rounded-md shadow-md p-2 w-[180px]">
          <div className="flex items-center justify-between mb-1">
            <span className="font-pixel text-[9px] tracking-widest text-warm-orange">
              MUSIC
            </span>
            <button
              type="button"
              aria-label="收起音乐控制"
              className="font-pixel text-[10px] text-navy/70 px-1"
              onClick={() => setOpen(false)}
            >
              ×
            </button>
          </div>

          {music.filesMissing ? (
            <p className="text-[12px] text-diary-ink-soft leading-relaxed">
              音乐文件还没有放好。
            </p>
          ) : (
            <>
              <p className="font-display text-[14px] text-navy leading-snug">
                {music.currentTrack.displayName}
              </p>
              {music.needsGesture && music.enabled && !music.isPlaying ? (
                <p className="text-[11px] text-warm-orange leading-relaxed mt-1">
                  点一下播放音乐
                </p>
              ) : null}
              <div className="mt-2 flex flex-wrap gap-1">
                {music.enabled ? (
                  <Btn onClick={music.togglePlay}>
                    {music.isPlaying ? "暂停" : "继续"}
                  </Btn>
                ) : null}
                <Btn onClick={music.next} disabled={!music.enabled}>
                  换一首
                </Btn>
                <Btn
                  onClick={() => music.setEnabled(!music.enabled)}
                >
                  {music.enabled ? "音乐关" : "音乐开"}
                </Btn>
              </div>
            </>
          )}
        </div>
      ) : (
        <button
          type="button"
          aria-label="打开音乐控制"
          onClick={() => setOpen(true)}
          className="bg-cream border-2 border-navy rounded-full px-3 py-1 shadow font-pixel text-[10px] text-navy"
        >
          {music.filesMissing
            ? "♪ —"
            : music.enabled
              ? music.isPlaying
                ? "♪ 在放"
                : music.needsGesture
                  ? "♪ 点开"
                  : "♪ 已停"
              : "♪ 关"}
        </button>
      )}
    </div>
  );
}

function Btn({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="font-pixel text-[10px] text-navy border-2 border-navy bg-white px-2 py-0.5 disabled:opacity-40"
    >
      {children}
    </button>
  );
}
