"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ExternalLink, Info, Timer } from "lucide-react";
import { toast } from "sonner";
import {
  categoryLabel,
  dayFull,
  getProgression,
  intervalsHowToUrl,
  intervalsNote,
  sessionCategoryForWeek,
  warmupNote,
  type Exercise,
  type Session,
} from "@/data/plan";
import { categoryStyles } from "@/lib/categories";
import { useStore } from "@/lib/store";
import { vibrate } from "@/lib/haptics";
import { useWakeLock } from "@/lib/use-wake-lock";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { NumberStepper } from "@/components/number-stepper";
import { RestTimer } from "@/components/rest-timer";
import { cn } from "@/lib/utils";

export function SessionDetailSheet({
  session,
  week,
  open,
  onOpenChange,
}: {
  session: Session | null;
  week: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!open || !session) return null;
  return (
    <SessionDetailPanel
      session={session}
      week={week}
      onClose={() => onOpenChange(false)}
    />
  );
}

function SessionDetailPanel({
  session,
  week,
  onClose,
}: {
  session: Session;
  week: number;
  onClose: () => void;
}) {
  const store = useStore();
  const [showTimer, setShowTimer] = useState(false);
  const [autoSignal, setAutoSignal] = useState(0);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const exerciseRefs = useRef<(HTMLDivElement | null)[]>([]);

  const cat = sessionCategoryForWeek(session, week);
  const isStrength = session.category === "strength";
  const isRest = cat === "rest";
  const prog = getProgression(week);
  const complete = store.isSessionComplete(week, session.id);

  const title = isStrength || cat !== "intervals" ? session.name : "Intervals";
  const targetLine = isStrength
    ? prog.strengthSets
    : isRest
      ? "Rest & recovery"
      : cat === "intervals"
        ? "4 × 3 min hard / 3 min easy"
        : session.id === "saturday"
          ? `${prog.saturdayMinutes} min`
          : `${prog.zone2Minutes} min`;

  // Keep the screen awake while logging (released automatically on unmount).
  useWakeLock(true);

  // Lock background scroll + reset this view to the top whenever it opens.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    scrollRef.current?.scrollTo(0, 0);
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  // Close on Escape.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const handleSetToggle = (
    exerciseId: string,
    exIndex: number,
    setIndex: number,
    checked: boolean,
    isLast: boolean,
  ) => {
    store.toggleSetDone(week, session.id, exerciseId, setIndex, checked);
    if (!checked) return;
    vibrate(15);
    if (store.autoRestTimer) {
      setShowTimer(true);
      setAutoSignal((n) => n + 1);
    }
    if (isLast) {
      // Gently bring the next exercise into view.
      const next = exerciseRefs.current[exIndex + 1];
      if (next) setTimeout(() => next.scrollIntoView({ behavior: "smooth", block: "start" }), 150);
    }
  };

  const markComplete = () => {
    const next = !complete;
    store.setSessionComplete(week, session.id, next);
    if (next) {
      vibrate([15, 40, 15]);
      toast.success(`Nice work — ${dayFull(session.day)} done.`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background">
      <div className="relative mx-auto flex h-dvh w-full max-w-md flex-col md:max-w-lg">
        {/* Top bar */}
        <div className="flex shrink-0 items-center gap-2 border-b border-border px-3 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3">
          <button
            onClick={onClose}
            aria-label="Back"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700">
              {dayFull(session.day)}
            </p>
            <div className="flex items-center gap-2">
              <h2 className="truncate text-base font-semibold text-foreground">
                {title}
              </h2>
              <Badge variant="outline" className={categoryStyles[cat].badge}>
                {categoryLabel[cat]}
              </Badge>
            </div>
            <p className="truncate text-xs text-muted-foreground">{targetLine}</p>
          </div>
        </div>

        {/* Scrollable middle */}
        <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
          {isStrength ? (
            <div className="space-y-4">
              <div className="flex items-start gap-2.5 rounded-2xl border border-border bg-secondary/40 p-3.5">
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <p className="text-xs leading-relaxed text-muted-foreground">
                  <span className="font-medium text-foreground">Warm-up · </span>
                  {warmupNote}
                </p>
              </div>

              {session.exercises?.map((ex, i) => (
                <div
                  key={ex.id}
                  ref={(el) => {
                    exerciseRefs.current[i] = el;
                  }}
                  className="scroll-mt-2"
                >
                  <ExerciseCard
                    exercise={ex}
                    session={session}
                    week={week}
                    sets={prog.strengthSetsCount}
                    effort={prog.effort}
                    target={ex.repNote ?? prog.strengthSets}
                    lastEntry={store.getLastEntry(ex.id, week, session.id)}
                    onSetToggle={(setIndex, checked, isLast) =>
                      handleSetToggle(ex.id, i, setIndex, checked, isLast)
                    }
                  />
                </div>
              ))}
            </div>
          ) : isRest ? (
            <div className="space-y-3 rounded-2xl border border-border bg-card p-4">
              <p className="text-sm leading-relaxed text-muted-foreground">
                {session.note}
              </p>
              <p className="text-xs text-muted-foreground">
                Rest days are part of the plan — recovery is when you adapt. Mark
                it done below if you got an easy walk in.
              </p>
            </div>
          ) : (
            <CardioDetail session={session} week={week} cat={cat} />
          )}
        </div>

        {/* Rest timer overlay */}
        {showTimer && (
          <div className="absolute inset-x-3 bottom-[5.5rem] z-10">
            <RestTimer
              onClose={() => setShowTimer(false)}
              autoStartSignal={autoSignal}
            />
          </div>
        )}

        {/* Sticky bottom action bar */}
        <div className="flex shrink-0 gap-2 border-t border-border bg-card px-3 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          {isStrength && (
            <Button
              variant="outline"
              onClick={() => setShowTimer((v) => !v)}
              className="h-11"
              aria-pressed={showTimer}
            >
              <Timer className="h-4 w-4" /> Rest
            </Button>
          )}
          <Button
            onClick={markComplete}
            className={cn(
              "h-11 flex-1",
              complete
                ? "bg-emerald-600 text-white hover:bg-emerald-700"
                : "bg-emerald-600 text-white hover:bg-emerald-700",
            )}
          >
            {complete ? "Completed ✓" : "Mark session complete"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function ExerciseCard({
  exercise,
  session,
  week,
  sets,
  effort,
  target,
  lastEntry,
  onSetToggle,
}: {
  exercise: Exercise;
  session: Session;
  week: number;
  sets: number;
  effort: string;
  target: string;
  lastEntry: { weight: string; reps: string } | null;
  onSetToggle: (setIndex: number, checked: boolean, isLast: boolean) => void;
}) {
  const store = useStore();

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-foreground">{exercise.name}</h3>
          <span className="text-xs text-muted-foreground">{exercise.muscle}</span>
        </div>
        <a
          href={exercise.howToUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-emerald-700 hover:underline"
        >
          Watch how <ExternalLink className="h-3 w-3" />
        </a>
      </div>

      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
        {exercise.cue}
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Badge
          variant="outline"
          className="border-emerald-200 bg-emerald-50 font-medium text-emerald-700"
        >
          {target}
        </Badge>
        <span className="text-xs text-muted-foreground">{effort}</span>
      </div>

      {lastEntry && (
        <p className="mt-2 text-xs text-muted-foreground">
          Last time:{" "}
          <span className="font-medium text-foreground/80">
            {lastEntry.weight} lb × {lastEntry.reps}
          </span>{" "}
          — beat it if you&apos;ve got 2+ in the tank.
        </p>
      )}

      <div className="mt-3 space-y-2">
        {Array.from({ length: sets }).map((_, i) => {
          const entry = store.getSet(week, session.id, exercise.id, i);
          const isLast = i === sets - 1;
          return (
            <div
              key={i}
              className={cn(
                "rounded-xl border p-2.5 transition-colors",
                entry.done
                  ? "border-emerald-300 bg-emerald-50"
                  : "border-border bg-secondary/40",
              )}
            >
              <label className="flex items-center gap-2 pb-2">
                <Checkbox
                  className="size-5"
                  checked={entry.done}
                  onCheckedChange={(checked) =>
                    onSetToggle(i, checked === true, isLast)
                  }
                  aria-label={`Mark set ${i + 1} of ${exercise.name} done`}
                />
                <span className="text-xs font-semibold text-foreground">
                  Set {i + 1}
                </span>
                {entry.done && (
                  <span className="ml-auto text-[11px] font-medium text-emerald-700">
                    logged
                  </span>
                )}
              </label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="mb-1 block text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                    Weight (lb)
                  </span>
                  <NumberStepper
                    value={entry.weight}
                    onChange={(v) =>
                      store.updateSetField(week, session.id, exercise.id, i, "weight", v)
                    }
                    step={2.5}
                    decimal
                    placeholder={lastEntry?.weight ?? "0"}
                    ariaLabel={`weight for set ${i + 1}`}
                  />
                </div>
                <div>
                  <span className="mb-1 block text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                    Reps
                  </span>
                  <NumberStepper
                    value={entry.reps}
                    onChange={(v) =>
                      store.updateSetField(week, session.id, exercise.id, i, "reps", v)
                    }
                    step={1}
                    placeholder={lastEntry?.reps ?? "0"}
                    ariaLabel={`reps for set ${i + 1}`}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CardioDetail({
  session,
  week,
  cat,
}: {
  session: Session;
  week: number;
  cat: ReturnType<typeof sessionCategoryForWeek>;
}) {
  const prog = getProgression(week);
  const isIntervals = cat === "intervals";

  const note = isIntervals ? intervalsNote : session.note;
  const howToUrl = isIntervals ? intervalsHowToUrl : session.howToUrl;
  const targetLabel = isIntervals
    ? "4 × 3 min hard / 3 min easy"
    : session.id === "saturday"
      ? `${prog.saturdayMinutes} min`
      : `${prog.zone2Minutes} min`;

  return (
    <div className="space-y-4 rounded-2xl border border-border bg-card p-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          This week&apos;s target
        </p>
        <p className="mt-1 text-2xl font-semibold text-foreground">{targetLabel}</p>
      </div>

      <p className="text-sm leading-relaxed text-muted-foreground">{note}</p>

      {howToUrl && (
        <a
          href={howToUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 hover:underline"
        >
          Watch how <ExternalLink className="h-3 w-3" />
        </a>
      )}
    </div>
  );
}
