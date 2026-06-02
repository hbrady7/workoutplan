"use client";

// Single localStorage-backed store for all app state: current week, session
// completion, per-set check states, and per-exercise weight/rep logs.
// One namespaced key holds everything as JSON. Reads on mount, writes on change.

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

export interface SetLog {
  date: string; // ISO
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
  setChecks: Record<string, boolean>; // key: `w{week}-{sessionId}-{exerciseId}-{setIndex}`
  logs: Record<string, SetLog[]>; // key: exerciseId
}

const emptyState: PersistShape = {
  currentWeek: 1,
  sessions: {},
  setChecks: {},
  logs: {},
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

  isSetChecked: (
    week: number,
    sessionId: string,
    exerciseId: string,
    setIndex: number,
  ) => boolean;
  toggleSetChecked: (
    week: number,
    sessionId: string,
    exerciseId: string,
    setIndex: number,
    checked: boolean,
  ) => void;

  getLogs: (exerciseId: string) => SetLog[];
  logSet: (
    exerciseId: string,
    entry: { week: number; weight: number; reps: number },
    date: string,
  ) => void;

  resetAll: () => void;
}

const StoreContext = createContext<StoreApi | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<PersistShape>(emptyState);
  const [hydrated, setHydrated] = useState(false);

  // Load once on mount. Guarded so we never crash on missing/corrupt keys.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<PersistShape>;
        setState({
          currentWeek:
            typeof parsed.currentWeek === "number" ? parsed.currentWeek : 1,
          sessions: parsed.sessions ?? {},
          setChecks: parsed.setChecks ?? {},
          logs: parsed.logs ?? {},
        });
      }
    } catch {
      // ignore corrupt storage — fall back to empty state
    }
    setHydrated(true);
  }, []);

  // Persist on every change, but only after the initial load so we don't
  // clobber stored data with defaults.
  const hydratedRef = useRef(false);
  useEffect(() => {
    if (!hydrated) return;
    hydratedRef.current = true;
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

  const toggleSetChecked = useCallback(
    (
      week: number,
      sessionId: string,
      exerciseId: string,
      setIndex: number,
      checked: boolean,
    ) => {
      setState((s) => ({
        ...s,
        setChecks: {
          ...s.setChecks,
          [setKey(week, sessionId, exerciseId, setIndex)]: checked,
        },
      }));
    },
    [],
  );

  const logSet = useCallback(
    (
      exerciseId: string,
      entry: { week: number; weight: number; reps: number },
      date: string,
    ) => {
      setState((s) => {
        const prev = s.logs[exerciseId] ?? [];
        return {
          ...s,
          logs: {
            ...s.logs,
            [exerciseId]: [...prev, { date, ...entry }],
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
      isSetChecked: (week, sessionId, exerciseId, setIndex) =>
        state.setChecks[setKey(week, sessionId, exerciseId, setIndex)] ?? false,
      toggleSetChecked,
      getLogs: (exerciseId) => state.logs[exerciseId] ?? [],
      logSet,
      resetAll,
    }),
    [hydrated, state, setWeek, setSessionComplete, toggleSetChecked, logSet, resetAll],
  );

  return <StoreContext.Provider value={api}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreApi {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within <StoreProvider>");
  return ctx;
}
