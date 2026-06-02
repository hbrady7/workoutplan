"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Pause, Play, RotateCcw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const PRESETS = [60, 90, 120];
const DEFAULT = 90;

function fmt(secs: number) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function RestTimer({ onClose }: { onClose: () => void }) {
  const [duration, setDuration] = useState(DEFAULT);
  const [remaining, setRemaining] = useState(DEFAULT);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const finish = useCallback(() => {
    setRunning(false);
    setDone(true);
    // Vibrate (mobile) + short beep.
    try {
      navigator.vibrate?.([200, 100, 200]);
    } catch {
      /* not supported */
    }
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
      /* audio not available */
    }
  }, []);

  // Tick while running.
  useEffect(() => {
    if (!running) return;
    intervalRef.current = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          finish();
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running, finish]);

  const start = () => {
    if (remaining === 0 || done) {
      setRemaining(duration);
      setDone(false);
    }
    setRunning(true);
  };
  const pause = () => setRunning(false);
  const reset = () => {
    setRunning(false);
    setDone(false);
    setRemaining(duration);
  };
  const pickPreset = (secs: number) => {
    setDuration(secs);
    setRemaining(secs);
    setRunning(false);
    setDone(false);
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
          className="rounded-md p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-700"
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

      {/* progress bar */}
      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-stone-100">
        <div
          className="h-full rounded-full bg-emerald-500 transition-[width] duration-1000 ease-linear"
          style={{ width: `${done ? 100 : pct}%` }}
        />
      </div>

      <div className="mt-3 flex justify-center gap-2">
        {PRESETS.map((p) => (
          <button
            key={p}
            onClick={() => pickPreset(p)}
            className={cn(
              "rounded-lg px-3 py-1 text-xs font-medium transition-colors",
              duration === p
                ? "bg-emerald-50 text-emerald-700"
                : "bg-stone-100 text-stone-500 hover:text-stone-900",
            )}
          >
            {p}s
          </button>
        ))}
      </div>

      <div className="mt-4 flex gap-2">
        {running ? (
          <Button onClick={pause} variant="outline" className="flex-1">
            <Pause className="h-4 w-4" /> Pause
          </Button>
        ) : (
          <Button
            onClick={start}
            className="flex-1 bg-emerald-600 text-white hover:bg-emerald-700"
          >
            <Play className="h-4 w-4" /> {done || remaining === 0 ? "Restart" : "Start"}
          </Button>
        )}
        <Button onClick={reset} variant="outline" size="icon" aria-label="Reset">
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
