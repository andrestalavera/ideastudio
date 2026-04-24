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
};

const onLeaveWindow = () => {
  dot?.classList.remove('ds-cursor--visible');
  halo?.classList.remove('ds-cursor__halo--visible');
};

const onOver = (e) => {
  const el = e.target;
  if (!(el instanceof Element)) return;
  if (el.closest(INTERACTIVE_SELECTOR)) {
    halo?.classList.add('ds-cursor__halo--hover');
  }
};

const onOut = (e) => {
  const related = e.relatedTarget;
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
  if (running) return;
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
  window.addEventListener('mouseleave', onLeaveWindow);
  document.addEventListener('mouseover', onOver);
  document.addEventListener('mouseout', onOut);

  running = true;
  rafId = requestAnimationFrame(tick);
}

export function disable() {
  if (!running) return;
  running = false;
  cancelAnimationFrame(rafId);
  window.removeEventListener('mousemove', onMove);
  window.removeEventListener('mouseleave', onLeaveWindow);
  document.removeEventListener('mouseover', onOver);
  document.removeEventListener('mouseout', onOut);
  dot?.remove();
  halo?.remove();
  dot = null;
  halo = null;
  document.documentElement.classList.remove('ds-cursor-enabled');
}
