"use client";

import { Footprints } from "lucide-react";
import {
  dailyHabit,
  oneRule,
  planGoal,
  planTitle,
  principles,
  scheduleRows,
} from "@/data/plan";
import { categoryStyles } from "@/lib/categories";
import { Card } from "@/components/ui/card";

export function PlanTab() {
  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-stone-900">
          {planTitle}
        </h1>
        <p className="text-sm text-stone-500">{planGoal}</p>
      </header>

      {/* The one rule — featured */}
      <Card className="border-emerald-200 bg-emerald-50/70 p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
          The one rule
        </p>
        <p className="mt-2 text-sm leading-relaxed text-stone-700">{oneRule}</p>
      </Card>

      {/* Weekly schedule */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-stone-900">Weekly schedule</h2>
        <Card className="overflow-hidden p-0">
          <ul className="divide-y divide-stone-100">
            {scheduleRows.map((row) => (
              <li
                key={row.day}
                className="flex items-center gap-3 px-4 py-2.5"
              >
                <span className="w-9 shrink-0 text-sm font-medium text-stone-500">
                  {row.day}
                </span>
                <span
                  className={`h-2 w-2 shrink-0 rounded-full ${categoryStyles[row.category].dot}`}
                  aria-hidden
                />
                <span className="text-sm text-stone-800">{row.session}</span>
              </li>
            ))}
          </ul>
        </Card>
      </section>

      {/* Daily habit */}
      <Card className="flex items-start gap-3 border-sky-200 bg-sky-50/60 p-4">
        <Footprints className="mt-0.5 h-5 w-5 shrink-0 text-sky-600" />
        <p className="text-sm text-stone-700">
          <span className="font-medium text-stone-900">Daily habit · </span>
          {dailyHabit}
        </p>
      </Card>

      {/* Principles */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-stone-900">The principles</h2>
        <div className="space-y-2">
          {principles.map((p) => (
            <Card key={p.source} className="p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                {p.source}
              </p>
              <p className="mt-1 text-sm leading-relaxed text-stone-600">
                {p.text}
              </p>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
