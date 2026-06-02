"use client";

import { BookOpen, Footprints } from "lucide-react";
import {
  dailyHabit,
  oneRule,
  planGoal,
  principles,
  progression,
  scheduleRows,
} from "@/data/plan";
import { categoryStyles } from "@/lib/categories";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Card } from "@/components/ui/card";

// The plan reference, one tap from anywhere via a draggable bottom drawer.
export function PlanDrawer() {
  return (
    <Drawer>
      <DrawerTrigger asChild>
        <button
          aria-label="Open the plan"
          className="flex h-9 items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary active:bg-secondary"
        >
          <BookOpen className="h-4 w-4" />
          Plan
        </button>
      </DrawerTrigger>
      <DrawerContent className="max-h-[85dvh]">
        <DrawerHeader className="text-left">
          <DrawerTitle className="text-lg text-foreground">The plan</DrawerTitle>
          <DrawerDescription className="text-sm text-muted-foreground">
            {planGoal}
          </DrawerDescription>
        </DrawerHeader>

        <div className="space-y-5 overflow-y-auto px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
          {/* The one rule */}
          <Card className="border-emerald-500/30 bg-emerald-500/10 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-400">
              The one rule
            </p>
            <p className="mt-2 text-sm leading-relaxed text-foreground/90">
              {oneRule}
            </p>
          </Card>

          {/* Weekly schedule */}
          <section className="space-y-2">
            <h3 className="text-sm font-semibold text-foreground">
              Weekly schedule
            </h3>
            <Card className="overflow-hidden p-0">
              <ul className="divide-y divide-border">
                {scheduleRows.map((row) => (
                  <li key={row.day} className="flex items-center gap-3 px-4 py-2.5">
                    <span className="w-9 shrink-0 text-sm font-medium text-muted-foreground">
                      {row.day}
                    </span>
                    <span
                      className={`h-2 w-2 shrink-0 rounded-full ${categoryStyles[row.category].dot}`}
                      aria-hidden
                    />
                    <span className="text-sm text-foreground">{row.session}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </section>

          {/* 4-week progression */}
          <section className="space-y-2">
            <h3 className="text-sm font-semibold text-foreground">
              4-week progression
            </h3>
            <Card className="overflow-hidden p-0">
              <table className="w-full text-left text-xs">
                <thead className="bg-secondary text-[10px] uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 font-medium">Wk</th>
                    <th className="px-2 py-2 font-medium">Strength</th>
                    <th className="px-2 py-2 font-medium">Zone 2</th>
                    <th className="px-3 py-2 font-medium">Sat</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {progression.map((p) => (
                    <tr key={p.week} className="align-top">
                      <td className="px-3 py-2">
                        <div className="font-semibold text-foreground">W{p.week}</div>
                        <div className="text-[10px] text-emerald-400">{p.label}</div>
                      </td>
                      <td className="px-2 py-2 text-foreground/90">
                        <div className="font-medium">{p.strengthSets}</div>
                        <div className="text-[10px] text-muted-foreground">{p.effort}</div>
                      </td>
                      <td className="px-2 py-2 text-foreground/90">
                        {p.thursdayIsIntervals
                          ? `${p.zone2Minutes} min · Thu intervals`
                          : `${p.zone2Minutes} min`}
                      </td>
                      <td className="px-3 py-2 text-foreground/90">
                        {p.saturdayMinutes} min
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </section>

          {/* Daily habit */}
          <Card className="flex items-start gap-3 border-sky-500/30 bg-sky-500/10 p-4">
            <Footprints className="mt-0.5 h-5 w-5 shrink-0 text-sky-400" />
            <p className="text-sm text-foreground/90">
              <span className="font-medium text-foreground">Daily habit · </span>
              {dailyHabit}
            </p>
          </Card>

          {/* Principles */}
          <section className="space-y-2">
            <h3 className="text-sm font-semibold text-foreground">
              The principles
            </h3>
            <div className="space-y-2">
              {principles.map((p) => (
                <Card key={p.source} className="p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-emerald-400">
                    {p.source}
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    {p.text}
                  </p>
                </Card>
              ))}
            </div>
          </section>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
