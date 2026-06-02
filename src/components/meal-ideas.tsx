"use client";

import { useState } from "react";
import { ChefHat, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import { vibrate } from "@/lib/haptics";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Idea {
  name: string;
  description: string;
  approx_protein_g: number;
  why_it_fits: string;
}

export function MealIdeasCard({ dateStr }: { dateStr: string }) {
  const store = useStore();
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ideas, setIdeas] = useState<Idea[] | null>(null);

  const getIdeas = async () => {
    if (!text.trim()) return;
    if (typeof navigator !== "undefined" && navigator.onLine === false) {
      setError("You're offline — meal ideas need a connection.");
      return;
    }
    setLoading(true);
    setError(null);
    setIdeas(null);
    try {
      const res = await fetch("/api/meal-ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ingredients: text }),
      });
      const json = await res.json();
      if (json.ok) {
        setIdeas(json.data as Idea[]);
      } else {
        setError(
          json.code === "NO_KEY"
            ? "AI isn't configured yet. Add a GEMINI_API_KEY to enable this."
            : json.error || "Something went wrong.",
        );
      }
    } catch {
      setError("Couldn't reach the kitchen — check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const logProtein = (idea: Idea) => {
    if (idea.approx_protein_g > 0) {
      store.addProtein(dateStr, idea.approx_protein_g, new Date().toISOString());
      vibrate(15);
      toast.success(`Logged ~${idea.approx_protein_g}g protein from ${idea.name}.`);
    }
  };

  return (
    <Card className="space-y-3 p-5">
      <div className="flex items-center gap-2">
        <ChefHat className="h-4 w-4 text-violet-400" />
        <h2 className="text-sm font-semibold text-foreground">
          What&apos;s in your kitchen?
        </h2>
      </div>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="list what you have — e.g., eggs, Greek yogurt, oats, chicken, spinach"
        rows={2}
        className="w-full resize-none rounded-lg border border-border bg-card px-3 py-2 text-base text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-emerald-500 focus-visible:ring-2 focus-visible:ring-emerald-500/30"
      />

      <Button
        onClick={getIdeas}
        disabled={loading || !text.trim()}
        className="h-11 w-full bg-violet-600 text-white hover:bg-violet-700"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> Thinking…
          </>
        ) : (
          <>
            <ChefHat className="h-4 w-4" /> Get ideas
          </>
        )}
      </Button>

      {error && (
        <p className="rounded-lg bg-secondary/60 px-3 py-2 text-xs text-muted-foreground">
          {error}
        </p>
      )}

      {ideas && (
        <div className="space-y-2">
          {ideas.map((idea, i) => (
            <div
              key={i}
              className="rounded-xl border border-border bg-secondary/40 p-3"
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-sm font-semibold text-foreground">
                  {idea.name}
                </h3>
                <span className="shrink-0 rounded-full bg-violet-500/15 px-2 py-0.5 text-[11px] font-medium text-violet-300">
                  ~{idea.approx_protein_g}g
                </span>
              </div>
              {idea.description && (
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  {idea.description}
                </p>
              )}
              {idea.why_it_fits && (
                <p className="mt-1 text-[11px] text-emerald-400">
                  {idea.why_it_fits}
                </p>
              )}
              {idea.approx_protein_g > 0 && (
                <button
                  onClick={() => logProtein(idea)}
                  className="mt-2 inline-flex h-8 items-center gap-1 rounded-lg bg-violet-500/15 px-2.5 text-xs font-medium text-violet-300 transition-colors hover:bg-violet-500/25"
                >
                  <Plus className="h-3 w-3" /> Log ~{idea.approx_protein_g}g protein
                </button>
              )}
            </div>
          ))}
          <p className="text-[11px] text-muted-foreground">
            ≈ approximate — protein values are rough estimates.
          </p>
        </div>
      )}
    </Card>
  );
}
