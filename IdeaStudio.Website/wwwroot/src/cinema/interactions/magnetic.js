// SCSS-driven pointer tracking: JS only updates --mx / --my custom properties
// on pointermove. SCSS handles the transform. No animation library needed.
//
// Two selectors share the same pipeline:
//   - [data-magnetic] — buttons / actions that translate toward the pointer
//   - [data-tilt]     — cards that rotate a few degrees around their center
// Both consume the same --mx / --my pair; the SCSS for each is what differs.

import { prefersReducedMotion } from '../utils/reduced-motion.js';

/** @type {WeakMap<HTMLElement, (e: PointerEvent) => void>} */
const moveHandlers = new WeakMap();

export function attachAll() {
  if (prefersReducedMotion()) return;
  if (window.matchMedia?.('(hover: none)').matches) return;

  const els = document.querySelectorAll('[data-magnetic], [data-tilt]');
  for (const el of els) {
    if (moveHandlers.has(el)) continue;
    attach(el);
  }
}

/** @param {HTMLElement} el */
function attach(el) {
  const onMove = (e) => {
    const r = el.getBoundingClientRect();
    const mx = ((e.clientX - r.left) / r.width) - 0.5;   // -0.5 .. 0.5 (for tilt)
    const my = ((e.clientY - r.top)  / r.height) - 0.5;
    // Percentage coords (0..100) power the card shine radial gradient.
    const px = ((e.clientX - r.left) / r.width) * 100;
    const py = ((e.clientY - r.top)  / r.height) * 100;
    el.style.setProperty('--mx', mx.toFixed(3));
    el.style.setProperty('--my', my.toFixed(3));
    el.style.setProperty('--px', px.toFixed(1) + '%');
    el.style.setProperty('--py', py.toFixed(1) + '%');
  };
  const onLeave = () => {
    el.style.setProperty('--mx', '0');
    el.style.setProperty('--my', '0');
    el.style.setProperty('--px', '50%');
    el.style.setProperty('--py', '50%');
  };
  el.addEventListener('pointermove', onMove);
  el.addEventListener('pointerleave', onLeave);
  moveHandlers.set(el, onMove);
}

export function disposeAll() {
  // WeakMap-keyed handlers are GC'd with their DOM nodes. No-op here by design.
}
