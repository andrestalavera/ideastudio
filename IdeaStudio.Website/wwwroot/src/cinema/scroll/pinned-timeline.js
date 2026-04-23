// wwwroot/src/cinema/scroll/pinned-timeline.js
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { prefersReducedMotion } from '../utils/reduced-motion.js';

gsap.registerPlugin(ScrollTrigger);

/** @type {{ tween: gsap.core.Tween|null, trigger: ScrollTrigger|null }} */
let current = { tween: null, trigger: null };

/**
 * @param {HTMLElement} container
 * @param {HTMLElement} track
 */
export function register(container, track) {
  if (!container || !track) return;
  if (prefersReducedMotion()) return;
  if (window.matchMedia('(max-width: 767px), (hover: none)').matches) return;

  unregister();

  const distance = () => Math.max(0, track.scrollWidth - container.clientWidth);

  const tween = gsap.to(track, {
    x: () => -distance(),
    ease: 'none',
    scrollTrigger: {
      trigger: container,
      pin: true,
      scrub: 1,
      start: 'top top',
      end: () => `+=${distance()}`,
      invalidateOnRefresh: true,
    },
  });

  current = { tween, trigger: tween.scrollTrigger };
}

export function unregister() {
  current.trigger?.kill();
  current.tween?.kill();
  current = { tween: null, trigger: null };
}
