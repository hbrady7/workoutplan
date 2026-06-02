"use client";

import { useState } from "react";
import { Check, ExternalLink, Info, Timer } from "lucide-react";
import {
  categoryLabel,
  getProgression,
  intervalsHowToUrl,
  intervalsNote,
  sessionCategoryForWeek,
  warmupNote,
  type Exercise,
  type Session,
} from "@/data/plan";
import { categoryStyles } from "@/lib/categories";
import { useStore } from "@/lib/store";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { NumberStepper } from "@/components/number-stepper";
import { RestTimer } from "@/components/rest-timer";
import { cn } from "@/lib/utils";

export function SessionDetailSheet({
  session,
  week,
  open,
  onOpenChange,
}: {
  session: Session | null;
  week: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="relative flex h-full w-full flex-col gap-0 p-0 sm:max-w-md"
      >
        {session && <SessionDetailContent session={session} week={week} />}
      </SheetContent>
    </Sheet>
  );
}

function SessionDetailContent({
  session,
  week,
}: {
  session: Session;
  week: number;
}) {
  const store = useStore();
  const [showTimer, setShowTimer] = useState(false);
  const cat = sessionCategoryForWeek(session, week);
  const isStrength = session.category === "strength";
  const complete = store.isSessionComplete(week, session.id);

  const title =
    isStrength || cat !== "intervals" ? session.name : "Intervals";

  return (
    <>
      <SheetHeader className="shrink-0 px-4 pt-4">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={categoryStyles[cat].badge}>
            {categoryLabel[cat]}
          </Badge>
          <span className="text-xs font-medium text-stone-400">
            {session.day}
          </span>
        </div>
        <SheetTitle className="text-xl text-stone-900">{title}</SheetTitle>
        <SheetDescription className="sr-only">
          Session details for {title}, week {week}
        </SheetDescription>
      </SheetHeader>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 pb-4">
        {isStrength ? (
          <StrengthDetail session={session} week={week} />
        ) : (
          <CardioDetail session={session} week={week} cat={cat} />
        )}
      </div>

      {/* Rest timer overlay */}
      {showTimer && (
        <div className="absolute inset-x-3 bottom-[4.75rem] z-10">
          <RestTimer onClose={() => setShowTimer(false)} />
        </div>
      )}

      {/* Sticky footer actions */}
      <div className="flex shrink-0 gap-2 border-t border-stone-200 bg-white p-3">
        {isStrength && (
          <Button
            variant="outline"
            onClick={() => setShowTimer((v) => !v)}
            className="h-11 border-stone-200"
            aria-pressed={showTimer}
          >
            <Timer className="h-4 w-4" /> Rest timer
          </Button>
        )}
        <Button
          onClick={() => store.setSessionComplete(week, session.id, !complete)}
          className={cn(
            "h-11 flex-1",
            complete
              ? "bg-emerald-600 text-white hover:bg-emerald-700"
              : "bg-stone-900 text-white hover:bg-stone-800",
          )}
        >
          {complete ? (
            <>
              <Check className="h-4 w-4" /> Completed
            </>
          ) : (
            "Mark session complete"
          )}
        </Button>
      </div>
    </>
  );
}

function StrengthDetail({ session, week }: { session: Session; week: number }) {
  const prog = getProgression(week);

  return (
    <>
      <Card className="flex items-start gap-2.5 border-stone-200 bg-stone-50 p-3.5">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-stone-400" />
        <p className="text-xs leading-relaxed text-stone-600">
          <span className="font-medium text-stone-800">Warm-up · </span>
          {warmupNote}
        </p>
      </Card>

      <div className="space-y-3">
        {session.exercises?.map((ex) => (
          <ExerciseCard
            key={ex.id}
            exercise={ex}
            session={session}
            week={week}
            sets={prog.strengthSetsCount}
            effort={prog.effort}
            target={ex.repNote ?? prog.strengthSets}
          />
        ))}
      </div>
    </>
  );
}

