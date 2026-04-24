// wwwroot/src/cinema/interactions/hero-stage.js
// GSAP-choreographed hero entrance — runs in parallel with the CSS
// per-character reveal, adding envelope motion (avatar scale-in, kicker
// letter-spacing unclench, CTA cascade) that plain CSS easings can't match.

import { gsap } from 'gsap';
import { prefersReducedMotion } from '../utils/reduced-motion.js';

let played = new WeakSet();

/**
 * Plays the hero entrance timeline on a hero container.
 * Designed to be called once per hero mount.
 */
export function play(hero) {
  if (!hero || played.has(hero) || prefersReducedMotion()) return;
  played.add(hero);

  const avatar  = hero.querySelector('.ds-intro-hero__avatar, .ds-hero__avatar');
  const kicker  = hero.querySelector('.ds-intro-hero__kicker, .ds-kicker, .ds-chapter__kicker');
  const lead    = hero.querySelector('.ds-intro-hero__lead, .ds-hero__intro');
  const actions = hero.querySelectorAll('.ds-intro-hero__actions > *, .ds-hero__row .ds-btn');
  const name    = hero.querySelector('[data-reveal-text]');

  const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

  if (avatar) {
    tl.fromTo(avatar,
      { scale: 0.85, opacity: 0, y: 24 },
      { scale: 1, opacity: 1, y: 0, duration: 0.9, ease: 'back.out(1.4)' },
      0);
  }

  if (kicker) {
    tl.fromTo(kicker,
      { opacity: 0, y: 14, letterSpacing: '0.4em' },
      { opacity: 1, y: 0, letterSpacing: '0.18em', duration: 0.7 },
      0.15);
  }

  // Name char spans: the CSS already animates them; GSAP amplifies the host
  // container with a subtle skew-in for extra drama.
  if (name) {
    tl.fromTo(name,
      { opacity: 0, skewY: 3 },
      { opacity: 1, skewY: 0, duration: 0.6 },
      0.25);
  }

  if (lead) {
    tl.fromTo(lead,
      { opacity: 0, y: 16 },
      { opacity: 1, y: 0, duration: 0.7 },
      0.5);
  }

  if (actions.length) {
    tl.fromTo(actions,
      { opacity: 0, y: 18, scale: 0.96 },
      { opacity: 1, y: 0, scale: 1, duration: 0.6, stagger: 0.08, ease: 'back.out(1.3)' },
      0.6);
  }
}

export function attachAll() {
  const heroes = document.querySelectorAll('.ds-intro-hero, .ds-hero');
  heroes.forEach(play);
}

export function reset() {
  played = new WeakSet();
}
