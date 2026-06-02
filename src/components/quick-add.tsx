"use client";

import { useEffect, useState } from "react";
import { Beef, Droplet, Plus } from "lucide-react";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import { toDateStr } from "@/lib/dates";
import { vibrate } from "@/lib/haptics";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

const PROTEIN_ADDS = [20, 30, 40];

export function QuickAdd() {
  const store = useStore();
  const [today, setToday] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  useEffect(() => setToday(toDateStr(new Date())), []);

  if (!store.hydrated || !today) return null;

  const day = store.getNutrition(today);
  const protein = day.proteinEntries.reduce((s, e) => s + e.grams, 0);

  const addProtein = (g: number) => {
    store.addProtein(today, g, new Date().toISOString());
    vibrate(15);
    toast.success(`+${g}g protein`);
  };
  const addwater = () => {
    store.setWater(today, day.water + 1);
    vibrate(15);
    toast.success("+1 cup water");
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Quick add protein or water"
        className="fixed bottom-20 right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-600 text-white shadow-lg shadow-emerald-600/25 transition-transform active:scale-95 md:bottom-6"
      >
        <Plus className="h-6 w-6" />
      </button>
      <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent
        side="bottom"
        className="mx-auto max-w-md gap-0 rounded-t-2xl pb-[max(1.25rem,env(safe-area-inset-bottom))]"
      >
        <SheetHeader className="px-4 pt-4">
          <SheetTitle className="text-base">Quick add — today</SheetTitle>
          <SheetDescription className="text-xs">
            {protein}g protein · {day.water} cups water so far
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4 px-4 pt-3">
          <div>
            <div className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-violet-700">
              <Beef className="h-3.5 w-3.5" /> Protein
            </div>
            <div className="flex gap-2">
              {PROTEIN_ADDS.map((g) => (
                <button
                  key={g}
                  onClick={() => addProtein(g)}
                  className="h-12 flex-1 rounded-xl bg-violet-50 text-sm font-semibold text-violet-700 transition-colors active:bg-violet-200"
                >
                  +{g}g
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-cyan-600">
              <Droplet className="h-3.5 w-3.5" /> Water
            </div>
            <button
              onClick={addwater}
              className="h-12 w-full rounded-xl bg-cyan-100 text-sm font-semibold text-cyan-700 transition-colors active:bg-cyan-200"
            >
              + Add a cup
            </button>
          </div>
        </div>
      </SheetContent>
      </Sheet>
    </>
  );
}