function ExerciseCard({
  exercise,
  session,
  week,
  sets,
  effort,
  target,
}: {
  exercise: Exercise;
  session: Session;
  week: number;
  sets: number;
  effort: string;
  target: string;
}) {
  const store = useStore();

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-stone-900">
            {exercise.name}
          </h3>
          <span className="text-xs text-stone-400">{exercise.muscle}</span>
        </div>
        <a
          href={exercise.howToUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-emerald-700 hover:underline"
        >
          Watch how <ExternalLink className="h-3 w-3" />
        </a>
      </div>

      <p className="mt-2 text-xs leading-relaxed text-stone-600">
        {exercise.cue}
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Badge
          variant="outline"
          className="border-emerald-200 bg-emerald-50 font-medium text-emerald-700"
        >
          {target}
        </Badge>
        <span className="text-xs text-stone-400">{effort}</span>
      </div>

      {/* Set rows — one card per set, two-column stepper entry (phone-friendly) */}
      <div className="mt-3 space-y-2">
        {Array.from({ length: sets }).map((_, i) => {
          const entry = store.getSet(week, session.id, exercise.id, i);
          return (
            <div
              key={i}
              className={cn(
                "rounded-xl border p-2.5 transition-colors",
                entry.done
                  ? "border-emerald-200 bg-emerald-50/50"
                  : "border-stone-100 bg-stone-50/50",
              )}
            >
              <label className="flex items-center gap-2 pb-2">
                <Checkbox
                  className="size-5"
                  checked={entry.done}
                  onCheckedChange={(checked) =>
                    store.toggleSetDone(
                      week,
                      session.id,
                      exercise.id,
                      i,
                      checked === true,
                    )
                  }
                  aria-label={`Mark set ${i + 1} of ${exercise.name} done`}
                />
                <span className="text-xs font-semibold text-stone-700">
                  Set {i + 1}
                </span>
                {entry.done && (
                  <span className="ml-auto text-[11px] font-medium text-emerald-600">
                    logged
                  </span>
                )}
              </label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="mb-1 block text-[10px] font-medium uppercase tracking-wide text-stone-400">
                    Weight (lb)
                  </span>
                  <NumberStepper
                    value={entry.weight}
                    onChange={(v) =>
                      store.updateSetField(
                        week,
                        session.id,
                        exercise.id,
                        i,
                        "weight",
                        v,
                      )
                    }
                    step={2.5}
                    decimal
                    placeholder="0"
                    ariaLabel={`weight for set ${i + 1}`}
                  />
                </div>
                <div>
                  <span className="mb-1 block text-[10px] font-medium uppercase tracking-wide text-stone-400">
                    Reps
                  </span>
                  <NumberStepper
                    value={entry.reps}
                    onChange={(v) =>
                      store.updateSetField(
                        week,
                        session.id,
                        exercise.id,
                        i,
                        "reps",
                        v,
                      )
                    }
                    step={1}
                    placeholder="0"
                    ariaLabel={`reps for set ${i + 1}`}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function CardioDetail({
  session,
  week,
  cat,
}: {
  session: Session;
  week: number;
  cat: ReturnType<typeof sessionCategoryForWeek>;
}) {
  const prog = getProgression(week);
  const isIntervals = cat === "intervals";

  const note = isIntervals ? intervalsNote : session.note;
  const howToUrl = isIntervals ? intervalsHowToUrl : session.howToUrl;
  const targetLabel = isIntervals
    ? "4 × 3 min hard / 3 min easy"
    : session.id === "saturday"
      ? `${prog.saturdayMinutes} min`
      : `${prog.zone2Minutes} min`;

  return (
    <Card className="space-y-4 p-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-stone-400">
          This week&apos;s target
        </p>
        <p className="mt-1 text-2xl font-semibold text-stone-900">
          {targetLabel}
        </p>
      </div>

      <p className="text-sm leading-relaxed text-stone-600">{note}</p>

      {howToUrl && (
        <a
          href={howToUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 hover:underline"
        >
          Watch how <ExternalLink className="h-3 w-3" />
        </a>
      )}
    </Card>
  );
}
