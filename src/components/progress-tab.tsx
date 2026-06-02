"use client";

import { useEffect, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Beef,
  CandyOff,
  Check,
  Droplet,
  Minus,
  Trash2,
} from "lucide-react";
import {
  getProgression,
  sessionCategoryForWeek,
  sessions,
  strengthA,
  strengthB,
  type Exercise,
} from "@/data/plan";
import { categoryStyles } from "@/lib/categories";
import { useStore, type SetLog } from "@/lib/store";
import { lastNDays, toDateStr } from "@/lib/dates";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

// Sessions that count toward the weekly training ratio (rest days excluded).
const trainingSessions = sessions.filter((s) => s.category !== "rest");

const liftGroups: { title: string; exercises: Exercise[] }[] = [
  { title: "Strength A", exercises: strengthA },
  { title: "Strength B", exercises: strengthB },
];

function shortDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function ProgressTab() {
  const store = useStore();
  const { week, hydrated } = store;
  const prog = getProgression(week);

  // Resolve today after mount only (keeps Date out of render → no mismatch).
  const [todayStr, setTodayStr] = useState<string | null>(null);
  useEffect(() => setTodayStr(toDateStr(new Date())), []);

  if (!hydrated) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-7 w-36" />
          <Skeleton className="h-4 w-28" />
        </div>
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  const completedCount = trainingSessions.filter((s) =>
    store.isSessionComplete(week, s.id),
  ).length;
  const pct = Math.round((completedCount / trainingSessions.length) * 100);

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-stone-900">
          Progress
        </h1>
        <p className="text-sm text-stone-500">
          Week {week} · {prog.label}
        </p>
      </header>

      {/* This week checklist */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-stone-900">This week</h2>
          <span className="text-xs font-medium text-stone-500">
            {completedCount} / {trainingSessions.length} done
          </span>
        </div>
        <Card className="space-y-3 p-4">
          <Progress value={pct} className="h-2" />
          <ul className="space-y-1.5">
            {trainingSessions.map((s) => {
              const cat = sessionCategoryForWeek(s, week);
              const done = store.isSessionComplete(week, s.id);
              return (
                <li key={s.id} className="flex items-center gap-2.5">
                  <span
                    className={cn(
                      "flex h-5 w-5 shrink-0 items-center justify-center rounded-full",
                      done
                        ? "bg-emerald-600 text-white"
                        : "border border-stone-200 bg-white",
                    )}
                  >
                    {done && <Check className="h-3 w-3" />}
                  </span>
                  <span
                    className={cn(
                      "text-sm",
                      done ? "text-stone-400 line-through" : "text-stone-700",
                    )}
                  >
                    {cat === "intervals" ? "Intervals" : s.name}
                  </span>
                  <span
                    className={`ml-auto h-2 w-2 rounded-full ${categoryStyles[cat].dot}`}
                    aria-hidden
                  />
                </li>
              );
            })}
          </ul>
        </Card>
      </section>

      {/* Lifts */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-stone-900">Lifts</h2>
        {liftGroups.map((group) => (
          <div key={group.title} className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wide text-stone-400">
              {group.title}
            </p>
            {group.exercises.map((ex) => (
              <LiftRow key={ex.id} exercise={ex} logs={store.getExerciseLogs(ex.id)} />
            ))}
          </div>
        ))}
      </section>

      {/* Nutrition glance */}
      <NutritionGlance todayStr={todayStr} />

      {/* Reset */}
      <ResetSection onReset={store.resetAll} />
    </div>
  );
}

function NutritionGlance({ todayStr }: { todayStr: string | null }) {
  const store = useStore();
  const target = store.proteinTarget;

  if (!todayStr) {
    return (
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-stone-900">Nutrition</h2>
        <Skeleton className="h-28 w-full" />
      </section>
    );
  }

  const week = lastNDays(todayStr, 7);
  const proteinHits = week.reduce((n, d) => {
    const day = store.getNutrition(d);
    const total = day.proteinEntries.reduce((s, e) => s + e.grams, 0);
    return n + (target > 0 && total >= target ? 1 : 0);
  }, 0);

  // Current streaks ending today (count back until a day misses).
  const streak = (pred: (d: string) => boolean) => {
    let n = 0;
    for (let i = week.length - 1; i >= 0; i--) {
      if (pred(week[i])) n++;
      else break;
    }
    return n;
  };
  const waterStreak = streak((d) => store.getNutrition(d).water >= 8);
  const sugarStreak = streak((d) => store.getNutrition(d).lowSugar === true);

  const lines: { icon: typeof Beef; tint: string; text: string }[] = [
    {
      icon: Beef,
      tint: "text-violet-600",
      text: `Protein goal hit ${proteinHits}/7 days`,
    },
    {
      icon: Droplet,
      tint: "text-cyan-600",
      text:
        waterStreak > 0
          ? `Water goal: ${waterStreak}-day streak`
          : "Water goal: start a streak today",
    },
    {
      icon: CandyOff,
      tint: "text-emerald-600",
      text:
        sugarStreak > 0
          ? `Low added sugar: ${sugarStreak}-day streak`
          : "Low added sugar: start a streak today",
    },
  ];

  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold text-stone-900">Nutrition</h2>
      <Card className="space-y-2.5 p-4">
        {lines.map((l) => (
          <div key={l.text} className="flex items-center gap-2.5">
            <l.icon className={cn("h-4 w-4 shrink-0", l.tint)} />
            <span className="text-sm text-stone-700">{l.text}</span>
          </div>
        ))}
      </Card>
    </section>
  );
}

