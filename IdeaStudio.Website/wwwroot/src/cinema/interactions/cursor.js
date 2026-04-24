// Phase D — simplified cursor.
// A single 12px warm amber dot that lags the pointer by a few pixels. No
// halo, no target reticle, no crosshair. mix-blend-difference at the CSS
// layer keeps the dot readable on any surface. Disabled on touch and for
// prefers-reduced-motion users.

import { prefersReducedMotion } from '../utils/reduced-motion.js';

let dot = null;
let mx = 0, my = 0;
let dx = 0, dy = 0;
let rafId = 0;
let running = false;
let primed = false;

const isTouch = () => window.matchMedia('(hover: none)').matches;

const onMove = (e) => {
  mx = e.clientX;
  my = e.clientY;
  if (!primed) {
    dx = mx; dy = my;
    primed = true;
  }
  if (!running && dot) {
    running = true;
    rafId = requestAnimationFrame(tick);
  }
  dot?.classList.add('ds-cursor--visible');
};

const onLeaveDoc = () => {
  dot?.classList.remove('ds-cursor--visible');
  if (running) {
    running = false;
    cancelAnimationFrame(rafId);
  }
};

function tick() {
  if (!running) return;
  dx += (mx - dx) * 0.22;
  dy += (my - dy) * 0.22;
  if (dot) dot.style.transform = `translate(${dx}px, ${dy}px) translate(-50%, -50%)`;
  rafId = requestAnimationFrame(tick);
}

export function enable() {
  if (dot) return;
  if (prefersReducedMotion() || isTouch()) return;

  dot = document.createElement('div');
  dot.className = 'ds-cursor';
  dot.setAttribute('aria-hidden', 'true');
  document.body.appendChild(dot);
  document.documentElement.classList.add('ds-cursor-enabled');

  window.addEventListener('pointermove', onMove, { passive: true });
  document.documentElement.addEventListener('mouseleave', onLeaveDoc);
}

export function disable() {
  if (!dot) return;
  running = false;
  cancelAnimationFrame(rafId);
  window.removeEventListener('pointermove', onMove);
  document.documentElement.removeEventListener('mouseleave', onLeaveDoc);
  dot.remove();
  dot = null;
  primed = false;
  document.documentElement.classList.remove('ds-cursor-enabled');
}
