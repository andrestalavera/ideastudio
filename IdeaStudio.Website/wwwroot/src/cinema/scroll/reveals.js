// wwwroot/src/cinema/scroll/reveals.js
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { prefersReducedMotion } from '../utils/reduced-motion.js';

gsap.registerPlugin(ScrollTrigger);

/** @type {Map<string, { tween: gsap.core.Tween, trigger: ScrollTrigger|null }>} */
const registry = new Map();

/**
 * @param {string} id
 * @param {HTMLElement} element
 * @param {{ kind?: string, delayMs?: number, staggerMs?: number, selector?: string|null }} [options]
 */
export function register(id, element, options) {
  if (!element || registry.has(id)) return;

  if (prefersReducedMotion()) {
    element.classList.add('is-revealed');
    return;
  }

  const kind = options?.kind ?? 'fade-up';
  const delay = (options?.delayMs ?? 0) / 1000;

  if (kind === 'stagger') {
    const children = options?.selector ? element.querySelectorAll(options.selector) : element.children;
    const staggered = gsap.fromTo(children,
      { opacity: 0, y: 24 },
      {
        opacity: 1, y: 0, duration: 0.7, ease: 'power2.out', delay,
        stagger: (options?.staggerMs ?? 80) / 1000,
        scrollTrigger: {
          trigger: element, start: 'top 85%', once: true,
          onEnter: () => element.classList.add('is-revealed'),
        },
      });
    registry.set(id, { tween: staggered, trigger: staggered.scrollTrigger });
    return;
  }

  let fromVars;
  let toVars;
  switch (kind) {
    case 'mask':
      fromVars = { opacity: 0, y: 32, clipPath: 'inset(0 100% 0 0)' };
      toVars = { opacity: 1, y: 0, clipPath: 'inset(0 0% 0 0)', duration: 0.9, ease: 'power3.out', delay };
      break;
    case 'fade-up':
    default:
      fromVars = { opacity: 0, y: 24 };
      toVars = { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out', delay };
      break;
  }

  const tween = gsap.fromTo(element, fromVars, {
    ...toVars,
    scrollTrigger: {
      trigger: element,
      start: 'top 85%',
      once: true,
      onEnter: () => element.classList.add('is-revealed'),
    },
  });
  registry.set(id, { tween, trigger: tween.scrollTrigger });
}

export function unregister(id) {
  const entry = registry.get(id);
  if (!entry) return;
  entry.trigger?.kill();
  entry.tween?.kill();
  registry.delete(id);
}

export function disposeAll() {
  for (const { tween, trigger } of registry.values()) {
    trigger?.kill();
    tween?.kill();
  }
  registry.clear();
}
