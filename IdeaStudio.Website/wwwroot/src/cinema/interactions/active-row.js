// interactions/active-row.js — keeps a single .is-active class on the
// Timeline row whose year chip is closest to the viewport center. Makes
// the sticky year glow in sync with the experience you're currently reading.

let observer = null;

function pickActive(rows) {
  const vh = window.innerHeight;
  const mid = vh * 0.5;
  let best = null;
  let bestD = Infinity;
  for (const row of rows) {
    const r = row.getBoundingClientRect();
    const cy = r.top + r.height * 0.5;
    const d = Math.abs(cy - mid);
    if (d < bestD) { bestD = d; best = row; }
  }
  rows.forEach(r => r.classList.toggle('is-active', r === best));
}

let scheduled = false;
function schedule() {
  if (scheduled) return;
  scheduled = true;
  requestAnimationFrame(() => {
    scheduled = false;
    const rows = document.querySelectorAll('.ds-timeline__row');
    if (rows.length > 0) pickActive(rows);
  });
}

export function attachActiveRow() {
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule, { passive: true });
  requestAnimationFrame(schedule);
  attachActiveRow._schedule = schedule;
}

export function disposeActiveRow() {
  if (attachActiveRow._schedule) {
    window.removeEventListener('scroll', attachActiveRow._schedule);
    window.removeEventListener('resize', attachActiveRow._schedule);
    attachActiveRow._schedule = null;
  }
}
