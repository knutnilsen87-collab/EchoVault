"use client";

import * as React from "react";

type PlayerTrack = { id: string; title: string; artist: string; src: string };

type PlayerContext = {
  current: PlayerTrack | null;
  playing: boolean;
  play(track: PlayerTrack): void;
  toggle(): void;
};

const Ctx = React.createContext<PlayerContext | null>(null);

export function usePlayer() {
  const ctx = React.useContext(Ctx);
  if (!ctx) throw new Error("usePlayer outside PlayerProvider");
  return ctx;
}

const fmt = (s: number) => (Number.isFinite(s) ? `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}` : "0:00");

/**
 * One audio element for the whole session (Audio_Player_UX: persists while browsing, no autoplay).
 * Plays only the compressed preview — the high-res WAV is never reachable from here.
 */
export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const audio = React.useRef<HTMLAudioElement | null>(null);
  const [current, setCurrent] = React.useState<PlayerTrack | null>(null);
  const [state, setState] = React.useState<"idle" | "loading" | "playing" | "paused" | "error">("idle");
  const [time, setTime] = React.useState(0);
  const [length, setLength] = React.useState(0);
  const [volume, setVolume] = React.useState(0.9);
  const [muted, setMuted] = React.useState(false);

  const play = React.useCallback((track: PlayerTrack) => {
    const el = audio.current;
    if (!el) return;
    if (current?.id === track.id) {
      if (el.paused) void el.play().catch(() => setState("error"));
      else el.pause();
      return;
    }
    setCurrent(track);
    setState("loading");
    el.src = track.src;
    void el.play().catch(() => setState("error"));
  }, [current]);

  const toggle = React.useCallback(() => {
    const el = audio.current;
    if (!el || !current) return;
    if (el.paused) void el.play().catch(() => setState("error"));
    else el.pause();
  }, [current]);

  React.useEffect(() => {
    if (audio.current) {
      audio.current.volume = volume;
      audio.current.muted = muted;
    }
  }, [volume, muted]);

  const value = React.useMemo(() => ({ current, playing: state === "playing", play, toggle }), [current, state, play, toggle]);

  return (
    <Ctx.Provider value={value}>
      {children}
      <audio
        ref={audio}
        preload="none"
        onPlaying={() => setState("playing")}
        onPause={() => setState("paused")}
        onWaiting={() => setState("loading")}
        onError={() => current && setState("error")}
        onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setLength(e.currentTarget.duration)}
        onEnded={() => setState("paused")}
      />
      {current ? (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-echo-border bg-echo-surface/85 backdrop-blur-glass">
          <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
            <button
              onClick={toggle}
              aria-label={state === "playing" ? "Pause preview" : "Play preview"}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/30 text-white hover:border-white"
            >
              {state === "playing" ? "❚❚" : "▶"}
            </button>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-2">
                <p className="truncate text-sm font-medium">
                  {current.title} <span className="text-echo-muted">— {current.artist}</span>
                </p>
                <p className="shrink-0 font-mono text-xs text-echo-muted" aria-live="off">
                  {state === "error" ? "PREVIEW_ERROR" : state === "loading" ? "LOADING" : `${fmt(time)} / ${fmt(length)}`}
                </p>
              </div>
              <input
                type="range"
                min={0}
                max={length || 0}
                step={0.1}
                value={time}
                onChange={(e) => {
                  if (audio.current) audio.current.currentTime = Number(e.target.value);
                }}
                aria-label="Seek"
                aria-valuetext={`${fmt(time)} of ${fmt(length)}`}
                className="mt-1 h-1 w-full accent-white"
              />
            </div>
            <button onClick={() => setMuted((m) => !m)} aria-label={muted ? "Unmute" : "Mute"} className="font-mono text-xs text-echo-muted hover:text-white">
              {muted ? "MUTED" : "VOL"}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              aria-label="Volume"
              className="hidden h-1 w-24 accent-white sm:block"
            />
          </div>
        </div>
      ) : null}
    </Ctx.Provider>
  );
}

export function PlayButton({ track, disabled }: { track: PlayerTrack; disabled?: boolean }) {
  const { current, playing, play } = usePlayer();
  const active = current?.id === track.id && playing;
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => play(track)}
      aria-label={disabled ? "Preview unavailable" : active ? `Pause ${track.title}` : `Play preview of ${track.title}`}
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-echo-border text-sm text-white transition hover:border-white/60 disabled:opacity-30"
    >
      {active ? "❚❚" : "▶"}
    </button>
  );
}
