// Wraps a callback in document.startViewTransition when the API is available,
// so same-document DOM mutations (e.g. Blazor WASM re-renders after route
// change or scene swap) get the ::view-transition-old / -new cross-fade
// defined in base/_view-transitions.scss.
//
// Falls back to running the callback synchronously when the API is missing or
// the user prefers reduced motion.

const VT_SUPPORTED =
  typeof document !== 'undefined' && 'startViewTransition' in document;

function reducedMotion() {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  );
}

/** @param {() => void} callback */
export function withViewTransition(callback) {
  if (!VT_SUPPORTED || reducedMotion()) {
    callback();
    return;
  }
  document.startViewTransition(callback);
}
