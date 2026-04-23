export function onIdle(fn) {
  if ('requestIdleCallback' in window) {
    requestIdleCallback(fn, { timeout: 500 });
  } else {
    setTimeout(fn, 1);
  }
}
