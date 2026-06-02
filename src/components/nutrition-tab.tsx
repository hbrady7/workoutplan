"use client";

import { useEffect, useState } from "react";
import {
  Beef,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Droplet,
  Pencil,
  Plus,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import {
  addDays,
  formatFriendly,
  timeOf,
  toDateStr,
} from "@/lib/dates";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { NumberStepper } from "@/components/number-stepper";
import { FoodEstimatorCard } from "@/components/food-estimator";
import { cn } from "@/lib/utils";

const QUICK_ADDS = [20, 30, 40];
const WATER_GOAL = 8;

export function NutritionTab() {
  const store = useStore();
  const [dateStr, setDateStr] = useState<string | null>(null);
  const [todayStr, setTodayStr] = useState<string | null>(null);

  useEffect(() => {
    const t = toDateStr(new Date());
    setTodayStr(t);
    setDateStr(t);
  }, []);

  if (!store.hydrated || !dateStr || !todayStr) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-72 w-full" />
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-28 w-full" />
      </div>
    );
  }

  const day = store.getNutrition(dateStr);
  const atToday = dateStr === todayStr;

  return (
    <div className="space-y-5 pb-2">
      {/* Date navigator */}
      <div className="flex items-center justify-between gap-2">
        <button
          aria-label="Previous day"
          onClick={() => setDateStr(addDays(dateStr, -1))}
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:bg-secondary active:bg-secondary"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <span className="text-sm font-semibold text-foreground">
          {formatFriendly(dateStr, todayStr)}
        </span>
        <button
          aria-label="Next day"
          disabled={atToday}
          onClick={() => setDateStr(addDays(dateStr, 1))}
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:bg-secondary active:bg-secondary disabled:opacity-30"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      <ProteinCard dateStr={dateStr} />
      <FoodEstimatorCard dateStr={dateStr} />
      <WaterCard dateStr={dateStr} water={day.water} />
      <SugarCard dateStr={dateStr} lowSugar={day.lowSugar} tally={day.sugarTally} />
      <CaloriesCard dateStr={dateStr} calories={day.calories} />
    </div>
  );
}

