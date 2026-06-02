// 4-Week Plan — single source of truth for all plan content.
// Beginner strength + fat-loss. No backend; the UI reads everything from here.

export type Category = "strength" | "zone2" | "intervals" | "rest";

export interface Exercise {
  id: string; // stable slug — also used as the localStorage log key
  name: string;
  muscle: string;
  cue: string;
  howToUrl: string;
  /** Optional rep/time guidance shown alongside the weekly target (e.g. plank, woodchop). */
  repNote?: string;
}

export interface Session {
  id: string; // stable slug — used in completion keys like `w1-strengthA`
  name: string;
  category: Category;
  day: string;
  exercises?: Exercise[];
  /** Description for cardio / non-exercise sessions. */
  note?: string;
  howToUrl?: string;
}

export interface WeekProgression {
  week: number;
  label: string;
  strengthSets: string; // human label, e.g. "3 × 10–12"
  strengthSetsCount: number; // number of working set rows to render/log
  strengthReps: string;
  effort: string;
  zone2Minutes: number; // Tue & Thu Zone 2 duration
  saturdayMinutes: number;
  thursdayIsIntervals: boolean;
}

// ── Meta ────────────────────────────────────────────────────────────────────
export const planTitle = "4-Week Plan";
export const planGoal =
  "Build muscle and an aerobic base while losing fat — a beginner strength + Zone 2 plan you can actually keep.";

export const dailyHabit =
  "7–10k steps + a 10–15 min walk after your biggest meal.";

export const warmupNote =
  "5 min — 3 min easy bike/treadmill → 10 bodyweight squats, 10 arm circles, 10 slow hip hinges → 1 light set of your first lift. Rest 75–90 sec between sets; lower every rep slowly.";

export const oneRule =
  "When you can hit the top of the rep range on every set with 2+ reps still in the tank, add the smallest weight increment next session. That's progressive overload — the single thing that makes this work. Don't chase soreness or grind to failure.";

// ── Principles (compact bullets for the Plan tab) ─────────────────────────────
export const principles: { source: string; text: string }[] = [
  {
    source: "Galpin",
    text: "Master the movement before adding load; leave reps in the tank (RIR) — more early, fewer later; change one variable at a time.",
  },
  {
    source: "Attia",
    text: "Build your Zone 2 aerobic base now, VO2 intervals come later; strength is your longevity + metabolic anchor.",
  },
  {
    source: "Huberman",
    text: "Same lifts every week so progress is trackable; protect 7–9 h sleep; get morning light.",
  },
  {
    source: "Liver throughline",
    text: "Muscle + Zone 2 + a modest deficit cut liver fat and body fat at the same time.",
  },
];

// ── Weekly schedule (Plan tab table) ──────────────────────────────────────────
export const scheduleRows: { day: string; session: string; category: Category }[] = [
  { day: "Mon", session: "Strength A", category: "strength" },
  { day: "Tue", session: "Zone 2 cardio", category: "zone2" },
  { day: "Wed", session: "Strength B", category: "strength" },
  { day: "Thu", session: "Zone 2 cardio (→ intervals in Week 4)", category: "zone2" },
  { day: "Fri", session: "Rest / travel", category: "rest" },
  { day: "Sat", session: "Long easy outdoor Zone 2 (walk/hike/jog)", category: "zone2" },
  { day: "Sun", session: "Rest or easy walk", category: "rest" },
];

// ── Strength A — full body ────────────────────────────────────────────────────
export const strengthA: Exercise[] = [
  {
    id: "goblet-squat",
    name: "Goblet Squat (DB)",
    muscle: "legs",
    cue: "Hold a DB at your chest, sit straight down between your knees, drive up through your heels.",
    howToUrl:
      "https://www.youtube.com/results?search_query=goblet+squat+proper+form",
  },
  {
    id: "db-bench-press",
    name: "DB Bench Press",
    muscle: "push/chest",
    cue: "Lower DBs to chest level, press up and slightly together, don't flare elbows wide. (Or machine chest press.)",
    howToUrl:
      "https://www.youtube.com/results?search_query=dumbbell+bench+press+form",
  },
  {
    id: "lat-pulldown",
    name: "Lat Pulldown",
    muscle: "pull/back",
    cue: "Pull the bar to your upper chest, squeeze shoulder blades down, control it back up.",
    howToUrl:
      "https://www.youtube.com/results?search_query=lat+pulldown+proper+form",
  },
  {
    id: "db-romanian-deadlift",
    name: "DB Romanian Deadlift",
    muscle: "hinge/hamstrings",
    cue: "Soft knees, push hips back, lower DBs along your legs, feel the hamstrings, keep a flat back.",
    howToUrl:
      "https://www.youtube.com/results?search_query=dumbbell+romanian+deadlift+form",
  },
  {
    id: "plank",
    name: "Plank",
    muscle: "core",
    cue: "Forearms down, straight line head to heels, squeeze glutes, don't let hips sag.",
    repNote: "3 × 30–45 sec",
    howToUrl: "https://www.youtube.com/results?search_query=plank+proper+form",
  },
];

