// Tiny haptic helpers. navigator.vibrate is a no-op on iOS Safari and absent
// on desktop, so both calls are guarded and silently do nothing there.
function vibrate(pattern: number | number[]) {
  if (typeof navigator === "undefined" || !("vibrate" in navigator)) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  try {
    navigator.vibrate(pattern);
  } catch {
    // some browsers throw when the page isn't visible
  }
}

/** A single light tick — taps, presses, selections. */
export function tap() {
  vibrate(12);
}

/** A heavier double pulse — errors and wrong answers. */
export function buzz() {
  vibrate([28, 60, 28]);
}

/** A rising triple — something good landed (a win, a reveal). */
export function celebrate() {
  vibrate([14, 50, 20, 50, 34]);
}
