import type { Category } from "@/data/plan";

// Scannable category accents, brightened for the dark theme.
// strength = emerald · zone2 = sky · intervals = amber · rest = zinc
export const categoryStyles: Record<
  Category,
  { badge: string; leftBorder: string; dot: string }
> = {
  strength: {
    badge: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    leftBorder: "border-l-emerald-500",
    dot: "bg-emerald-400",
  },
  zone2: {
    badge: "bg-sky-500/10 text-sky-400 border-sky-500/30",
    leftBorder: "border-l-sky-500",
    dot: "bg-sky-400",
  },
  intervals: {
    badge: "bg-amber-500/10 text-amber-400 border-amber-500/30",
    leftBorder: "border-l-amber-400",
    dot: "bg-amber-400",
  },
  rest: {
    badge: "bg-zinc-500/10 text-zinc-400 border-zinc-600",
    leftBorder: "border-l-zinc-600",
    dot: "bg-zinc-500",
  },
};