// ── Strength B — full body ────────────────────────────────────────────────────
export const strengthB: Exercise[] = [
  {
    id: "db-reverse-lunge",
    name: "DB Reverse Lunge",
    muscle: "legs (single-side)",
    cue: "Step back, drop the back knee toward the floor, push through the front heel to stand. (→ Bulgarian split squat once it feels easy.)",
    howToUrl:
      "https://www.youtube.com/results?search_query=dumbbell+reverse+lunge+form",
  },
  {
    id: "db-shoulder-press",
    name: "DB Shoulder Press (seated)",
    muscle: "push/shoulders",
    cue: "Press DBs overhead without arching your back, lower to ear level.",
    howToUrl:
      "https://www.youtube.com/results?search_query=seated+dumbbell+shoulder+press+form",
  },
  {
    id: "seated-cable-row",
    name: "Seated Cable Row",
    muscle: "pull/back",
    cue: "Pull the handle to your stomach, squeeze shoulder blades, keep chest tall.",
    howToUrl:
      "https://www.youtube.com/results?search_query=seated+cable+row+form",
  },
  {
    id: "hip-thrust",
    name: "Hip Thrust (DB)",
    muscle: "glutes/hamstrings",
    cue: "Drive hips up, squeeze glutes at the top, keep ribs down. (Or Leg Curl machine.)",
    howToUrl:
      "https://www.youtube.com/results?search_query=dumbbell+hip+thrust+form",
  },
  {
    id: "cable-woodchop",
    name: "Cable Woodchop",
    muscle: "core/anti-rotation",
    cue: "Rotate from your trunk, arms fairly straight, control the return.",
    repNote: "10–12 each side",
    howToUrl:
      "https://www.youtube.com/results?search_query=cable+woodchopper+form",
  },
];

// ── Cardio copy ───────────────────────────────────────────────────────────────
export const zone2Note =
  "Conversational pace — you can talk in full sentences but wouldn't want to sing (~60–70% max HR). Incline walk, bike, or row.";
export const zone2HowToUrl =
  "https://www.youtube.com/results?search_query=what+is+zone+2+cardio";

export const saturdayNote =
  "Long easy effort outside — walk, hike, or jog. Keep it conversational.";

export const intervalsNote =
  "After a 5 min warm-up: 4 rounds of 3 min hard-but-sustainable / 3 min easy, then 5 min cooldown. Bike or incline treadmill.";
export const intervalsHowToUrl =
  "https://www.youtube.com/results?search_query=interval+training+beginner";

// ── Sessions tracked on the Train tab ─────────────────────────────────────────
// Thursday switches from zone2 → intervals in Week 4 (handled in the UI via
// the week's progression). Friday/Sunday rest days are shown on the Plan tab
// schedule but aren't tracked here.
export const sessions: Session[] = [
  {
    id: "strengthA",
    name: "Strength A",
    category: "strength",
    day: "Mon",
    exercises: strengthA,
  },
  {
    id: "zone2-tue",
    name: "Zone 2 cardio",
    category: "zone2",
    day: "Tue",
    note: zone2Note,
    howToUrl: zone2HowToUrl,
  },
  {
    id: "strengthB",
    name: "Strength B",
    category: "strength",
    day: "Wed",
    exercises: strengthB,
  },
  {
    id: "zone2-thu",
    name: "Zone 2 cardio",
    category: "zone2",
    day: "Thu",
    note: zone2Note,
    howToUrl: zone2HowToUrl,
  },
  {
    id: "friday-rest",
    name: "Rest / travel",
    category: "rest",
    day: "Fri",
    note: "Recovery day — light movement is fine, but rest is the work. Your muscles grow now.",
  },
  {
    id: "saturday",
    name: "Long outdoor Zone 2",
    category: "zone2",
    day: "Sat",
    note: saturdayNote,
    howToUrl: zone2HowToUrl,
  },
  {
    id: "sunday-rest",
    name: "Rest or easy walk",
    category: "rest",
    day: "Sun",
    note: "Easy day. A relaxed walk if you feel like it — otherwise just rest.",
  },
];

