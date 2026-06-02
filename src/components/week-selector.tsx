"use client";

import { WEEKS, getProgression } from "@/data/plan";
import { useStore } from "@/lib/store";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function WeekSelector() {
  const { week, setWeek, hydrated } = useStore();
  const label = getProgression(week).label;

  if (!hydrated) {
    return (
      <div className="flex items-center justify-between gap-3">
        <Skeleton className="h-10 flex-1 rounded-xl" />
        <Skeleton className="h-4 w-12 rounded-md" />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-3">
      <div
        role="tablist"
        aria-label="Select week"
        className="grid grid-cols-4 gap-1 rounded-xl bg-stone-100 p-1 flex-1"
      >
        {WEEKS.map((w) => {
          const active = w === week;
          return (
            <button
              key={w}
              role="tab"
              aria-selected={active}
              onClick={() => setWeek(w)}
              className={cn(
                "h-10 rounded-lg text-sm font-medium transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600",
                active
                  ? "bg-white text-emerald-700 shadow-sm"
                  : "text-stone-500 hover:text-stone-900",
              )}
            >
              W{w}
            </button>
          );
        })}
      </div>
      <span className="shrink-0 text-xs font-medium text-stone-500 w-12 text-right">
        {label}
      </span>
    </div>
  );
}
