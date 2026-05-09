// Synthesized "bubble" click sound for every button in the app.
//
// We deliberately avoid loading an asset file — the sound is generated on
// the fly with the Web Audio API so it works without any additional public/
// files and stays tiny. Each invocation creates a brief upward pitch sweep
// with a fast attack/decay envelope; together they read as a soft pop.
//
// AudioContext requires a user gesture to start, so the first call inside a
// click handler resumes the suspended context. Subsequent calls are
// instantaneous.

let ctx: AudioContext | null = null;

function getAudioContextCtor(): typeof AudioContext | undefined {
  if (typeof window === "undefined") return undefined;
  return (
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext
  );
}

function ensureCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const Ctor = getAudioContextCtor();
    if (!Ctor) return null;
    try {
      ctx = new Ctor();
    } catch {
      return null;
    }
  }
  if (ctx.state === "suspended") {
    void ctx.resume();
  }
  return ctx;
}

/**
 * Play a single bubble-style click pop. Safe to call repeatedly. Silently
 * no-ops when the browser has no Web Audio support or the context cannot be
 * resumed (e.g. the call site is not inside a user gesture on iOS).
 */
export function playClickBubble(): void {
  const audio = ensureCtx();
  if (!audio) return;
  try {
    const now = audio.currentTime;
    const osc = audio.createOscillator();
    const gain = audio.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(380, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.07);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.18, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);

    osc.connect(gain).connect(audio.destination);
    osc.start(now);
    osc.stop(now + 0.13);
  } catch {
    /* audio is non-critical — never throw out of a click handler */
  }
}
