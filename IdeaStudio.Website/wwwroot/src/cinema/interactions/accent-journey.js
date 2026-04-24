// Scroll-linked per-section accent (Phase C5.5). Each [data-accent="<hex>"]
// section, when more than 50% in view, sets --ds-scene-accent on <html>.
// The @property transition in _backdrop.scss handles the smooth fade; we
// also nudge the WebGL shader via backdrop.refresh() so the aurora picks
// up the new tint.
//
// The journey is currently wired to /cv only — each chapter tagged with a
// sub-palette color (cyan / sky / teal / mint). Extending to other pages
// is just a matter of sprinkling data-accent on their sections.

import * as backdrop from '../backdrop.js';

/** @type {IntersectionObserver|null} */
let observer = null;

export function attach() {
  if (typeof IntersectionObserver === 'undefined') return;
  detach();

  const sections = document.querySelectorAll('[data-accent]');
  if (sections.length === 0) return;

  observer = new IntersectionObserver((entries) => {
    // Pick the entry with the highest intersectionRatio that is intersecting.
    let top = null;
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      if (!top || entry.intersectionRatio > top.intersectionRatio) top = entry;
    }
    if (!top) return;
    const hex = top.target.getAttribute('data-accent');
    if (!hex) return;
    document.documentElement.style.setProperty('--ds-scene-accent', hex);
    backdrop.refresh?.();
  }, { threshold: [0, 0.25, 0.5, 0.75, 1] });

  sections.forEach(s => observer.observe(s));
}

export function detach() {
  observer?.disconnect();
  observer = null;
}
