"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Beef,
  CandyOff,
  Check,
  Download,
  Droplet,
  Minus,
  Trash2,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import {
  abbrForDow,
  getProgression,
  sessionCategoryForWeek,
  sessions,
  strengthA,
  strengthB,
  WEEKS,
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
  const [todayAbbr, setTodayAbbr] = useState<string | null>(null);
  useEffect(() => {
    const d = new Date();
    setTodayStr(toDateStr(d));
    setTodayAbbr(abbrForDow(d.getDay()));
  }, []);

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
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Progress
        </h1>
        <p className="text-sm text-muted-foreground">
          Week {week} · {prog.label}
        </p>
      </header>

      {/* This week progress bar */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">This week</h2>
          <span className="text-xs font-medium text-muted-foreground">
            {completedCount} / {trainingSessions.length} done
          </span>
        </div>
        <Card className="p-4">
          <Progress value={pct} className="h-2" />
        </Card>
      </section>

      {/* Program grid */}
      <ProgramGrid week={week} todayAbbr={todayAbbr} todayStr={todayStr} />

      {/* Lifts */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Lifts</h2>
        {liftGroups.map((group) => (
          <div key={group.title} className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
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

      {/* Data: backup / restore + reset */}
      <DataSection />
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
        <h2 className="text-sm font-semibold text-foreground">Nutrition</h2>
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
      tint: "text-emerald-700",
      text:
        sugarStreak > 0
          ? `Low added sugar: ${sugarStreak}-day streak`
          : "Low added sugar: start a streak today",
    },
  ];

  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold text-foreground">Nutrition</h2>
      <Card className="space-y-2.5 p-4">
        {lines.map((l) => (
          <div key={l.text} className="flex items-center gap-2.5">
            <l.icon className={cn("h-4 w-4 shrink-0", l.tint)} />
            <span className="text-sm text-foreground/90">{l.text}</span>
          </div>
        ))}
      </Card>
    </section>
  );
}

function ProgramGrid({
  week,
  todayAbbr,
  todayStr,
}: {
  week: number;
  todayAbbr: string | null;
  todayStr: string | null;
}) {
  const store = useStore();

  // Total training sessions completed across the whole program.
  let totalDone = 0;
  for (const w of WEEKS) {
    for (const s of trainingSessions) {
      if (store.isSessionComplete(w, s.id)) totalDone++;
    }
  }

  // Gentle "active" streak — consecutive days (ending today) with any nutrition
  // activity. Supportive, never a red failure state.
  let streak = 0;
  if (todayStr) {
    const days = lastNDays(todayStr, 30);
    for (let i = days.length - 1; i >= 0; i--) {
      const d = store.getNutrition(days[i]);
      const active =
        d.proteinEntries.length > 0 || d.water > 0 || d.lowSugar === true;
      if (active) streak++;
      else break;
    }
  }

  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold text-foreground">Program</h2>
      <Card className="space-y-4 p-4">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">
            <span className="font-semibold text-foreground">{totalDone}</span>{" "}
            sessions completed
          </span>
          {streak > 0 && (
            <span className="rounded-full bg-emerald-50 px-2 py-0.5 font-medium text-emerald-700">
              Active {streak} {streak === 1 ? "day" : "days"} in a row
            </span>
          )}
        </div>

        <div className="grid grid-cols-8 gap-1">
          {/* Header row */}
          <span />
          {sessions.map((s) => (
            <span
              key={s.id}
              className="text-center text-[9px] font-medium uppercase text-muted-foreground"
            >
              {s.day}
            </span>
          ))}

          {/* One row per week */}
          {WEEKS.map((w) => (
            <ProgramRow
              key={w}
              week={w}
              isSelected={w === week}
              todayAbbr={todayAbbr}
            />
          ))}
        </div>

        <p className="text-[11px] text-muted-foreground">
          Each dot is a session; filled when complete. Rest days count too — this
          is your whole 4 weeks at a glance.
        </p>
      </Card>
    </section>
  );
}

function ProgramRow({
  week,
  isSelected,
  todayAbbr,
}: {
  week: number;
  isSelected: boolean;
  todayAbbr: string | null;
}) {
  const store = useStore();
  return (
    <>
      <span className="flex items-center text-[10px] font-semibold text-muted-foreground">
        W{week}
      </span>
      {sessions.map((s) => {
        const cat = sessionCategoryForWeek(s, week);
        const done = store.isSessionComplete(week, s.id);
        const isToday = isSelected && s.day === todayAbbr;
        return (
          <div
            key={s.id}
            title={`Week ${week} ${s.day} — ${s.name}${done ? " (done)" : ""}`}
            className={cn(
              "flex aspect-square items-center justify-center rounded-md",
              done ? `${categoryStyles[cat].dot} text-white` : "bg-secondary",
              isToday && "ring-2 ring-emerald-500 ring-offset-1",
            )}
          >
            {done && <Check className="h-3 w-3" />}
          </div>
        );
      })}
    </>
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
        <span className="text-sm font-medium text-foreground">
          {exercise.name}
        </span>
        {latest ? (
          <span className="flex items-center gap-1.5 text-sm font-semibold tabular-nums text-foreground">
            {latest.weight} lb × {latest.reps}
            {trend === "up" && <ArrowUp className="h-3.5 w-3.5 text-emerald-700" />}
            {trend === "down" && (
              <ArrowDown className="h-3.5 w-3.5 text-amber-600" />
            )}
            {trend === "same" && <Minus className="h-3.5 w-3.5 text-muted-foreground" />}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">No logs yet</span>
        )}
      </div>

      {logs.length > 0 && (
        <ul className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
          {logs.slice(0, 3).map((l, i) => (
            <li key={i} className="tabular-nums">
              <span className="text-muted-foreground">{shortDate(l.date)}</span>{" "}
              {l.weight}×{l.reps}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function DataSection() {
  const store = useStore();
  const fileRef = useRef<HTMLInputElement | null>(null);

  const exportData = () => {
    try {
      const blob = new Blob([store.exportData()], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "4-week-plan-backup.json";
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Backup downloaded.");
    } catch {
      toast.error("Couldn't export your data.");
    }
  };

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-importing the same file
    if (!file) return;
    try {
      const text = await file.text();
      if (store.importData(text)) toast.success("Data restored from backup.");
      else toast.error("That file isn't a valid backup.");
    } catch {
      toast.error("Couldn't read that file.");
    }
  };

  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold text-foreground">Your data</h2>
      <Card className="space-y-3 p-4">
        <p className="text-xs text-muted-foreground">
          Everything is stored on this device. Back it up so you don&apos;t lose
          your logs.
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={exportData}
            className="h-10 flex-1 border-border"
          >
            <Download className="h-4 w-4" /> Export
          </Button>
          <Button
            variant="outline"
            onClick={() => fileRef.current?.click()}
            className="h-10 flex-1 border-border"
          >
            <Upload className="h-4 w-4" /> Import
          </Button>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          onChange={onFile}
          className="hidden"
        />
      </Card>
    </section>
  );
}

function ResetSection({ onReset }: { onReset: () => void }) {
  const [confirming, setConfirming] = useState(false);

  return (
    <section className="pt-2">
      {confirming ? (
        <Card className="space-y-3 border-red-200 bg-red-50 p-4">
          <p className="text-sm text-foreground/90">
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
              className="h-10 border-border"
            >
              Cancel
            </Button>
          </div>
        </Card>
      ) : (
        <Button
          variant="outline"
          onClick={() => setConfirming(true)}
          className="h-10 w-full border-border text-muted-foreground hover:text-red-600"
        >
          <Trash2 className="h-4 w-4" /> Reset all data
        </Button>
      )}
    </section>
  );
}
