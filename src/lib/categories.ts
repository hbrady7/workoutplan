import type { Category } from "@/data/plan";

// Scannable, beginner-friendly color accents per session type.
// strength = emerald · zone2 = sky/blue · intervals = amber · rest = stone
export const categoryStyles: Record<
  Category,
  { badge: string; leftBorder: string; dot: string }
> = {
  strength: {
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
    leftBorder: "border-l-emerald-500",
    dot: "bg-emerald-500",
  },
  zone2: {
    badge: "bg-sky-50 text-sky-700 border-sky-200",
    leftBorder: "border-l-sky-500",
    dot: "bg-sky-500",
  },
  intervals: {
    badge: "bg-amber-50 text-amber-700 border-amber-200",
    leftBorder: "border-l-amber-500",
    dot: "bg-amber-500",
  },
  rest: {
    badge: "bg-stone-100 text-stone-600 border-stone-200",
    leftBorder: "border-l-stone-400",
    dot: "bg-stone-400",
  },
};
