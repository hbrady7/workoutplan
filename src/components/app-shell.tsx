"use client";

import { useState } from "react";
import { ClipboardList, Dumbbell, TrendingUp, type LucideIcon } from "lucide-react";
import { WeekSelector } from "@/components/week-selector";
import { PlanTab } from "@/components/plan-tab";
import { TrainTab } from "@/components/train-tab";
import { ProgressTab } from "@/components/progress-tab";
import { cn } from "@/lib/utils";

type TabId = "plan" | "train" | "progress";

const TABS: { id: TabId; label: string; icon: LucideIcon }[] = [
  { id: "plan", label: "Plan", icon: ClipboardList },
  { id: "train", label: "Train", icon: Dumbbell },
  { id: "progress", label: "Progress", icon: TrendingUp },
];

export function AppShell() {
  const [tab, setTab] = useState<TabId>("plan");

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col">
      {/* Sticky header: title + week selector, plus desktop top nav */}
      <header className="sticky top-0 z-20 border-b border-stone-200 bg-stone-50/85 backdrop-blur">
        <div className="px-4 pt-3 pb-3 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold tracking-tight text-stone-900">
              4-Week Plan
            </span>
            {/* Desktop top nav */}
            <nav className="hidden gap-1 md:flex">
              {TABS.map((t) => (
                <NavButton
                  key={t.id}
                  active={tab === t.id}
                  onClick={() => setTab(t.id)}
                  icon={t.icon}
                  label={t.label}
                  variant="top"
                />
              ))}
            </nav>
          </div>
          <WeekSelector />
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 px-4 pt-5 pb-28 md:pb-10">
        {tab === "plan" && <PlanTab />}
        {tab === "train" && <TrainTab />}
        {tab === "progress" && <ProgressTab />}
      </main>

      {/* Mobile bottom tab bar */}
      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-stone-200 bg-white/95 backdrop-blur md:hidden">
        <div className="mx-auto flex max-w-2xl items-stretch">
          {TABS.map((t) => (
            <NavButton
              key={t.id}
              active={tab === t.id}
              onClick={() => setTab(t.id)}
              icon={t.icon}
              label={t.label}
              variant="bottom"
            />
          ))}
        </div>
      </nav>
    </div>
  );
}

function NavButton({
  active,
  onClick,
  icon: Icon,
  label,
  variant,
}: {
  active: boolean;
  onClick: () => void;
  icon: LucideIcon;
  label: string;
  variant: "top" | "bottom";
}) {
  if (variant === "top") {
    return (
      <button
        onClick={onClick}
        aria-current={active ? "page" : undefined}
        className={cn(
          "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
          active
            ? "bg-emerald-50 text-emerald-700"
            : "text-stone-500 hover:text-stone-900",
        )}
      >
        <Icon className="h-4 w-4" />
        {label}
      </button>
    );
  }
  return (
    <button
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex flex-1 flex-col items-center justify-center gap-0.5 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] text-[11px] font-medium transition-colors min-h-[56px]",
        active ? "text-emerald-700" : "text-stone-500",
      )}
    >
      <Icon className={cn("h-5 w-5", active && "text-emerald-600")} />
      {label}
    </button>
  );
}
