"use client";

import { useEffect } from "react";

// Holds a screen wake lock while `active`, re-acquiring when the tab returns to
// the foreground (the platform drops the lock when hidden). No-op where the
// Wake Lock API is unsupported.
export function useWakeLock(active: boolean) {
  useEffect(() => {
    if (!active || typeof navigator === "undefined") return;
    const nav = navigator as Navigator & {
      wakeLock?: { request: (type: "screen") => Promise<WakeLockSentinel> };
    };
    if (!nav.wakeLock) return;

    let sentinel: WakeLockSentinel | null = null;
    let released = false;

    const request = async () => {
      try {
        sentinel = await nav.wakeLock!.request("screen");
      } catch {
        /* user gesture / permission / unsupported — ignore */
      }
    };
    request();

    const onVisibility = () => {
      if (document.visibilityState === "visible" && !released) request();
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      released = true;
      document.removeEventListener("visibilitychange", onVisibility);
      try {
        sentinel?.release();
      } catch {
        /* ignore */
      }
    };
  }, [active]);
}
