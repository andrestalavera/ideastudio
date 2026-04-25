// interactions/nav-morph.js — drives the scroll-scrubbed hero→pill morph.
// Writes two things on <html>:
//   - data-hero-state: 'hero' | 'morphing' | 'pill'  (discrete state)
//   - --hero-progress: 0..1                           (continuous progress)
// Pure CSS on .ds-hero__inner and .ds-masthead__pill renders the motion.

let rafQueued = false;
let lastProgress = 0;

function computeState() {
  const hero = document.querySelector('.ds-hero');
  if (!hero) return { state: 'pill', progress: 1 };
  const rect = hero.getBoundingClientRect();
  const vh = window.innerHeight;
  // Hero starts exiting once its bottom crosses 85% vh, fully out at 25% vh.
  const exitStart = vh * 0.85;
  const exitEnd = vh * 0.25;
  let progress = 0;
  if (rect.bottom >= exitStart) progress = 0;
  else if (rect.bottom <= exitEnd) progress = 1;
  else progress = 1 - (rect.bottom - exitEnd) / (exitStart - exitEnd);

  let state = 'morphing';
  if (progress <= 0.02) state = 'hero';
  else if (progress >= 0.98) state = 'pill';

  return { state, progress };
}

function writeState() {
  rafQueued = false;
  const html = document.documentElement;
  const { state, progress } = computeState();

  if (html.dataset.heroState !== state) html.dataset.heroState = state;
  // Quantize to 3 decimals to reduce style recalc churn.
  const q = Math.round(progress * 1000) / 1000;
  if (Math.abs(q - lastProgress) > 0.004) {
    html.style.setProperty('--hero-progress', q.toString());
    lastProgress = q;
  }
}

function schedule() {
  if (rafQueued) return;
  rafQueued = true;
  requestAnimationFrame(writeState);
}

export function attachNavMorph() {
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule, { passive: true });
  // Two rAFs so Blazor has rendered the hero before our first measurement.
  requestAnimationFrame(() => requestAnimationFrame(writeState));
  attachNavMorph._schedule = schedule;
}

export function disposeNavMorph() {
  if (attachNavMorph._schedule) {
    window.removeEventListener('scroll', attachNavMorph._schedule);
    window.removeEventListener('resize', attachNavMorph._schedule);
    attachNavMorph._schedule = null;
  }
  document.documentElement.dataset.heroState = '';
  document.documentElement.style.removeProperty('--hero-progress');
}
