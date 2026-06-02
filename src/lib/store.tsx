"use client";

// Single localStorage-backed store for all app state: current week, session
// completion, per-set logs (weight/reps/done), and daily nutrition.
//
// Glitch-free principles:
//  - State is read from localStorage ONLY after mount (useEffect), never during
//    render, so server and first client render match (no hydration mismatch).
//  - `hydrated` lets the UI show skeletons of the same size until data loads
//    (no flash, no layout shift).
//  - Writes are debounced (~400ms) for high-frequency input typing, and flushed
//    immediately for discrete actions (checking a set, completing a session).

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

const STORAGE_KEY = "fwp:v1";
const WRITE_DEBOUNCE_MS = 400;

export interface SetEntry {
  week: number;
  sessionId: string;
  exerciseId: string;
  setIndex: number;
  weight: string;
  reps: string;
  done: boolean;
  date: string | null;
}

export interface SetLog {
  date: string;
  week: number;
  weight: number;
  reps: number;
}

interface SessionState {
  completed: boolean;
  completedAt: string | null;
}

export interface ProteinEntry {
  grams: number;
  time: string; // ISO
}

export interface DayNutrition {
  proteinEntries: ProteinEntry[];
  water: number;
  lowSugar: boolean | null;
  sugarTally: number;
  calories: number | null;
}

export function emptyDay(): DayNutrition {
  return {
    proteinEntries: [],
    water: 0,
    lowSugar: null,
    sugarTally: 0,
    calories: null,
  };
}

interface PersistShape {
  currentWeek: number;
  sessions: Record<string, SessionState>;
  sets: Record<string, SetEntry>;
  proteinTarget: number;
  nutrition: Record<string, DayNutrition>; // key: YYYY-MM-DD (local)
}

const emptyState: PersistShape = {
  currentWeek: 1,
  sessions: {},
  sets: {},
  proteinTarget: 140,
  nutrition: {},
};

function sessionKey(week: number, sessionId: string) {
  return `w${week}-${sessionId}`;
}
function setKey(
  week: number,
  sessionId: string,
  exerciseId: string,
  setIndex: number,
) {
  return `w${week}-${sessionId}-${exerciseId}-${setIndex}`;
}

interface StoreApi {
  hydrated: boolean;
  week: number;
  setWeek: (week: number) => void;

  isSessionComplete: (week: number, sessionId: string) => boolean;
  sessionCompletedAt: (week: number, sessionId: string) => string | null;
  setSessionComplete: (
    week: number,
    sessionId: string,
    completed: boolean,
  ) => void;

  getSet: (
    week: number,
    sessionId: string,
    exerciseId: string,
    setIndex: number,
  ) => SetEntry;
  updateSetField: (
    week: number,
    sessionId: string,
    exerciseId: string,
    setIndex: number,
    field: "weight" | "reps",
    value: string,
  ) => void;
  toggleSetDone: (
    week: number,
    sessionId: string,
    exerciseId: string,
    setIndex: number,
    done: boolean,
  ) => void;

  getExerciseLogs: (exerciseId: string) => SetLog[];

  // Nutrition
  proteinTarget: number;
  setProteinTarget: (grams: number) => void;
  getNutrition: (dateStr: string) => DayNutrition;
  addProtein: (dateStr: string, grams: number, time: string) => void;
  removeProtein: (dateStr: string, index: number) => void;
  setWater: (dateStr: string, cups: number) => void;
  setLowSugar: (dateStr: string, value: boolean) => void;
  setSugarTally: (dateStr: string, n: number) => void;
  setCalories: (dateStr: string, value: number | null) => void;

  resetAll: () => void;
}

