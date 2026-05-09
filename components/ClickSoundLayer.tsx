"use client";

// Global click-bubble listener. Attached to `document` so it covers every
// `<button>` in the app — DiaryButton, PixelButton, native buttons,
// dynamically-rendered buttons inside dialogs, the music + refresh pills,
// etc. — without requiring each component to opt in.
//
// Disabled / aria-disabled buttons stay silent because the click event is
// suppressed by the browser anyway, and we additionally bail on
// aria-disabled="true" since some custom buttons don't use the disabled
// attribute.

import { useEffect } from "react";
import { playClickBubble } from "@/lib/click-sound";

export default function ClickSoundLayer() {
  useEffect(() => {
    function onClick(e: MouseEvent) {
      const target = e.target;
      if (!(target instanceof Element)) return;
      const button = target.closest("button");
      if (!button) return;
      if (
        button.hasAttribute("disabled") ||
        button.getAttribute("aria-disabled") === "true"
      ) {
        return;
      }
      playClickBubble();
    }
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  return null;
}
