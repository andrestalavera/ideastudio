// SCSS-driven magnetic hover: JS only updates --mx / --my custom properties
// on pointermove. SCSS handles the transform. No animation library needed.

import { prefersReducedMotion } from '../utils/reduced-motion.js';

/** @type {WeakMap<HTMLElement, (e: PointerEvent) => void>} */
const moveHandlers = new WeakMap();

export function attachAll() {
  if (prefersReducedMotion()) return;
  if (window.matchMedia?.('(hover: none)').matches) return;

  const els = document.querySelectorAll('[data-magnetic]');
  for (const el of els) {
    if (moveHandlers.has(el)) continue;
    attach(el);
  }
}

/** @param {HTMLElement} el */
function attach(el) {
  const onMove = (e) => {
    const r = el.getBoundingClientRect();
    const mx = ((e.clientX - r.left) / r.width) - 0.5;   // -0.5 .. 0.5
    const my = ((e.clientY - r.top)  / r.height) - 0.5;
    el.style.setProperty('--mx', mx.toFixed(3));
    el.style.setProperty('--my', my.toFixed(3));
  };
  const onLeave = () => {
    el.style.setProperty('--mx', '0');
    el.style.setProperty('--my', '0');
  };
  el.addEventListener('pointermove', onMove);
  el.addEventListener('pointerleave', onLeave);
  moveHandlers.set(el, onMove);
}

export function disposeAll() {
  // WeakMap-keyed handlers are GC'd with their DOM nodes. No-op here by design.
}
