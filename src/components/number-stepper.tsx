"use client";

import { Minus, Plus } from "lucide-react";

// Compact − / value / + stepper with a real editable input in the middle.
// The input keeps precise entry; the buttons make phone tapping painless.
export function NumberStepper({
  value,
  onChange,
  step,
  min = 0,
  decimal = false,
  placeholder,
  ariaLabel,
}: {
  value: string;
  onChange: (next: string) => void;
  step: number;
  min?: number;
  decimal?: boolean;
  placeholder?: string;
  ariaLabel?: string;
}) {
  const current = value.trim() === "" ? NaN : Number(value);

  const fmt = (n: number) => {
    const rounded = Math.round(n * 100) / 100;
    return String(rounded);
  };

  const bump = (dir: 1 | -1) => {
    const base = Number.isFinite(current) ? current : 0;
    const next = Math.max(min, base + dir * step);
    onChange(fmt(next));
  };

  return (
    <div className="flex items-stretch gap-1">
      <button
        type="button"
        aria-label={`Decrease ${ariaLabel ?? ""}`}
        onClick={() => bump(-1)}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:bg-secondary active:bg-secondary"
      >
        <Minus className="h-4 w-4" />
      </button>
      <input
        type="text"
        inputMode={decimal ? "decimal" : "numeric"}
        pattern={decimal ? "[0-9]*[.,]?[0-9]*" : "[0-9]*"}
        value={value}
        placeholder={placeholder}
        aria-label={ariaLabel}
        onChange={(e) => {
          const v = e.target.value;
          // allow only digits + optional single decimal point
          const cleaned = decimal
            ? v.replace(/[^0-9.]/g, "").replace(/(\..*)\./g, "$1")
            : v.replace(/[^0-9]/g, "");
          onChange(cleaned);
        }}
        className="h-11 w-full min-w-0 flex-1 rounded-lg border border-border bg-card text-center text-base font-medium tabular-nums text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-emerald-500 focus-visible:ring-2 focus-visible:ring-emerald-500/30"
      />
      <button
        type="button"
        aria-label={`Increase ${ariaLabel ?? ""}`}
        onClick={() => bump(1)}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:bg-secondary active:bg-secondary"
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}
