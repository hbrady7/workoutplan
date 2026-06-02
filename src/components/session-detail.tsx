"use client";

import { ExternalLink, Info } from "lucide-react";
import {
  getProgression,
  intervalsHowToUrl,
  intervalsNote,
  sessionCategoryForWeek,
  warmupNote,
  type Session,
} from "@/data/plan";
import { categoryLabel } from "@/data/plan";
import { categoryStyles } from "@/lib/categories";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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
        className="w-full gap-0 overflow-y-auto sm:max-w-md"
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
  const cat = sessionCategoryForWeek(session, week);
  const isStrength = session.category === "strength";

  return (
    <>
      <SheetHeader className="px-4 pt-4">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={categoryStyles[cat].badge}>
            {categoryLabel[cat]}
          </Badge>
          <span className="text-xs font-medium text-stone-400">
            {session.day}
          </span>
        </div>
        <SheetTitle className="text-xl text-stone-900">
          {isStrength ? session.name : cat === "intervals" ? "Intervals" : session.name}
        </SheetTitle>
        <SheetDescription className="sr-only">
          Session details for {session.name}, week {week}
        </SheetDescription>
      </SheetHeader>

      <div className="space-y-4 p-4">
        {isStrength ? (
          <StrengthDetail session={session} week={week} />
        ) : (
          <CardioDetail session={session} week={week} cat={cat} />
        )}
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
          <Card key={ex.id} className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-stone-900">
                  {ex.name}
                </h3>
                <span className="text-xs text-stone-400">{ex.muscle}</span>
              </div>
            </div>

            <p className="mt-2 text-xs leading-relaxed text-stone-600">
              {ex.cue}
            </p>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Badge
                variant="outline"
                className="border-emerald-200 bg-emerald-50 font-medium text-emerald-700"
              >
                {ex.repNote ?? `${prog.strengthSets}`}
              </Badge>
              <span className="text-xs text-stone-400">{prog.effort}</span>
            </div>

            <a
              href={ex.howToUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-emerald-700 hover:underline"
            >
              Watch how <ExternalLink className="h-3 w-3" />
            </a>
          </Card>
        ))}
      </div>
    </>
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
