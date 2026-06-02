"use client";

import { Check } from "lucide-react";
import { sessions, sessionCategoryForWeek } from "@/data/plan";
import { categoryStyles } from "@/lib/categories";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

// Horizontal Mon→Sun strip of day chips: category dot, completion check,
// today highlighted. Tapping a chip opens that day's detail.
export function WeekStrip({
  week,
  todayAbbr,
  onOpenDay,
}: {
  week: number;
  todayAbbr: string | null;
  onOpenDay: (sessionId: string) => void;
}) {
  const { isSessionComplete } = useStore();

  return (
    <div className="grid grid-cols-7 gap-1.5">
      {sessions.map((s) => {
        const cat = sessionCategoryForWeek(s, week);
        const isToday = s.day === todayAbbr;
        const done = isSessionComplete(week, s.id);
        return (
          <button
            key={s.id}
            onClick={() => onOpenDay(s.id)}
            aria-label={`${s.day}${isToday ? " (today)" : ""} — ${s.name}`}
            className={cn(
              "flex min-h-[64px] flex-col items-center justify-center gap-1.5 rounded-xl border p-1.5 transition-colors",
              isToday
                ? "border-emerald-300 bg-emerald-50/60 ring-2 ring-emerald-500/40"
                : "border-stone-200 bg-card hover:bg-secondary",
            )}
          >
            <span
              className={cn(
                "text-[10px] font-semibold uppercase",
                isToday ? "text-emerald-700" : "text-muted-foreground",
              )}
            >
              {s.day}
            </span>
            {done ? (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-white">
                <Check className="h-3 w-3" />
              </span>
            ) : (
              <span
                className={cn(
                  "h-2.5 w-2.5 rounded-full",
                  categoryStyles[cat].dot,
                )}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
