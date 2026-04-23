export function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Watches for `prefers-reduced-motion` changes.
 * @param {(matches: boolean) => void} callback
 * @returns {() => void} disposer that removes the listener
 */
export function watchReducedMotion(callback) {
  const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
  const handler = e => callback(e.matches);
  mq.addEventListener('change', handler);
  return () => mq.removeEventListener('change', handler);
}
