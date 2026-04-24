// Phase D — editorial hero stage. GSAP still owns the envelope, but the
// choreography is now: a single fade-up pass on the hero's direct
// children. No letter-spacing gymnastics, no rotate, no back.out bounce —
// editorial sites move quietly.

import { gsap } from 'gsap';
import { prefersReducedMotion } from '../utils/reduced-motion.js';

let played = new WeakSet();

export function play(hero) {
  if (!hero || played.has(hero) || prefersReducedMotion()) return;
  played.add(hero);

  const targets = hero.querySelectorAll(
    '.ds-ed-hero__kicker, .ds-ed-hero__name, .ds-ed-hero__lead, .ds-ed-hero__links, .ds-ed-hero__scroll,'
    + '.ds-intro-hero__kicker, .ds-intro-hero__name, .ds-intro-hero__lead, .ds-intro-hero__actions,'
    + '.ds-hero__row, .ds-hero__intro'
  );
  if (!targets.length) return;

  gsap.fromTo(targets,
    { opacity: 0, y: 16 },
    {
      opacity: 1,
      y: 0,
      duration: 0.7,
      ease: 'cubic-bezier(0.2, 0.7, 0.2, 1)',
      stagger: 0.08,
    });
}

export function attachAll() {
  const heroes = document.querySelectorAll('.ds-ed-hero, .ds-intro-hero, .ds-hero');
  heroes.forEach(play);
}

export function reset() {
  played = new WeakSet();
}