function LiftRow({ exercise, logs }: { exercise: Exercise; logs: SetLog[] }) {
  const latest = logs[0];
  const previous = logs[1];

  let trend: "up" | "down" | "same" | null = null;
  if (latest && previous) {
    if (latest.weight !== previous.weight) {
      trend = latest.weight > previous.weight ? "up" : "down";
    } else if (latest.reps !== previous.reps) {
      trend = latest.reps > previous.reps ? "up" : "down";
    } else {
      trend = "same";
    }
  }

  return (
    <Card className="p-3.5">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-stone-800">
          {exercise.name}
        </span>
        {latest ? (
          <span className="flex items-center gap-1.5 text-sm font-semibold tabular-nums text-stone-900">
            {latest.weight} lb × {latest.reps}
            {trend === "up" && <ArrowUp className="h-3.5 w-3.5 text-emerald-600" />}
            {trend === "down" && (
              <ArrowDown className="h-3.5 w-3.5 text-amber-600" />
            )}
            {trend === "same" && <Minus className="h-3.5 w-3.5 text-stone-300" />}
          </span>
        ) : (
          <span className="text-xs text-stone-400">No logs yet</span>
        )}
      </div>

      {logs.length > 0 && (
        <ul className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-stone-400">
          {logs.slice(0, 3).map((l, i) => (
            <li key={i} className="tabular-nums">
              <span className="text-stone-500">{shortDate(l.date)}</span>{" "}
              {l.weight}×{l.reps}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function ResetSection({ onReset }: { onReset: () => void }) {
  const [confirming, setConfirming] = useState(false);

  return (
    <section className="pt-2">
      {confirming ? (
        <Card className="space-y-3 border-red-200 bg-red-50/60 p-4">
          <p className="text-sm text-stone-700">
            Clear everything — logged sets, completions, week selection, and all
            nutrition logs? This can&apos;t be undone.
          </p>
          <div className="flex gap-2">
            <Button
              onClick={() => {
                onReset();
                setConfirming(false);
              }}
              className="h-10 flex-1 bg-red-600 text-white hover:bg-red-700"
            >
              Yes, reset everything
            </Button>
            <Button
              variant="outline"
              onClick={() => setConfirming(false)}
              className="h-10 border-stone-200"
            >
              Cancel
            </Button>
          </div>
        </Card>
      ) : (
        <Button
          variant="outline"
          onClick={() => setConfirming(true)}
          className="h-10 w-full border-stone-200 text-stone-500 hover:text-red-600"
        >
          <Trash2 className="h-4 w-4" /> Reset all data
        </Button>
      )}
    </section>
  );
}
