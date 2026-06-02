"use client";

import { useEffect, useState } from "react";
import {
  ArrowRight,
  Beef,
  Check,
  ChevronRight,
  Droplet,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import {
  abbrForDow,
  dayFull,
  getProgression,
  intervalsHowToUrl,
  sessions,
  sessionCategoryForWeek,
  type Session,
} from "@/data/plan";
import { categoryStyles } from "@/lib/categories";
import { useStore } from "@/lib/store";
import { toDateStr } from "@/lib/dates";
import { vibrate } from "@/lib/haptics";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { WeekStrip } from "@/components/week-strip";
import { SessionDetailSheet } from "@/components/session-detail";
import { cn } from "@/lib/utils";

const trainingTotal = sessions.filter((s) => s.category !== "rest").length;

function focusFor(session: Session | undefined, week: number): string {
  if (!session) return "—";
  const cat = sessionCategoryForWeek(session, week);
  if (cat === "rest") return "rest & recovery";
  if (cat === "intervals") return "interval cardio";
  if (session.category === "strength") return "full-body strength";
  if (session.id === "saturday") return "long easy cardio outside";
  return "easy Zone 2 cardio";
}

export function TodayTab({
  onOpenNutrition,
}: {
  onOpenNutrition: () => void;
}) {
  const store = useStore();
  const { week, hydrated } = store;
  const [todayAbbr, setTodayAbbr] = useState<string | null>(null);
  const [todayLabel, setTodayLabel] = useState("");
  const [todayStr, setTodayStr] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    const d = new Date();
    setTodayAbbr(abbrForDow(d.getDay()));
    setTodayLabel(
      d.toLocaleDateString(undefined, {
        weekday: "long",
        month: "long",
        day: "numeric",
      }),
    );
    setTodayStr(toDateStr(d));
  }, []);

  if (!hydrated || !todayAbbr || !todayStr) {
    return (
      <div className="space-y-5">
        <div className="space-y-2">
          <Skeleton className="h-7 w-56" />
          <Skeleton className="h-4 w-40" />
        </div>
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  const todaySession = sessions.find((s) => s.day === todayAbbr) ?? sessions[0];
  const openSession = sessions.find((s) => s.id === openId) ?? null;
  const doneCount = sessions.filter(
    (s) => s.category !== "rest" && store.isSessionComplete(week, s.id),
  ).length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <header className="space-y-1">
        <p className="text-xs font-medium uppercase tracking-wide text-emerald-700">
          Week {week} of 4
        </p>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {todayLabel}
        </h1>
        <p className="text-sm text-muted-foreground">
          Today&apos;s focus: {focusFor(todaySession, week)}.
        </p>
      </header>

      {/* Today's session hero */}
      <TodayHero
        session={todaySession}
        week={week}
        onOpen={() => setOpenId(todaySession.id)}
      />

      {/* Nutrition snapshot */}
      <NutritionSnapshot dateStr={todayStr} onOpenNutrition={onOpenNutrition} />

      {/* This-week strip */}
      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-foreground">This week</h2>
        <WeekStrip
          week={week}
          todayAbbr={todayAbbr}
          onOpenDay={(id) => setOpenId(id)}
        />
      </section>

      {/* Momentum */}
      <p className="text-sm text-muted-foreground">
        {doneCount === 0
          ? "New week, clean slate — start whenever you're ready."
          : doneCount >= trainingTotal
            ? `All ${trainingTotal} training days done this week — that's the whole plan. Excellent.`
            : `${doneCount} of ${trainingTotal} training days done this week — nice work.`}
      </p>

      <SessionDetailSheet
        session={openSession}
        week={week}
        open={openId !== null}
        onOpenChange={(o) => !o && setOpenId(null)}
      />
    </div>
  );
}

