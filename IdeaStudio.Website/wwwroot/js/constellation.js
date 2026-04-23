// Lightweight parallax for the tech constellation.
// Honors prefers-reduced-motion (skips the pointer listener entirely).
let handler = null;
let rootEl = null;
let parallaxEl = null;

export function attach(root, parallax) {
  rootEl = root;
  parallaxEl = parallax;
  if (!rootEl || !parallaxEl) return;
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  handler = (ev) => {
    const rect = rootEl.getBoundingClientRect();
    if (rect.width === 0) return;
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = (ev.clientX - cx) / rect.width;
    const dy = (ev.clientY - cy) / rect.height;
    const tx = Math.max(-12, Math.min(12, dx * 18));
    const ty = Math.max(-12, Math.min(12, dy * 18));
    parallaxEl.style.transform = `translate3d(${tx}px, ${ty}px, 0)`;
  };

  window.addEventListener('pointermove', handler, { passive: true });
}

export function detach() {
  if (handler) window.removeEventListener('pointermove', handler);
  handler = null;
  if (parallaxEl) parallaxEl.style.transform = '';
  rootEl = null;
  parallaxEl = null;
}
