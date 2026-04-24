// Custom cursor — a 6px dot that follows the pointer 1:1 and a 36px halo
// that lerps behind it (k=0.18) for a trailing feel. Halo expands over
// interactive elements. No-op on touch (hover: none) and reduced-motion.

import { prefersReducedMotion } from '../utils/reduced-motion.js';

let dot = null;
let halo = null;
let running = false;
let mx = 0;
let my = 0;
let hx = 0;
let hy = 0;
let rafId = 0;

const INTERACTIVE_SELECTOR = 'a, button, [role="button"], input, textarea, select, [data-magnetic]';

const isTouch = () => window.matchMedia('(hover: none)').matches;

const onMove = (e) => {
  mx = e.clientX;
  my = e.clientY;
  if (dot) {
    dot.style.transform = `translate(${mx}px, ${my}px) translate(-50%, -50%)`;
    dot.classList.add('ds-cursor--visible');
    halo?.classList.add('ds-cursor__halo--visible');
  }
  // If the rAF loop was paused (cursor had left the doc), snap halo to dot and restart.
  if (!running) {
    hx = mx;
    hy = my;
    running = true;
    rafId = requestAnimationFrame(tick);
  }
};

const onLeaveDoc = () => {
  dot?.classList.remove('ds-cursor--visible');
  halo?.classList.remove('ds-cursor__halo--visible');
  halo?.classList.remove('ds-cursor__halo--hover');
  halo?.classList.remove('ds-cursor__halo--target');
  if (running) {
    running = false;
    cancelAnimationFrame(rafId);
  }
};

const onEnterDoc = () => {
  if (!running && dot) {
    // Snap halo to current dot position so it doesn't trail from stale location.
    hx = mx;
    hy = my;
    running = true;
    rafId = requestAnimationFrame(tick);
  }
};

const onVisibilityChange = () => {
  if (document.hidden) onLeaveDoc();
};

const onOver = (e) => {
  const el = e.target;
  if (!(el instanceof Element)) return;
  if (el.closest('[data-magnetic]')) {
    // "Target" reticle — user loves this affordance. More emphatic than plain hover.
    halo?.classList.add('ds-cursor__halo--target');
    halo?.classList.remove('ds-cursor__halo--hover');
  } else if (el.closest(INTERACTIVE_SELECTOR)) {
    halo?.classList.add('ds-cursor__halo--hover');
  }
};

const onOut = (e) => {
  const related = e.relatedTarget;
  if (!(related instanceof Element) || !related.closest('[data-magnetic]')) {
    halo?.classList.remove('ds-cursor__halo--target');
  }
  if (!(related instanceof Element) || !related.closest(INTERACTIVE_SELECTOR)) {
    halo?.classList.remove('ds-cursor__halo--hover');
  }
};

function tick() {
  if (!running) return;
  // Lerp halo toward dot for trailing feel.
  hx += (mx - hx) * 0.18;
  hy += (my - hy) * 0.18;
  if (halo) halo.style.transform = `translate(${hx}px, ${hy}px) translate(-50%, -50%)`;
  rafId = requestAnimationFrame(tick);
}

export function enable() {
  // Guard against double-init. `running` can be false while paused (cursor
  // outside doc) but `dot` is still mounted — treat that as enabled.
  if (running || dot) return;
  if (prefersReducedMotion() || isTouch()) return;

  dot = document.createElement('div');
  dot.className = 'ds-cursor';
  dot.setAttribute('aria-hidden', 'true');
  halo = document.createElement('div');
  halo.className = 'ds-cursor__halo';
  halo.setAttribute('aria-hidden', 'true');
  document.body.appendChild(dot);
  document.body.appendChild(halo);
  document.documentElement.classList.add('ds-cursor-enabled');

  window.addEventListener('mousemove', onMove, { passive: true });
  document.documentElement.addEventListener('mouseleave', onLeaveDoc);
  document.documentElement.addEventListener('mouseenter', onEnterDoc);
  document.addEventListener('visibilitychange', onVisibilityChange);
  document.addEventListener('mouseover', onOver);
  document.addEventListener('mouseout', onOut);

  running = true;
  rafId = requestAnimationFrame(tick);
}

export function disable() {
  if (!running && !dot) return;
  if (running) {
    running = false;
    cancelAnimationFrame(rafId);
  }
  window.removeEventListener('mousemove', onMove);
  document.documentElement.removeEventListener('mouseleave', onLeaveDoc);
  document.documentElement.removeEventListener('mouseenter', onEnterDoc);
  document.removeEventListener('visibilitychange', onVisibilityChange);
  document.removeEventListener('mouseover', onOver);
  document.removeEventListener('mouseout', onOut);
  dot?.remove();
  halo?.remove();
  dot = null;
  halo = null;
  document.documentElement.classList.remove('ds-cursor-enabled');
}