function TodayHero({
  session,
  week,
  onOpen,
}: {
  session: Session;
  week: number;
  onOpen: () => void;
}) {
  const store = useStore();
  const prog = getProgression(week);
  const cat = sessionCategoryForWeek(session, week);
  const styles = categoryStyles[cat];
  const complete = store.isSessionComplete(week, session.id);

  const isStrength = session.category === "strength";
  const isRest = cat === "rest";

  return (
    <Card className={cn("border-l-4 p-5", styles.leftBorder)}>
      <div className="flex items-center gap-2">
        <Badge variant="outline" className={styles.badge}>
          {cat === "intervals"
            ? "Intervals"
            : cat === "rest"
              ? "Rest"
              : cat === "strength"
                ? "Strength"
                : "Zone 2"}
        </Badge>
        <span className="text-xs font-medium text-muted-foreground">
          {dayFull(session.day)}
        </span>
        {complete && (
          <span className="ml-auto inline-flex items-center gap-1 text-xs font-medium text-emerald-700">
            <Check className="h-3.5 w-3.5" /> Done
          </span>
        )}
      </div>

      <h2 className="mt-2 text-lg font-semibold text-foreground">
        {cat === "intervals" ? "Intervals" : session.name}
      </h2>

      {isStrength ? (
        <>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {prog.strengthSets} · {session.exercises?.length} exercises
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            {session.exercises
              ?.slice(0, 3)
              .map((e) => e.name)
              .join(" · ")}
            {(session.exercises?.length ?? 0) > 3 ? " · …" : ""}
          </p>
          <Button
            onClick={onOpen}
            className="mt-4 h-11 w-full bg-emerald-600 text-white hover:bg-emerald-700"
          >
            {complete ? (
              <>Review session</>
            ) : store.hasLoggedSets(week, session.id) ? (
              <>
                Continue logging <ArrowRight className="h-4 w-4" />
              </>
            ) : (
              <>
                Start logging <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </>
      ) : isRest ? (
        <>
          <p className="mt-1 text-sm text-muted-foreground">{session.note}</p>
          <Button
            variant="outline"
            onClick={() => {
              const next = !complete;
              store.setSessionComplete(week, session.id, next);
              if (next) {
                vibrate(15);
                toast.success("Nice — easy day logged.");
              }
            }}
            className={cn(
              "mt-4 h-11 w-full border-stone-200",
              complete && "border-emerald-300 bg-emerald-50 text-emerald-700",
            )}
          >
            {complete ? "Easy walk done ✓" : "Mark easy walk done"}
          </Button>
        </>
      ) : (
        <>
          <p className="mt-0.5 text-2xl font-semibold text-foreground">
            {cat === "intervals"
              ? "4 × 3 min hard / 3 easy"
              : session.id === "saturday"
                ? `${prog.saturdayMinutes} min`
                : `${prog.zone2Minutes} min`}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">{session.note}</p>
          <div className="mt-3 flex items-center gap-3">
            <Button
              onClick={() => {
                const next = !complete;
                store.setSessionComplete(week, session.id, next);
                if (next) {
                  vibrate(15);
                  toast.success(`Nice work — ${dayFull(session.day)} done.`);
                }
              }}
              className={cn(
                "h-11 flex-1",
                complete
                  ? "bg-emerald-600 text-white hover:bg-emerald-700"
                  : "bg-emerald-600 text-white hover:bg-emerald-700",
              )}
            >
              {complete ? "Done ✓" : "Mark done"}
            </Button>
            <a
              href={cat === "intervals" ? intervalsHowToUrl : session.howToUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 hover:underline"
            >
              How <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </>
      )}
    </Card>
  );
}

function NutritionSnapshot({
  dateStr,
  onOpenNutrition,
}: {
  dateStr: string;
  onOpenNutrition: () => void;
}) {
  const store = useStore();
  const day = store.getNutrition(dateStr);
  const target = store.proteinTarget;
  const protein = day.proteinEntries.reduce((s, e) => s + e.grams, 0);
  const pct = target > 0 ? Math.min(1, protein / target) : 0;
  const size = 72;
  const stroke = 8;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;

  return (
    <Card className="space-y-4 p-5">
      <div className="flex items-center gap-4">
        <div className="relative shrink-0" style={{ width: size, height: size }}>
          <svg width={size} height={size} className="-rotate-90">
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e7e5e4" strokeWidth={stroke} />
            <circle
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={protein >= target && target > 0 ? "#16a34a" : "#7c3aed"}
              strokeWidth={stroke}
              strokeLinecap="round"
              strokeDasharray={c}
              strokeDashoffset={c * (1 - pct)}
              style={{ transition: "stroke-dashoffset 300ms ease" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-base font-semibold tabular-nums text-foreground">
              {protein}
            </span>
            <span className="text-[9px] text-muted-foreground">/{target}g</span>
          </div>
        </div>

        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-center gap-1.5 text-sm">
            <Beef className="h-3.5 w-3.5 text-violet-600" />
            <span className="font-medium text-foreground">Protein</span>
            <div className="ml-auto flex gap-1.5">
              {[20, 30].map((g) => (
                <button
                  key={g}
                  onClick={() => {
                    store.addProtein(dateStr, g, new Date().toISOString());
                    vibrate(15);
                    toast.success(`+${g}g protein`);
                  }}
                  className="h-7 rounded-md bg-violet-50 px-2 text-xs font-semibold text-violet-700 hover:bg-violet-100"
                >
                  +{g}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-sm">
            <Droplet className="h-3.5 w-3.5 text-cyan-600" />
            <span className="font-medium text-foreground">Water</span>
            <span className="text-xs text-muted-foreground">{day.water} cups</span>
            <button
              onClick={() => {
                store.setWater(dateStr, day.water + 1);
                vibrate(15);
                toast.success("+1 cup water");
              }}
              className="ml-auto h-7 rounded-md bg-cyan-100 px-2.5 text-xs font-semibold text-cyan-700 hover:bg-cyan-200"
            >
              + Cup
            </button>
          </div>
        </div>
      </div>

      <button
        onClick={onOpenNutrition}
        className="flex w-full items-center justify-center gap-1 rounded-lg border border-stone-200 py-2 text-xs font-medium text-muted-foreground hover:bg-secondary"
      >
        Open Nutrition <ChevronRight className="h-3.5 w-3.5" />
      </button>
    </Card>
  );
}
