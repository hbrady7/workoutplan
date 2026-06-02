"use client";

// Single localStorage-backed store for all app state: current week, session
// completion, and per-set logs (weight, reps, done) keyed by week/session/
// exercise/set. One namespaced key holds everything as JSON. Reads on mount,
// writes on every change. Tolerates missing/corrupt keys on first load.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const STORAGE_KEY = "fwp:v1";

export interface SetEntry {
  week: number;
  sessionId: string;
  exerciseId: string;
  setIndex: number;
  weight: string; // kept as string so the input can be empty
  reps: string;
  done: boolean;
  date: string | null; // ISO timestamp of when the set was marked done
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

interface PersistShape {
  currentWeek: number;
  sessions: Record<string, SessionState>; // key: `w{week}-{sessionId}`
  sets: Record<string, SetEntry>; // key: `w{week}-{sessionId}-{exerciseId}-{setIndex}`
}

const emptyState: PersistShape = {
  currentWeek: 1,
  sessions: {},
  sets: {},
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

  /** Completed, numeric logs for one exercise, newest first. */
  getExerciseLogs: (exerciseId: string) => SetLog[];

  resetAll: () => void;
}

const StoreContext = createContext<StoreApi | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<PersistShape>(emptyState);
  const [hydrated, setHydrated] = useState(false);

  // Load once on mount. Guarded so a missing/corrupt key never crashes.
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
        });
      }
    } catch {
      // ignore corrupt storage — fall back to empty state
    }
    setHydrated(true);
  }, []);

  // Persist on change, but only after the initial load so defaults don't
  // clobber stored data.
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // storage full / unavailable — silently ignore
    }
  }, [state, hydrated]);

  const setWeek = useCallback((week: number) => {
    setState((s) => ({ ...s, currentWeek: week }));
  }, []);

  const setSessionComplete = useCallback(
    (week: number, sessionId: string, completed: boolean) => {
      setState((s) => ({
        ...s,
        sessions: {
          ...s.sessions,
          [sessionKey(week, sessionId)]: {
            completed,
            completedAt: completed ? new Date().toISOString() : null,
          },
        },
      }));
    },
    [],
  );

  const updateSetField = useCallback(
    (
      week: number,
      sessionId: string,
      exerciseId: string,
      setIndex: number,
      field: "weight" | "reps",
      value: string,
    ) => {
      setState((s) => {
        const k = setKey(week, sessionId, exerciseId, setIndex);
        const prev: SetEntry = s.sets[k] ?? {
          week,
          sessionId,
          exerciseId,
          setIndex,
          weight: "",
          reps: "",
          done: false,
          date: null,
        };
        return {
          ...s,
          sets: { ...s.sets, [k]: { ...prev, [field]: value } },
        };
      });
    },
    [],
  );

  const toggleSetDone = useCallback(
    (
      week: number,
      sessionId: string,
      exerciseId: string,
      setIndex: number,
      done: boolean,
    ) => {
      setState((s) => {
        const k = setKey(week, sessionId, exerciseId, setIndex);
        const prev: SetEntry = s.sets[k] ?? {
          week,
          sessionId,
          exerciseId,
          setIndex,
          weight: "",
          reps: "",
          done: false,
          date: null,
        };
        return {
          ...s,
          sets: {
            ...s.sets,
            [k]: {
              ...prev,
              done,
              date: done ? new Date().toISOString() : null,
            },
          },
        };
      });
    },
    [],
  );

  const resetAll = useCallback(() => {
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
      resetAll,
    }),
    [hydrated, state, setWeek, setSessionComplete, updateSetField, toggleSetDone, resetAll],
  );

  return <StoreContext.Provider value={api}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreApi {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within <StoreProvider>");
  return ctx;
}

// Re-exported so other modules can build the same composite keys if needed.
export { sessionKey, setKey };
