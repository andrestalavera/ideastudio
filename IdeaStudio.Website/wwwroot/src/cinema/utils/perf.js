// utils/perf.js — decide whether the engine should run at all, and whether
// mesh + thread + letters should be enabled. Writes html[data-motion] so the
// CSS fallback kicks in.

export function prefersReducedMotion() {
  return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function prefersReducedData() {
  return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-data: reduce)').matches;
}

export function isCoarsePointer() {
  return typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches;
}

export async function batteryLow() {
  try {
    const b = navigator.getBattery ? await navigator.getBattery() : null;
    if (!b) return false;
    return b.level < 0.2 && !b.charging;
  } catch {
    return false;
  }
}

export function setMotionMode(mode) {
  if (typeof document === 'undefined') return;
  if (mode) document.documentElement.dataset.motion = mode;
  else delete document.documentElement.dataset.motion;
}
