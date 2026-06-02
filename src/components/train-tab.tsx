"use client";

import { useEffect, useState } from "react";
import { Check, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import {
  abbrForDow,
  categoryLabel,
  dayFull,
  getProgression,
  sessionCategoryForWeek,
  sessions,
  sessionTargetSummary,
  type Session,
} from "@/data/plan";
import { categoryStyles } from "@/lib/categories";
import { useStore } from "@/lib/store";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { SessionDetailSheet } from "@/components/session-detail";
import { cn } from "@/lib/utils";

function greetingFor(session: Session | undefined, week: number): string {
  if (!session) return "Here's your week. Tap any day to get going.";
  const full = dayFull(session.day);
  const cat = sessionCategoryForWeek(session, week);
  if (cat === "rest") return "Rest day. Recover well — you earned it.";
  if (cat === "intervals")
    return `Happy ${full} — intervals today. Warm up, then push.`;
  if (session.category === "strength")
    return `Happy ${full} — ${session.name} today. Let's get it.`;
  if (session.id === "saturday")
    return `Happy ${full} — long easy one outside today.`;
  return `Happy ${full} — easy Zone 2 today. Keep it conversational.`;
}

export function TrainTab() {
  const store = useStore();
  const { week, hydrated } = store;
  const prog = getProgression(week);
  const [openId, setOpenId] = useState<string | null>(null);
  const [todayAbbr, setTodayAbbr] = useState<string | null>(null);

  const nothingLoggedYet =
    hydrated &&
    !sessions.some(
      (s) => s.category !== "rest" && store.isSessionComplete(week, s.id),
    );

  // Resolve "today" after mount only (Date is dynamic → keep it out of render).
  useEffect(() => {
    setTodayAbbr(abbrForDow(new Date().getDay()));
  }, []);

  const openSession = sessions.find((s) => s.id === openId) ?? null;
  const todaySession = sessions.find((s) => s.day === todayAbbr);

  if (!hydrated) {
    return (
      <div className="space-y-5">
        <div className="space-y-2">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="space-y-2.5">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className="h-[72px] w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <header className="space-y-1">
        <div className="flex items-baseline justify-between">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Week {week}
          </h1>
          <span className="text-sm font-medium text-emerald-400">
            {prog.label}
          </span>
        </div>
        <p className="text-sm text-muted-foreground">{greetingFor(todaySession, week)}</p>
        {nothingLoggedYet && (
          <p className="text-xs text-muted-foreground">
            Fresh week. Start with Monday whenever you&apos;re ready.
          </p>
        )}
      </header>

      <div className="space-y-2.5">
        {sessions.map((s) => {
          const isToday = s.day === todayAbbr;
          return sessionCategoryForWeek(s, week) === "rest" ? (
            <RestCard key={s.id} session={s} week={week} isToday={isToday} />
          ) : (
            <SessionCard
              key={s.id}
              session={s}
              week={week}
              isToday={isToday}
              onOpen={() => setOpenId(s.id)}
            />
          );
        })}
      </div>

      <SessionDetailSheet
        session={openSession}
        week={week}
        open={openId !== null}
        onOpenChange={(o) => !o && setOpenId(null)}
      />
    </div>
  );
}

function TodayBadge() {
  return (
    <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
      Today
    </span>
  );
}

function SessionCard({
  session,
  week,
  isToday,
  onOpen,
}: {
  session: Session;
  week: number;
  isToday: boolean;
  onOpen: () => void;
}) {
  const { isSessionComplete } = useStore();
  const cat = sessionCategoryForWeek(session, week);
  const styles = categoryStyles[cat];
  const complete = isSessionComplete(week, session.id);

  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen();
        }
      }}
      className={cn(
        "flex cursor-pointer items-center gap-3 border-l-4 p-4 transition-colors hover:bg-secondary",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500",
        styles.leftBorder,
        isToday && "ring-2 ring-emerald-500/60 ring-offset-1",
      )}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="w-9 shrink-0 text-xs font-medium text-muted-foreground">
            {session.day}
          </span>
          <h3 className="truncate text-sm font-semibold text-foreground">
            {cat === "intervals" ? "Intervals" : session.name}
          </h3>
          {isToday && <TodayBadge />}
          <Badge variant="outline" className={cn("ml-auto", styles.badge)}>
            {categoryLabel[cat]}
          </Badge>
        </div>
        <p className="mt-1 pl-11 text-xs text-muted-foreground">
          {sessionTargetSummary(session, week)}
        </p>
      </div>
      {complete ? (
        <span
          className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white"
          aria-label="Completed"
        >
          <Check className="h-3.5 w-3.5" />
        </span>
      ) : (
        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
      )}
    </Card>
  );
}

function RestCard({
  session,
  week,
  isToday,
}: {
  session: Session;
  week: number;
  isToday: boolean;
}) {
  const { isSessionComplete, setSessionComplete } = useStore();
  const done = isSessionComplete(week, session.id);

  return (
    <Card
      className={cn(
        "border-l-4 border-l-zinc-600 p-4",
        isToday && "ring-2 ring-emerald-500/60 ring-offset-1",
      )}
    >
      <div className="flex items-center gap-2">
        <span className="w-9 shrink-0 text-xs font-medium text-muted-foreground">
          {session.day}
        </span>
        <h3 className="text-sm font-semibold text-foreground/90">{session.name}</h3>
        {isToday && <TodayBadge />}
        <Badge
          variant="outline"
          className="ml-auto border-border bg-secondary text-muted-foreground"
        >
          Rest
        </Badge>
      </div>
      <p className="mt-1 pl-11 text-xs text-muted-foreground">{session.note}</p>
      <div className="mt-3 pl-11">
        <button
          onClick={() => {
            const next = !done;
            setSessionComplete(week, session.id, next);
            if (next) toast.success("Nice — easy day logged.");
          }}
          className={cn(
            "inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-xs font-medium transition-colors",
            done
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
              : "border-border bg-card text-muted-foreground hover:bg-secondary",
          )}
        >
          {done && <Check className="h-3.5 w-3.5" />}
          {done ? "Easy walk done" : "Mark easy walk done"}
        </button>
      </div>
    </Card>
  );
}
