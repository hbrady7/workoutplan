// Local-date helpers. Keys are local YYYY-MM-DD so a day's log belongs to the
// calendar day the user actually lived, not UTC.

export function toDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function parseDateStr(s: string): Date {
  return new Date(`${s}T00:00:00`);
}

export function addDays(s: string, n: number): string {
  const d = parseDateStr(s);
  d.setDate(d.getDate() + n);
  return toDateStr(d);
}

/** "Today · Tue, Jun 2" / "Yesterday · …" / "Mon, Jun 1" */
export function formatFriendly(s: string, todayStr: string): string {
  const d = parseDateStr(s);
  const label = d.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  if (s === todayStr) return `Today · ${label}`;
  if (s === addDays(todayStr, -1)) return `Yesterday · ${label}`;
  return label;
}

/** HH:MM from an ISO timestamp. */
export function timeOf(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

/** The last `n` local date strings ending at (and including) todayStr. */
export function lastNDays(todayStr: string, n: number): string[] {
  return Array.from({ length: n }, (_, i) => addDays(todayStr, -(n - 1 - i)));
}
