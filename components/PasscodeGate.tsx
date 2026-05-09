"use client";

// Soft private gate for the MVP. This is NOT real authentication — anyone with
// access to the device can read the passcode constant in the bundle. The
// unlocked state lives only in React memory for the current running session,
// so a page reload, a browser-tab reopen, or a PWA cold start re-locks the
// app. When we add a real backend, this component should become a thin
// wrapper around server-side session/auth instead.

import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
  type ReactNode,
} from "react";
import YangMascot from "./YangMascot";
import DiaryButton from "./DiaryButton";
import { PixelHeart } from "./PixelIcons";
import { useAppMusic } from "./AppMusic";

const PASSCODE = "0515";
const DOOR_DURATION_MS = 1100;
const WRONG_PASSCODE_ERROR = "不是这一把钥匙。\n再试一次。";

type GateState = "locked" | "transitioning" | "unlocked";

type Props = {
  children: ReactNode;
};

export default function PasscodeGate({ children }: Props) {
  const [state, setState] = useState<GateState>("locked");
  const music = useAppMusic();

  function handleUnlocked() {
    setState("transitioning");
    window.setTimeout(() => {
      setState("unlocked");
      music.requestPlay();
    }, DOOR_DURATION_MS);
  }

  if (state === "unlocked") {
    return <>{children}</>;
  }

  return (
    <div
      className="fixed inset-0 z-50 overflow-hidden bg-cream"
      role="dialog"
      aria-modal="true"
      aria-label="羽扬日记 · 私密日记"
    >
      {state === "locked" ? (
        <PasscodeForm onUnlocked={handleUnlocked} />
      ) : (
        <DoorOpenAnimation />
      )}
    </div>
  );
}

function PasscodeForm({ onUnlocked }: { onUnlocked: () => void }) {
  const [digits, setDigits] = useState("");
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const next = e.target.value.replace(/\D/g, "").slice(0, 4);
    setDigits(next);
    if (error) setError(null);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (digits === PASSCODE) {
      onUnlocked();
      return;
    }
    setError(WRONG_PASSCODE_ERROR);
    setDigits("");
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  function handleBoxesClick() {
    inputRef.current?.focus();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="min-h-full flex flex-col items-center justify-center px-6 pt-[max(2rem,env(safe-area-inset-top))] pb-[max(2rem,env(safe-area-inset-bottom))]"
    >
      <div className="text-center mb-7">
        <YangMascot size="md" />
        <h1 className="diary-page-title mt-4">羽扬日记</h1>
        <p className="text-[14px] text-diary-ink-soft mt-2 leading-relaxed">
          这本日记，只给小羽和扬扬打开。
        </p>
      </div>

      <div className="w-full max-w-[280px] flex flex-col items-center">
        <input
          ref={inputRef}
          type="tel"
          inputMode="numeric"
          autoComplete="off"
          pattern="[0-9]*"
          maxLength={4}
          value={digits}
          onChange={handleChange}
          aria-label="四位数钥匙"
          className="absolute w-px h-px opacity-0 -z-10 pointer-events-none"
        />

        <button
          type="button"
          onClick={handleBoxesClick}
          aria-label="输入钥匙"
          className="w-full grid grid-cols-4 gap-3"
        >
          {Array.from({ length: 4 }, (_, i) => {
            const filled = digits.length > i;
            return (
              <span
                key={i}
                aria-hidden="true"
                className={`aspect-square grid place-items-center border-3 transition-colors ${
                  filled
                    ? "border-navy bg-cream"
                    : "border-navy/40 bg-white"
                }`}
              >
                {filled ? (
                  <PixelHeart size={26} color="#EE6F7E" shadow="#D04A5B" />
                ) : null}
              </span>
            );
          })}
        </button>

        <div className="mt-6 w-full">
          <DiaryButton
            type="submit"
            disabled={digits.length !== 4}
            className="w-full"
          >
            打开日记
          </DiaryButton>
        </div>

        <p
          className="font-pixel text-[10px] text-warm-orange whitespace-pre-line leading-relaxed mt-4 text-center min-h-[2.4em]"
          aria-live="polite"
        >
          {error ?? ""}
        </p>
      </div>
    </form>
  );
}

function DoorOpenAnimation() {
  return (
    <div className="absolute inset-0 overflow-hidden bg-cream">
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6 diary-door-text">
        <p className="font-display text-[22px] text-navy">门开了。</p>
        <p className="text-[14px] text-diary-ink-soft mt-1">
          欢迎回到我们的日记。
        </p>
      </div>
      <div
        className="diary-door-left absolute top-0 bottom-0 left-0 w-1/2 bg-warm-orange border-r-2 border-navy flex items-center justify-end pr-4"
        style={{
          boxShadow: "inset -8px 0 0 0 rgba(28,42,74,0.10)",
        }}
        aria-hidden="true"
      >
        <PixelHeart size={28} color="#FBF3E2" shadow="#C66A2F" />
      </div>
      <div
        className="diary-door-right absolute top-0 bottom-0 right-0 w-1/2 bg-warm-orange border-l-2 border-navy flex items-center justify-start pl-4"
        style={{
          boxShadow: "inset 8px 0 0 0 rgba(28,42,74,0.10)",
        }}
        aria-hidden="true"
      >
        <PixelHeart size={28} color="#FBF3E2" shadow="#C66A2F" />
      </div>
    </div>
  );
}
