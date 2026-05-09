"use client";

// Global music provider mounted above PasscodeGate so the same <audio> element
// survives unlock and stays alive across page navigations. Three tracks loop:
// 第一首 → 第二首 → 第三首 → 第一首…
//
// Browser autoplay rules
// ----------------------
// iOS Safari (and most mobile browsers) require a user gesture to start
// audio. The "打开日记" passcode submit IS a gesture, but `play()` is called
// inside a setTimeout after the door animation, which on iOS may have lost
// the gesture window. If `play()` rejects (NotAllowedError), we surface
// `needsGesture: true` so the floating MusicPlayer button can show a small
// "点一下播放音乐" fallback. The fallback button click is a fresh gesture and
// will succeed.
//
// Missing files
// -------------
// The MP3 paths are public/music/第一首.mp3 etc. If those files have not been
// added yet, the <audio> element's `error` event fires and we surface
// `filesMissing: true` so the player UI shows a gentle copy instead of
// crashing.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

const MUSIC_ENABLED_KEY = "yuyang_music_enabled_v1";
const MUSIC_TRACK_KEY = "yuyang_music_track_v1";

export type MusicTrack = {
  index: number;
  displayName: string;
  src: string;
};

export const MUSIC_TRACKS: MusicTrack[] = [
  {
    index: 0,
    displayName: "第一首",
    src: `/music/${encodeURIComponent("第一首")}.mp3`,
  },
  {
    index: 1,
    displayName: "第二首",
    src: `/music/${encodeURIComponent("第二首")}.mp3`,
  },
  {
    index: 2,
    displayName: "第三首",
    src: `/music/${encodeURIComponent("第三首")}.mp3`,
  },
];

type AppMusicContextValue = {
  enabled: boolean;
  isPlaying: boolean;
  trackIndex: number;
  currentTrack: MusicTrack;
  needsGesture: boolean;
  filesMissing: boolean;
  hydrated: boolean;
  requestPlay: () => void;
  togglePlay: () => void;
  next: () => void;
  setEnabled: (next: boolean) => void;
};

const AppMusicContext = createContext<AppMusicContextValue | null>(null);

function readEnabled(): boolean {
  if (typeof window === "undefined") return true;
  try {
    const raw = window.localStorage.getItem(MUSIC_ENABLED_KEY);
    if (raw === null) return true;
    return raw === "1";
  } catch {
    return true;
  }
}

function readTrackIndex(): number {
  if (typeof window === "undefined") return 0;
  try {
    const raw = window.localStorage.getItem(MUSIC_TRACK_KEY);
    if (raw === null) return 0;
    const parsed = Number.parseInt(raw, 10);
    if (!Number.isFinite(parsed)) return 0;
    if (parsed < 0 || parsed >= MUSIC_TRACKS.length) return 0;
    return parsed;
  } catch {
    return 0;
  }
}

function writeEnabled(value: boolean): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(MUSIC_ENABLED_KEY, value ? "1" : "0");
  } catch {
    /* ignore */
  }
}

function writeTrackIndex(value: number): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(MUSIC_TRACK_KEY, String(value));
  } catch {
    /* ignore */
  }
}

export function AppMusicProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [enabled, setEnabledState] = useState(true);
  const [trackIndex, setTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [needsGesture, setNeedsGesture] = useState(false);
  const [filesMissing, setFilesMissing] = useState(false);

  useEffect(() => {
    setEnabledState(readEnabled());
    setTrackIndex(readTrackIndex());
    setHydrated(true);
  }, []);

  const playCurrent = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio) return;
    try {
      await audio.play();
      setIsPlaying(true);
      setNeedsGesture(false);
    } catch {
      setIsPlaying(false);
      setNeedsGesture(true);
    }
  }, []);

  const requestPlay = useCallback(() => {
    if (!enabled) return;
    if (filesMissing) return;
    void playCurrent();
  }, [enabled, filesMissing, playCurrent]);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (filesMissing) return;
    if (audio.paused) {
      void playCurrent();
    } else {
      audio.pause();
      setIsPlaying(false);
    }
  }, [filesMissing, playCurrent]);

  const goToTrack = useCallback(
    (nextIndex: number) => {
      const safe =
        ((nextIndex % MUSIC_TRACKS.length) + MUSIC_TRACKS.length) %
        MUSIC_TRACKS.length;
      setTrackIndex(safe);
      writeTrackIndex(safe);
      setFilesMissing(false);
      setNeedsGesture(false);
    },
    [],
  );

  const next = useCallback(() => {
    goToTrack(trackIndex + 1);
  }, [goToTrack, trackIndex]);

  const setEnabled = useCallback(
    (nextEnabled: boolean) => {
      setEnabledState(nextEnabled);
      writeEnabled(nextEnabled);
      const audio = audioRef.current;
      if (!nextEnabled && audio && !audio.paused) {
        audio.pause();
        setIsPlaying(false);
      }
      if (nextEnabled && audioRef.current) {
        void playCurrent();
      }
    },
    [playCurrent],
  );

  // When trackIndex changes, swap src and (if currently enabled and playing
  // was active or user requested next) try to play the new track.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.src = MUSIC_TRACKS[trackIndex].src;
    audio.load();
    if (enabled && (isPlaying || needsGesture === false)) {
      // If we were already playing (track ended → next), continue.
      // If not currently playing, don't auto-start; the user will request it.
      if (isPlaying) {
        void playCurrent();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trackIndex]);

  const handleEnded = useCallback(() => {
    goToTrack(trackIndex + 1);
    // After the trackIndex effect swaps src, kick off play.
    // We schedule a microtask so the src has been swapped.
    queueMicrotask(() => {
      void playCurrent();
    });
  }, [goToTrack, playCurrent, trackIndex]);

  const handleError = useCallback(() => {
    setFilesMissing(true);
    setIsPlaying(false);
    setNeedsGesture(false);
  }, []);

  const handlePlay = useCallback(() => setIsPlaying(true), []);
  const handlePause = useCallback(() => setIsPlaying(false), []);

  const value = useMemo<AppMusicContextValue>(
    () => ({
      enabled,
      isPlaying,
      trackIndex,
      currentTrack: MUSIC_TRACKS[trackIndex],
      needsGesture,
      filesMissing,
      hydrated,
      requestPlay,
      togglePlay,
      next,
      setEnabled,
    }),
    [
      enabled,
      isPlaying,
      trackIndex,
      needsGesture,
      filesMissing,
      hydrated,
      requestPlay,
      togglePlay,
      next,
      setEnabled,
    ],
  );

  return (
    <AppMusicContext.Provider value={value}>
      <audio
        ref={audioRef}
        src={MUSIC_TRACKS[trackIndex].src}
        preload="none"
        onEnded={handleEnded}
        onError={handleError}
        onPlay={handlePlay}
        onPause={handlePause}
        aria-hidden="true"
      />
      {children}
    </AppMusicContext.Provider>
  );
}

export function useAppMusic(): AppMusicContextValue {
  const ctx = useContext(AppMusicContext);
  if (!ctx) {
    // Safe noop fallback so consumers (e.g. PasscodeGate during SSR) don't
    // crash if the provider hasn't mounted yet.
    return {
      enabled: false,
      isPlaying: false,
      trackIndex: 0,
      currentTrack: MUSIC_TRACKS[0],
      needsGesture: false,
      filesMissing: false,
      hydrated: false,
      requestPlay: () => {},
      togglePlay: () => {},
      next: () => {},
      setEnabled: () => {},
    };
  }
  return ctx;
}
