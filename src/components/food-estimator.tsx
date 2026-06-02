"use client";

import { useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import { vibrate } from "@/lib/haptics";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { NumberStepper } from "@/components/number-stepper";

interface Estimate {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  confidence: "low" | "medium" | "high";
  assumptions: string;
}

export function FoodEstimatorCard({ dateStr }: { dateStr: string }) {
  const store = useStore();
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Estimate | null>(null);
  const [protein, setProtein] = useState("");
  const [calories, setCalories] = useState("");

  const estimate = async () => {
    if (!text.trim()) return;
    if (typeof navigator !== "undefined" && navigator.onLine === false) {
      setError("You're offline — the estimator needs a connection.");
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/estimate-food", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: text }),
      });
      const json = await res.json();
      if (json.ok) {
        const data = json.data as Estimate;
        setResult(data);
        setProtein(String(data.protein_g));
        setCalories(String(data.calories));
      } else {
        setError(
          json.code === "NO_KEY"
            ? "AI isn't configured yet. Add a GEMINI_API_KEY to enable this."
            : json.error || "Something went wrong.",
        );
      }
    } catch {
      setError("Couldn't reach the estimator — check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const addToToday = () => {
    const p = Number(protein);
    if (p > 0) store.addProtein(dateStr, p, new Date().toISOString());
    const c = Number(calories);
    if (c > 0) store.setCalories(dateStr, c);
    vibrate(15);
    toast.success(`Added ${p}g protein from your meal.`);
    setResult(null);
    setText("");
  };

  return (
    <Card className="space-y-3 p-5">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-violet-600" />
        <h2 className="text-sm font-semibold text-foreground">Describe your food</h2>
      </div>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="e.g., grilled chicken breast, cup of rice, side salad"
        rows={2}
        className="w-full resize-none rounded-lg border border-border bg-card px-3 py-2 text-base text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-emerald-500 focus-visible:ring-2 focus-visible:ring-emerald-500/30"
      />

      <Button
        onClick={estimate}
        disabled={loading || !text.trim()}
        className="h-11 w-full bg-violet-600 text-white hover:bg-violet-700"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> Estimating…
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4" /> Estimate
          </>
        )}
      </Button>

      {error && (
        <p className="rounded-lg bg-secondary/60 px-3 py-2 text-xs text-muted-foreground">
          {error}
        </p>
      )}

      {result && (
        <div className="space-y-3 rounded-xl border border-border bg-secondary/40 p-3">
          <div className="flex items-baseline justify-between">
            <div>
              <span className="text-2xl font-semibold tabular-nums text-violet-700">
                {result.protein_g}g
              </span>
              <span className="ml-1 text-xs text-muted-foreground">protein</span>
            </div>
            <span className="text-sm tabular-nums text-foreground/80">
              ≈ {result.calories} cal
            </span>
          </div>

          <p className="text-[11px] text-muted-foreground">
            ≈ estimate ({result.confidence} confidence) — adjust if needed.
            {result.assumptions ? ` ${result.assumptions}` : ""}
          </p>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="mb-1 block text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                Protein (g)
              </span>
              <NumberStepper
                value={protein}
                onChange={setProtein}
                step={5}
                ariaLabel="estimated protein grams"
              />
            </div>
            <div>
              <span className="mb-1 block text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                Calories
              </span>
              <NumberStepper
                value={calories}
                onChange={setCalories}
                step={25}
                ariaLabel="estimated calories"
              />
            </div>
          </div>

          <Button
            onClick={addToToday}
            className="h-11 w-full bg-violet-600 text-white hover:bg-violet-700"
          >
            Add protein to today
          </Button>
        </div>
      )}
    </Card>
  );
}