// ── Protein (the hero) ────────────────────────────────────────────────────
function ProteinCard({ dateStr }: { dateStr: string }) {
  const store = useStore();
  const day = store.getNutrition(dateStr);
  const target = store.proteinTarget;
  const total = day.proteinEntries.reduce((sum, e) => sum + e.grams, 0);
  const [custom, setCustom] = useState("");
  const [editingTarget, setEditingTarget] = useState(false);

  const add = (grams: number) => {
    if (grams <= 0) return;
    store.addProtein(dateStr, grams, new Date().toISOString());
  };

  return (
    <Card className="space-y-4 p-5">
      <div className="flex items-center gap-2">
        <Beef className="h-4 w-4 text-violet-400" />
        <h2 className="text-sm font-semibold text-foreground">Protein</h2>
        <button
          onClick={() => setEditingTarget((v) => !v)}
          className="ml-auto inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
        >
          <Pencil className="h-3 w-3" /> Target {target}g
        </button>
      </div>

      {editingTarget && (
        <TargetEditor
          current={target}
          onSave={(g) => {
            store.setProteinTarget(g);
            setEditingTarget(false);
          }}
        />
      )}

      <div className="flex flex-col items-center">
        <ProteinRing total={total} target={target} />
      </div>

      {/* Quick add */}
      <div className="flex justify-center gap-2">
        {QUICK_ADDS.map((g) => (
          <button
            key={g}
            onClick={() => add(g)}
            className="h-10 rounded-lg bg-violet-500/15 px-3 text-sm font-semibold text-violet-300 transition-colors hover:bg-violet-500/25 active:bg-violet-500/35"
          >
            +{g}g
          </button>
        ))}
      </div>

      {/* Custom add */}
      <div className="flex items-end gap-2">
        <div className="flex-1">
          <span className="mb-1 block text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            Custom
          </span>
          <NumberStepper
            value={custom}
            onChange={setCustom}
            step={5}
            placeholder="grams"
            ariaLabel="custom protein grams"
          />
        </div>
        <Button
          onClick={() => {
            add(Number(custom));
            setCustom("");
          }}
          disabled={custom.trim() === "" || Number(custom) <= 0}
          className="h-11 bg-violet-600 px-4 text-white hover:bg-violet-700"
        >
          <Plus className="h-4 w-4" /> Add
        </Button>
      </div>

      {/* Entries */}
      {day.proteinEntries.length > 0 && (
        <ul className="space-y-1 border-t border-border pt-3">
          {day.proteinEntries.map((e, i) => (
            <li
              key={i}
              className="flex items-center gap-2 text-sm text-foreground/90"
            >
              <span className="font-medium tabular-nums">{e.grams}g</span>
              <span className="text-xs text-muted-foreground">{timeOf(e.time)}</span>
              <button
                onClick={() => store.removeProtein(dateStr, i)}
                aria-label="Remove entry"
                className="ml-auto flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary hover:text-muted-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <p className="text-xs leading-relaxed text-muted-foreground">
        Protein first — it protects muscle in a deficit and keeps you full.
      </p>
    </Card>
  );
}

function ProteinRing({ total, target }: { total: number; target: number }) {
  const size = 132;
  const stroke = 12;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = target > 0 ? Math.min(1, total / target) : 0;
  const hit = total >= target && target > 0;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#26262b"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={hit ? "#34d399" : "#a78bfa"}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
          style={{ transition: "stroke-dashoffset 300ms ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-semibold tabular-nums text-foreground">
          {total}
        </span>
        <span className="text-xs text-muted-foreground">of {target}g</span>
      </div>
    </div>
  );
}

function TargetEditor({
  current,
  onSave,
}: {
  current: number;
  onSave: (grams: number) => void;
}) {
  const [grams, setGrams] = useState(String(current));
  const [bodyWeight, setBodyWeight] = useState("");

  const fromBw = () => {
    const lb = Number(bodyWeight);
    if (lb > 0) {
      const suggested = Math.round((lb * 0.8) / 5) * 5;
      setGrams(String(suggested));
    }
  };

  return (
    <div className="space-y-3 rounded-xl border border-border bg-secondary p-3">
      <div>
        <span className="mb-1 block text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
          Daily target (grams)
        </span>
        <NumberStepper
          value={grams}
          onChange={setGrams}
          step={5}
          placeholder="140"
          ariaLabel="protein target grams"
        />
      </div>
      <div>
        <span className="mb-1 block text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
          …or set from body weight (lb) — suggests ~0.8 g/lb
        </span>
        <div className="flex gap-2">
          <div className="flex-1">
            <NumberStepper
              value={bodyWeight}
              onChange={setBodyWeight}
              step={5}
              placeholder="e.g. 175"
              ariaLabel="body weight in pounds"
            />
          </div>
          <Button
            variant="outline"
            onClick={fromBw}
            className="h-11 border-border px-3 text-muted-foreground"
          >
            Suggest
          </Button>
        </div>
      </div>
      <Button
        onClick={() => onSave(Math.max(1, Number(grams) || current))}
        className="h-10 w-full bg-violet-600 text-white hover:bg-violet-700"
      >
        Save target
      </Button>
    </div>
  );
}

// ── Water ──────────────────────────────────────────────────────────────────
function WaterCard({ dateStr, water }: { dateStr: string; water: number }) {
  const store = useStore();
  return (
    <Card className="space-y-3 p-5">
      <div className="flex items-center gap-2">
        <Droplet className="h-4 w-4 text-cyan-400" />
        <h2 className="text-sm font-semibold text-foreground">Water</h2>
        <span className="ml-auto text-sm font-medium tabular-nums text-muted-foreground">
          {water} / {WATER_GOAL} cups
        </span>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {Array.from({ length: WATER_GOAL }).map((_, i) => {
          const filled = i < water;
          return (
            <button
              key={i}
              aria-label={`Set water to ${i + 1} cups`}
              onClick={() => store.setWater(dateStr, filled && water === i + 1 ? i : i + 1)}
              className={cn(
                "h-10 flex-1 rounded-lg border transition-colors",
                filled
                  ? "border-cyan-500/40 bg-cyan-500/20"
                  : "border-border bg-card hover:bg-secondary",
              )}
            />
          );
        })}
      </div>

      <div className="flex gap-2">
        <Button
          variant="outline"
          onClick={() => store.setWater(dateStr, water - 1)}
          disabled={water <= 0}
          className="h-10 flex-1 border-border"
        >
          − Cup
        </Button>
        <Button
          onClick={() => store.setWater(dateStr, water + 1)}
          className="h-10 flex-1 bg-cyan-600 text-white hover:bg-cyan-700"
        >
          + Cup
        </Button>
      </div>
    </Card>
  );
}

// ── Added sugar ──────────────────────────────────────────────────────────
function SugarCard({
  dateStr,
  lowSugar,
  tally,
}: {
  dateStr: string;
  lowSugar: boolean | null;
  tally: number;
}) {
  const store = useStore();
  return (
    <Card className="space-y-3 p-5">
      <h2 className="text-sm font-semibold text-foreground">Added sugar</h2>

      <button
        onClick={() => {
          const next = !(lowSugar === true);
          store.setLowSugar(dateStr, next);
          if (next) toast.success("Nice — sugar kept low today.");
        }}
        className={cn(
          "flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors",
          lowSugar === true
            ? "border-emerald-500/30 bg-emerald-500/10"
            : "border-border bg-card hover:bg-secondary",
        )}
      >
        <span
          className={cn(
            "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border",
            lowSugar === true
              ? "border-emerald-600 bg-emerald-600 text-white"
              : "border-zinc-600 bg-card",
          )}
        >
          {lowSugar === true && <span className="text-xs">✓</span>}
        </span>
        <span className="text-sm font-medium text-foreground">
          Kept added sugar low today
        </span>
      </button>

      <div className="flex items-center justify-between gap-2 rounded-xl border border-border bg-secondary/40 px-3 py-2">
        <span className="text-xs text-muted-foreground">Sugary items (optional)</span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => store.setSugarTally(dateStr, tally - 1)}
            disabled={tally <= 0}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground disabled:opacity-30"
            aria-label="Decrease sugary items"
          >
            −
          </button>
          <span className="w-6 text-center text-sm font-semibold tabular-nums text-foreground">
            {tally}
          </span>
          <button
            onClick={() => store.setSugarTally(dateStr, tally + 1)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground"
            aria-label="Increase sugary items"
          >
            +
          </button>
        </div>
      </div>

      <p className="text-xs leading-relaxed text-muted-foreground">
        Cutting added sugar is your single biggest lever.
      </p>
    </Card>
  );
}

// ── Calories (advanced, collapsed) ─────────────────────────────────────────
function CaloriesCard({
  dateStr,
  calories,
}: {
  dateStr: string;
  calories: number | null;
}) {
  const store = useStore();
  const [open, setOpen] = useState(calories != null);

  return (
    <Card className="p-4">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 text-sm font-medium text-muted-foreground"
      >
        <ChevronDown
          className={cn("h-4 w-4 transition-transform", open && "rotate-180")}
        />
        {calories != null ? `Calories · ${calories}` : "Add calories (optional)"}
      </button>

      {open && (
        <div className="mt-3 flex items-end gap-2">
          <div className="flex-1">
            <span className="mb-1 block text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              Calories today
            </span>
            <NumberStepper
              value={calories != null ? String(calories) : ""}
              onChange={(v) =>
                store.setCalories(dateStr, v.trim() === "" ? null : Number(v))
              }
              step={50}
              placeholder="optional"
              ariaLabel="calories"
            />
          </div>
          {calories != null && (
            <Button
              variant="outline"
              onClick={() => store.setCalories(dateStr, null)}
              className="h-11 border-border px-3 text-muted-foreground"
            >
              Clear
            </Button>
          )}
        </div>
      )}
    </Card>
  );
}
