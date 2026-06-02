"use client";

import { useState } from "react";
import { Apple, Dumbbell, TrendingUp, type LucideIcon } from "lucide-react";
import { WeekSelector } from "@/components/week-selector";
import { PlanDrawer } from "@/components/plan-drawer";
import { TrainTab } from "@/components/train-tab";
import { NutritionTab } from "@/components/nutrition-tab";
import { ProgressTab } from "@/components/progress-tab";
import { QuickAdd } from "@/components/quick-add";
import { cn } from "@/lib/utils";

type TabId = "train" | "nutrition" | "progress";

const TABS: { id: TabId; label: string; icon: LucideIcon }[] = [
  { id: "train", label: "Train", icon: Dumbbell },
  { id: "nutrition", label: "Nutrition", icon: Apple },
  { id: "progress", label: "Progress", icon: TrendingUp },
];

export function AppShell() {
  const [tab, setTab] = useState<TabId>("train");

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col">
      {/* Sticky header: title + Plan pull-up, week selector, desktop nav */}
      <header className="sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur">
        <div className="space-y-3 px-4 pt-3 pb-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-semibold tracking-tight text-foreground">
              4-Week Plan
            </span>
            <div className="flex items-center gap-1.5">
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
              <PlanDrawer />
            </div>
          </div>
          <WeekSelector />
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 px-4 pt-5 pb-28 md:pb-10">
        {tab === "train" && <TrainTab />}
        {tab === "nutrition" && <NutritionTab />}
        {tab === "progress" && <ProgressTab />}
      </main>

      {/* Global quick-add for protein & water, on any tab */}
      <QuickAdd />

      {/* Mobile bottom tab bar */}
      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-card/95 backdrop-blur md:hidden">
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
            ? "bg-emerald-500/10 text-emerald-400"
            : "text-muted-foreground hover:text-foreground",
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
        active ? "text-emerald-400" : "text-muted-foreground",
      )}
    >
      <Icon className={cn("h-5 w-5", active && "text-emerald-400")} />
      {label}
    </button>
  );
}