const StoreContext = createContext<StoreApi | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<PersistShape>(emptyState);
  const [hydrated, setHydrated] = useState(false);

  // Keep a live ref to current state + the desired write mode for the next
  // persist. `immediate` flushes now; `debounce` coalesces rapid typing.
  const stateRef = useRef(state);
  const writeModeRef = useRef<"immediate" | "debounce">("immediate");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const writeNow = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stateRef.current));
    } catch {
      // storage full / unavailable — ignore
    }
  }, []);

  // Load once on mount. Tolerates missing/corrupt keys.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<PersistShape>;
        setState({
          currentWeek:
            typeof parsed.currentWeek === "number" ? parsed.currentWeek : 1,
          sessions: parsed.sessions ?? {},
          sets: parsed.sets ?? {},
          proteinTarget:
            typeof parsed.proteinTarget === "number" ? parsed.proteinTarget : 140,
          nutrition: parsed.nutrition ?? {},
        });
      }
    } catch {
      // ignore corrupt storage
    }
    setHydrated(true);
  }, []);

  // Persist on change (after hydration). Debounce typing; flush other actions.
  useEffect(() => {
    stateRef.current = state;
    if (!hydrated) return;
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (writeModeRef.current === "debounce") {
      timerRef.current = setTimeout(writeNow, WRITE_DEBOUNCE_MS);
    } else {
      writeNow();
    }
  }, [state, hydrated, writeNow]);

  // Flush any pending debounced write on unmount.
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        writeNow();
      }
    };
  }, [writeNow]);

  const mutate = useCallback(
    (mode: "immediate" | "debounce", updater: (s: PersistShape) => PersistShape) => {
      writeModeRef.current = mode;
      setState(updater);
    },
    [],
  );

  const setWeek = useCallback(
    (week: number) => mutate("immediate", (s) => ({ ...s, currentWeek: week })),
    [mutate],
  );

  const setSessionComplete = useCallback(
    (week: number, sessionId: string, completed: boolean) =>
      mutate("immediate", (s) => ({
        ...s,
        sessions: {
          ...s.sessions,
          [sessionKey(week, sessionId)]: {
            completed,
            completedAt: completed ? new Date().toISOString() : null,
          },
        },
      })),
    [mutate],
  );

  const ensureSet = (
    s: PersistShape,
    week: number,
    sessionId: string,
    exerciseId: string,
    setIndex: number,
  ): SetEntry =>
    s.sets[setKey(week, sessionId, exerciseId, setIndex)] ?? {
      week,
      sessionId,
      exerciseId,
      setIndex,
      weight: "",
      reps: "",
      done: false,
      date: null,
    };

  const updateSetField = useCallback(
    (
      week: number,
      sessionId: string,
      exerciseId: string,
      setIndex: number,
      field: "weight" | "reps",
      value: string,
    ) =>
      mutate("debounce", (s) => {
        const k = setKey(week, sessionId, exerciseId, setIndex);
        const prev = ensureSet(s, week, sessionId, exerciseId, setIndex);
        return { ...s, sets: { ...s.sets, [k]: { ...prev, [field]: value } } };
      }),
    [mutate],
  );

  const toggleSetDone = useCallback(
    (
      week: number,
      sessionId: string,
      exerciseId: string,
      setIndex: number,
      done: boolean,
    ) =>
      mutate("immediate", (s) => {
        const k = setKey(week, sessionId, exerciseId, setIndex);
        const prev = ensureSet(s, week, sessionId, exerciseId, setIndex);
        return {
          ...s,
          sets: {
            ...s.sets,
            [k]: { ...prev, done, date: done ? new Date().toISOString() : null },
          },
        };
      }),
    [mutate],
  );

  // ── Nutrition mutators ──────────────────────────────────────────────────
  const ensureDay = (s: PersistShape, dateStr: string): DayNutrition =>
    s.nutrition[dateStr] ?? emptyDay();

  const setProteinTarget = useCallback(
    (grams: number) =>
      mutate("immediate", (s) => ({ ...s, proteinTarget: grams })),
    [mutate],
  );

  const addProtein = useCallback(
    (dateStr: string, grams: number, time: string) =>
      mutate("immediate", (s) => {
        const day = ensureDay(s, dateStr);
        return {
          ...s,
          nutrition: {
            ...s.nutrition,
            [dateStr]: {
              ...day,
              proteinEntries: [...day.proteinEntries, { grams, time }],
            },
          },
        };
      }),
    [mutate],
  );

  const removeProtein = useCallback(
    (dateStr: string, index: number) =>
      mutate("immediate", (s) => {
        const day = ensureDay(s, dateStr);
        return {
          ...s,
          nutrition: {
            ...s.nutrition,
            [dateStr]: {
              ...day,
              proteinEntries: day.proteinEntries.filter((_, i) => i !== index),
            },
          },
        };
      }),
    [mutate],
  );

  const setWater = useCallback(
    (dateStr: string, cups: number) =>
      mutate("immediate", (s) => {
        const day = ensureDay(s, dateStr);
        return {
          ...s,
          nutrition: {
            ...s.nutrition,
            [dateStr]: { ...day, water: Math.max(0, cups) },
          },
        };
      }),
    [mutate],
  );

  const setLowSugar = useCallback(
    (dateStr: string, value: boolean) =>
      mutate("immediate", (s) => {
        const day = ensureDay(s, dateStr);
        return {
          ...s,
          nutrition: {
            ...s.nutrition,
            [dateStr]: { ...day, lowSugar: value },
          },
        };
      }),
    [mutate],
  );

  const setSugarTally = useCallback(
    (dateStr: string, n: number) =>
      mutate("immediate", (s) => {
        const day = ensureDay(s, dateStr);
        return {
          ...s,
          nutrition: {
            ...s.nutrition,
            [dateStr]: { ...day, sugarTally: Math.max(0, n) },
          },
        };
      }),
    [mutate],
  );

  const setCalories = useCallback(
    (dateStr: string, value: number | null) =>
      mutate("immediate", (s) => {
        const day = ensureDay(s, dateStr);
        return {
          ...s,
          nutrition: {
            ...s.nutrition,
            [dateStr]: { ...day, calories: value },
          },
        };
      }),
    [mutate],
  );

  const resetAll = useCallback(() => {
    writeModeRef.current = "immediate";
    setState({ ...emptyState });
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }, []);

  const api = useMemo<StoreApi>(
    () => ({
      hydrated,
      week: state.currentWeek,
      setWeek,
      isSessionComplete: (week, sessionId) =>
        state.sessions[sessionKey(week, sessionId)]?.completed ?? false,
      sessionCompletedAt: (week, sessionId) =>
        state.sessions[sessionKey(week, sessionId)]?.completedAt ?? null,
      setSessionComplete,
      getSet: (week, sessionId, exerciseId, setIndex) =>
        state.sets[setKey(week, sessionId, exerciseId, setIndex)] ?? {
          week,
          sessionId,
          exerciseId,
          setIndex,
          weight: "",
          reps: "",
          done: false,
          date: null,
        },
      updateSetField,
      toggleSetDone,
      getExerciseLogs: (exerciseId) =>
        Object.values(state.sets)
          .filter(
            (e) =>
              e.exerciseId === exerciseId &&
              e.done &&
              e.date !== null &&
              e.weight.trim() !== "" &&
              e.reps.trim() !== "",
          )
          .map((e) => ({
            date: e.date as string,
            week: e.week,
            weight: Number(e.weight),
            reps: Number(e.reps),
          }))
          .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0)),
      proteinTarget: state.proteinTarget,
      setProteinTarget,
      getNutrition: (dateStr) => state.nutrition[dateStr] ?? emptyDay(),
      addProtein,
      removeProtein,
      setWater,
      setLowSugar,
      setSugarTally,
      setCalories,
      resetAll,
    }),
    [
      hydrated,
      state,
      setWeek,
      setSessionComplete,
      updateSetField,
      toggleSetDone,
      setProteinTarget,
      addProtein,
      removeProtein,
      setWater,
      setLowSugar,
      setSugarTally,
      setCalories,
      resetAll,
    ],
  );

  return <StoreContext.Provider value={api}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreApi {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within <StoreProvider>");
  return ctx;
}

export { sessionKey, setKey };
