"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Pause, Play, RotateCcw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import { vibrate } from "@/lib/haptics";
import { cn } from "@/lib/utils";

const PRESETS = [60, 90, 120];
const DEFAULT = 90;

function fmt(secs: number) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function RestTimer({
  onClose,
  autoStartSignal = 0,
}: {
  onClose: () => void;
  /** Increment to auto-start a fresh countdown (e.g. when a set is checked). */
  autoStartSignal?: number;
}) {
  const { autoRestTimer, setAutoRestTimer } = useStore();
  const [duration, setDuration] = useState(DEFAULT);
  const [remaining, setRemaining] = useState(DEFAULT);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);

  // Target end time (ms). Remaining is always derived from this so the timer
  // stays accurate even if the tab is backgrounded and intervals are throttled.
  const endAtRef = useRef<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const finish = useCallback(() => {
    vibrate([200, 100, 200]);
    try {
      const Ctx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      const ctx = new Ctx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = 880;
      osc.connect(gain);
      gain.connect(ctx.destination);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
      osc.onended = () => ctx.close();
    } catch {
      /* audio unavailable */
    }
  }, []);

  // Run a single interval while active; derive remaining from the end time.
  useEffect(() => {
    if (!running) return;
    const tick = () => {
      const end = endAtRef.current;
      if (end == null) return;
      const left = Math.max(0, Math.round((end - Date.now()) / 1000));
      setRemaining(left);
      if (left <= 0) {
        setRunning(false);
        setDone(true);
        endAtRef.current = null;
        finish();
      }
    };
    tick();
    intervalRef.current = setInterval(tick, 250);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = null;
    };
  }, [running, finish]);

  const start = () => {
    const base = done || remaining <= 0 ? duration : remaining;
    if (done || remaining <= 0) setDone(false);
    setRemaining(base);
    endAtRef.current = Date.now() + base * 1000;
    setRunning(true);
  };

  // Auto-start a fresh countdown when the signal increments (e.g. set checked).
  useEffect(() => {
    if (autoStartSignal <= 0) return;
    setDone(false);
    setRemaining(duration);
    endAtRef.current = Date.now() + duration * 1000;
    setRunning(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStartSignal]);
  const pause = () => {
    setRunning(false);
    endAtRef.current = null;
  };
  const reset = () => {
    setRunning(false);
    setDone(false);
    endAtRef.current = null;
    setRemaining(duration);
  };
  const pickPreset = (secs: number) => {
    setDuration(secs);
    setRemaining(secs);
    setRunning(false);
    setDone(false);
    endAtRef.current = null;
  };

  const pct = duration > 0 ? (remaining / duration) * 100 : 0;

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-lg">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-stone-500">
          Rest timer
        </span>
        <button
          onClick={onClose}
          aria-label="Close rest timer"
          className="-m-1 flex h-9 w-9 items-center justify-center rounded-md text-stone-400 hover:bg-stone-100 hover:text-stone-700"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div
        className={cn(
          "text-center text-4xl font-semibold tabular-nums tracking-tight",
          done ? "text-emerald-600" : "text-stone-900",
        )}
        aria-live="polite"
      >
        {done ? "Rest done" : fmt(remaining)}
      </div>

      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-stone-100">
        <div
          className="h-full rounded-full bg-emerald-500 transition-[width] duration-300 ease-linear"
          style={{ width: `${done ? 100 : pct}%` }}
        />
      </div>

      <div className="mt-3 flex justify-center gap-2">
        {PRESETS.map((p) => (
          <button
            key={p}
            onClick={() => pickPreset(p)}
            className={cn(
              "h-9 rounded-lg px-3 text-xs font-medium transition-colors",
              duration === p
                ? "bg-emerald-50 text-emerald-700"
                : "bg-stone-100 text-stone-500 hover:text-stone-900",
            )}
          >
            {p}s
          </button>
        ))}
      </div>

      <label className="mt-3 flex cursor-pointer items-center justify-center gap-2 text-xs text-muted-foreground">
        <input
          type="checkbox"
          checked={autoRestTimer}
          onChange={(e) => setAutoRestTimer(e.target.checked)}
          className="h-4 w-4 accent-emerald-500"
        />
        Auto-start when I check a set
      </label>

      <div className="mt-3 flex gap-2">
        {running ? (
          <Button onClick={pause} variant="outline" className="h-11 flex-1">
            <Pause className="h-4 w-4" /> Pause
          </Button>
        ) : (
          <Button
            onClick={start}
            className="h-11 flex-1 bg-emerald-600 text-white hover:bg-emerald-700"
          >
            <Play className="h-4 w-4" />{" "}
            {done || remaining <= 0 ? "Restart" : "Start"}
          </Button>
        )}
        <Button
          onClick={reset}
          variant="outline"
          className="h-11 w-11"
          aria-label="Reset"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
