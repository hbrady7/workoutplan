// Tiny haptic helper. Subtle, and a no-op where unsupported (desktop, iOS Safari).
export function vibrate(pattern: number | number[] = 15) {
  try {
    navigator.vibrate?.(pattern);
  } catch {
    /* unsupported — ignore */
  }
}
