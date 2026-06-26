// interactions/cursor.js — 12 px duck-blue dot. Desktop only. Lagged follow.
// The lerp loop parks itself once the dot has settled and restarts on the next
// pointermove, and pauses while the tab is hidden — no perpetual rAF.

let host = null;
let raf = 0;
let running = false;
const target = { x: 0, y: 0 };
const pos = { x: 0, y: 0 };
let active = false;
let follow = 0.22;

const EPS = 0.1; // px — below this the dot is "settled" and the loop parks.

function paint() {
  if (host) host.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0) translate(-50%, -50%)`;
}

function tick() {
  const dx = target.x - pos.x;
  const dy = target.y - pos.y;
  if (Math.abs(dx) < EPS && Math.abs(dy) < EPS) {
    pos.x = target.x;
    pos.y = target.y;
    paint();
    running = false; // settled — stop scheduling until the next move.
    return;
  }
  pos.x += dx * follow;
  pos.y += dy * follow;
  paint();
  raf = requestAnimationFrame(tick);
}

function start() {
  if (running || !host || document.hidden) return;
  running = true;
  raf = requestAnimationFrame(tick);
}

function onMove(e) {
  target.x = e.clientX;
  target.y = e.clientY;
  if (!active) {
    active = true;
    host?.classList.add('is-active');
  }
  start();
}

function onVisibility() {
  if (document.hidden) {
    cancelAnimationFrame(raf);
    running = false;
  } else if (Math.abs(target.x - pos.x) >= EPS || Math.abs(target.y - pos.y) >= EPS) {
    start();
  }
}

export function attachCursor() {
  if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  if (host) return;
  // Reduced motion: no lag — the dot tracks the pointer in a single step, so
  // there is no idle animation to perceive.
  follow = matchMedia('(prefers-reduced-motion: reduce)').matches ? 1 : 0.22;
  host = document.createElement('div');
  host.className = 'ds-cursor';
  host.setAttribute('aria-hidden', 'true');
  document.body.appendChild(host);
  window.addEventListener('pointermove', onMove, { passive: true });
  document.addEventListener('visibilitychange', onVisibility);
}

export function disposeCursor() {
  window.removeEventListener('pointermove', onMove);
  document.removeEventListener('visibilitychange', onVisibility);
  cancelAnimationFrame(raf);
  running = false;
  if (host) host.remove();
  host = null;
  active = false;
}
