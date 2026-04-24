// interactions/cursor.js — 12 px duck-blue dot. Desktop only. Lagged follow.

let host = null;
let raf = 0;
const target = { x: 0, y: 0 };
const pos = { x: 0, y: 0 };
let active = false;

function tick() {
  raf = requestAnimationFrame(tick);
  pos.x += (target.x - pos.x) * 0.22;
  pos.y += (target.y - pos.y) * 0.22;
  if (host) host.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0) translate(-50%, -50%)`;
}

function onMove(e) {
  target.x = e.clientX;
  target.y = e.clientY;
  if (!active) {
    active = true;
    host?.classList.add('is-active');
  }
}

export function attachCursor() {
  if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  if (host) return;
  host = document.createElement('div');
  host.className = 'ds-cursor';
  host.setAttribute('aria-hidden', 'true');
  document.body.appendChild(host);
  window.addEventListener('pointermove', onMove, { passive: true });
  raf = requestAnimationFrame(tick);
}

export function disposeCursor() {
  window.removeEventListener('pointermove', onMove);
  cancelAnimationFrame(raf);
  if (host) host.remove();
  host = null;
  active = false;
}
