// Phase C4.1 — CV "Chronicles": vertically-pinned stage that scrubs through
// experience cards as the user scrolls. Years roll, cards swap, dots + a
// progress bar scrub with GSAP ScrollTrigger.scrub(0.8). On mobile / touch /
// reduced-motion we attach nothing — CSS shows the natural stack fallback.

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { prefersReducedMotion } from '../utils/reduced-motion.js';

gsap.registerPlugin(ScrollTrigger);

/** @type {gsap.core.Timeline|null} */
let current = null;
/** @type {Array<() => void>} */
let dotCleanups = [];

export function attach() {
  const container = document.querySelector('[data-chronicles]');
  if (!container) return;
  if (prefersReducedMotion()) return;
  if (window.matchMedia('(max-width: 767px), (hover: none)').matches) return;

  detach(); // idempotent — re-entrant across SPA navigations

  const slides = Array.from(container.querySelectorAll('[data-chronicles-slide]'));
  const yearEls = Array.from(container.querySelectorAll('[data-chronicles-year]'));
  const dotEls = Array.from(container.querySelectorAll('[data-chronicles-dot]'));
  const progress = container.querySelector('[data-chronicles-progress]');
  if (slides.length === 0) return;

  // Initial state: only first slide + first year visible, others offset + faded.
  gsap.set(slides, { opacity: 0, y: 80, rotateZ: 4, scale: 0.96 });
  gsap.set(slides[0], { opacity: 1, y: 0, rotateZ: 0, scale: 1 });
  if (yearEls.length > 0) {
    gsap.set(yearEls, { opacity: 0, y: 40 });
    gsap.set(yearEls[0], { opacity: 1, y: 0 });
  }
  if (dotEls[0]) dotEls[0].classList.add('is-active');

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: container,
      start: 'top top',
      end: () => `+=${window.innerHeight * slides.length * 0.8}`,
      pin: true,
      scrub: 0.8,
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        if (progress) progress.style.setProperty('--progress', self.progress.toFixed(3));
        const idx = Math.min(slides.length - 1, Math.floor(self.progress * slides.length + 0.001));
        for (let i = 0; i < dotEls.length; i++) {
          dotEls[i].classList.toggle('is-active', i === idx);
        }
      },
    },
  });

  // Stitch per-slide exits and entries across the [0..1] progress.
  for (let i = 1; i < slides.length; i++) {
    const start = (i - 1) / slides.length;
    tl.to(slides[i - 1], { opacity: 0, y: -60, rotateZ: -3, scale: 0.96, duration: 0.5 }, start);
    if (yearEls[i - 1]) {
      tl.to(yearEls[i - 1], { opacity: 0, y: -30, duration: 0.5 }, start);
    }
    tl.to(slides[i], { opacity: 1, y: 0, rotateZ: 0, scale: 1, duration: 0.5 }, start + 0.1);
    if (yearEls[i]) {
      tl.to(yearEls[i], { opacity: 1, y: 0, duration: 0.5 }, start + 0.1);
    }
  }

  // Click-to-jump on dots.
  dotCleanups = dotEls.map((dot, i) => {
    const onClick = () => {
      const trigger = tl.scrollTrigger;
      if (!trigger) return;
      const progressTarget = i / slides.length;
      const scrollY = trigger.start + (trigger.end - trigger.start) * progressTarget;
      window.scrollTo({ top: scrollY, behavior: 'smooth' });
    };
    dot.addEventListener('click', onClick);
    return () => dot.removeEventListener('click', onClick);
  });

  current = tl;
}

export function detach() {
  if (current) {
    current.scrollTrigger?.kill();
    current.kill();
    current = null;
  }
  for (const fn of dotCleanups) fn();
  dotCleanups = [];
}
