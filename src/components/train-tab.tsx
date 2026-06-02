"use client";

import { useState } from "react";
import { ChevronRight } from "lucide-react";
import {
  categoryLabel,
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
import { SessionDetailSheet } from "@/components/session-detail";
import { cn } from "@/lib/utils";

export function TrainTab() {
  const { week } = useStore();
  const prog = getProgression(week);
  const [openId, setOpenId] = useState<string | null>(null);

  const openSession = sessions.find((s) => s.id === openId) ?? null;

  return (
    <div className="space-y-5">
      <header className="space-y-1">
        <div className="flex items-baseline justify-between">
          <h1 className="text-2xl font-semibold tracking-tight text-stone-900">
            Week {week}
          </h1>
          <span className="text-sm font-medium text-emerald-700">
            {prog.label}
          </span>
        </div>
        <p className="text-sm text-stone-500">
          Tap a session to see cues, targets, and log your work.
        </p>
      </header>

      <div className="space-y-2.5">
        {sessions.map((s) => (
          <SessionCard
            key={s.id}
            session={s}
            week={week}
            onOpen={() => setOpenId(s.id)}
          />
        ))}
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

function SessionCard({
  session,
  week,
  onOpen,
}: {
  session: Session;
  week: number;
  onOpen: () => void;
}) {
  const cat = sessionCategoryForWeek(session, week);
  const styles = categoryStyles[cat];

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
        "flex cursor-pointer items-center gap-3 border-l-4 p-4 transition-colors hover:bg-stone-50",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600",
        styles.leftBorder,
      )}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="w-9 shrink-0 text-xs font-medium text-stone-400">
            {session.day}
          </span>
          <h3 className="truncate text-sm font-semibold text-stone-900">
            {cat === "intervals" ? "Intervals" : session.name}
          </h3>
          <Badge variant="outline" className={cn("ml-auto", styles.badge)}>
            {categoryLabel[cat]}
          </Badge>
        </div>
        <p className="mt-1 pl-11 text-xs text-stone-500">
          {sessionTargetSummary(session, week)}
        </p>
      </div>
      <ChevronRight className="h-4 w-4 shrink-0 text-stone-300" />
    </Card>
  );
}
