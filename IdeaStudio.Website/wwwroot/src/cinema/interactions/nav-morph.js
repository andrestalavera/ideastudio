// interactions/nav-morph.js — drives the state attribute html[data-hero-state]
// from scroll progress. The visual morph (hero → pill) is pure CSS; this
// module writes the state. No GSAP needed; the CSS transitions on
// .ds-masthead__pill do the choreography.
//
// If we later need a scrubbed timeline with more fine-grained effects,
// we'll pull in GSAP ScrollTrigger here — but keeping it CSS-only for now
// keeps the bundle tight and feels "fluid" per the brief.

export function attachNavMorph() {
  const html = document.documentElement;
  const hero = document.querySelector('.ds-hero');
  const update = () => {
    const bottom = hero ? hero.getBoundingClientRect().bottom : 0;
    const mobile = window.innerWidth < 640;
    const threshold = mobile ? 40 : 80;
    const state = bottom > threshold ? (bottom > window.innerHeight * 0.85 ? 'hero' : 'morphing') : 'pill';
    if (html.dataset.heroState !== state) html.dataset.heroState = state;
  };
  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update, { passive: true });
  update();
  attachNavMorph._update = update;
}

export function disposeNavMorph() {
  if (attachNavMorph._update) {
    window.removeEventListener('scroll', attachNavMorph._update);
    window.removeEventListener('resize', attachNavMorph._update);
    attachNavMorph._update = null;
  }
  document.documentElement.dataset.heroState = '';
}