// ── 4-week progression (drives every per-week target) ─────────────────────────
export const progression: WeekProgression[] = [
  {
    week: 1,
    label: "Learn",
    strengthSets: "2 × 12",
    strengthSetsCount: 2,
    strengthReps: "12",
    effort: "light · leave 3–4 reps in tank",
    zone2Minutes: 30,
    saturdayMinutes: 45,
    thursdayIsIntervals: false,
  },
  {
    week: 2,
    label: "Build",
    strengthSets: "3 × 10–12",
    strengthSetsCount: 3,
    strengthReps: "10–12",
    effort: "leave 2–3 · nudge weight up",
    zone2Minutes: 35,
    saturdayMinutes: 50,
    thursdayIsIntervals: false,
  },
  {
    week: 3,
    label: "Push",
    strengthSets: "3 × 8–10 (heavier)",
    strengthSetsCount: 3,
    strengthReps: "8–10",
    effort: "leave 2",
    zone2Minutes: 40,
    saturdayMinutes: 55,
    thursdayIsIntervals: false,
  },
  {
    week: 4,
    label: "Peak",
    strengthSets: "3–4 × 8–10",
    strengthSetsCount: 4,
    strengthReps: "8–10",
    effort: "leave 1–2 on last set",
    zone2Minutes: 40, // Tue
    saturdayMinutes: 60,
    thursdayIsIntervals: true, // Thu → first intervals
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
export const WEEKS = [1, 2, 3, 4] as const;
export type WeekNumber = (typeof WEEKS)[number];

export function getProgression(week: number): WeekProgression {
  return progression.find((p) => p.week === week) ?? progression[0];
}

export function getSession(id: string): Session | undefined {
  return sessions.find((s) => s.id === id);
}

/** The category a session takes for a given week (Thu becomes intervals in W4). */
export function sessionCategoryForWeek(
  session: Session,
  week: number,
): Category {
  if (session.id === "zone2-thu" && getProgression(week).thursdayIsIntervals) {
    return "intervals";
  }
  return session.category;
}

export const categoryLabel: Record<Category, string> = {
  strength: "Strength",
  zone2: "Zone 2",
  intervals: "Intervals",
  rest: "Rest",
};

// Day ordering + names. JS Date.getDay(): 0=Sun … 6=Sat.
export const DAY_ORDER = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
export type DayAbbr = (typeof DAY_ORDER)[number];

const DAY_FULL: Record<DayAbbr, string> = {
  Mon: "Monday",
  Tue: "Tuesday",
  Wed: "Wednesday",
  Thu: "Thursday",
  Fri: "Friday",
  Sat: "Saturday",
  Sun: "Sunday",
};
const DOW_TO_ABBR: Record<number, DayAbbr> = {
  0: "Sun",
  1: "Mon",
  2: "Tue",
  3: "Wed",
  4: "Thu",
  5: "Fri",
  6: "Sat",
};

export function dayFull(abbr: string): string {
  return DAY_FULL[abbr as DayAbbr] ?? abbr;
}
export function abbrForDow(dow: number): DayAbbr | null {
  return DOW_TO_ABBR[dow] ?? null;
}

/** Plain-language one-liner describing what a day's session actually is. */
export function sessionWhatIsIt(session: Session, week: number): string {
  const prog = getProgression(week);
  switch (session.category) {
    case "strength":
      return `Full-body strength · ${prog.strengthSets}`;
    case "rest":
      return session.id === "friday-rest"
        ? "Recovery day — rest is part of the plan"
        : "Easy day — rest or a gentle walk";
    case "zone2":
      if (session.id === "zone2-thu" && prog.thursdayIsIntervals) {
        return "Intervals — 4 × 3 min hard / 3 min easy";
      }
      if (session.id === "saturday") {
        return `Long easy cardio outside, ~${prog.saturdayMinutes} min`;
      }
      return `Conversational-pace cardio, ~${prog.zone2Minutes} min`;
    default:
      return "";
  }
}

/** Short target line shown on a session card / detail header for a given week. */
export function sessionTargetSummary(session: Session, week: number): string {
  const prog = getProgression(week);
  if (session.category === "rest") {
    return session.id === "friday-rest" ? "Rest / travel" : "Rest or easy walk";
  }
  if (session.category === "strength") {
    return `${prog.strengthSets} · ${prog.effort}`;
  }
  if (session.id === "saturday") {
    return `${prog.saturdayMinutes} min · easy outdoor`;
  }
  if (session.id === "zone2-thu" && prog.thursdayIsIntervals) {
    return "4 × 3 min hard / 3 min easy · first intervals";
  }
  // zone2-tue and zone2-thu (non-interval weeks)
  return `${prog.zone2Minutes} min · conversational`;
}
