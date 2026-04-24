// Magnetic hover — translates [data-magnetic] elements toward the cursor
// by a small capped amount via a GSAP tween. Disabled on touch (hover: none)
// and reduced-motion. Idempotent per element: safe to call attachAll() after
// every scene switch to pick up newly mounted nodes.

import { gsap } from 'gsap';
import { prefersReducedMotion } from '../utils/reduced-motion.js';

const STRENGTH = 14;   // max px displacement from center
const DURATION = 0.4;  // tween seconds

/** @type {Map<HTMLElement, { onMove: (e: MouseEvent) => void, onLeave: () => void }>} */
const registry = new Map();

/**
 * Attaches magnetic hover to every currently-matching [data-magnetic] element.
 * Safe to call multiple times — idempotent per element.
 */
export function attachAll() {
  if (prefersReducedMotion()) return;
  if (!('matchMedia' in window) || window.matchMedia('(hover: none)').matches) return;

  const elements = document.querySelectorAll('[data-magnetic]');
  for (const el of elements) {
    if (registry.has(el)) continue;
    attach(el);
  }
}

/**
 * @param {Element} el
 */
function attach(el) {
  const onMove = (e) => {
    const r = el.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    const dx = e.clientX - cx;
    const dy = e.clientY - cy;
    // Normalize by the element's half-width/height; cap at STRENGTH.
    const nx = Math.max(-1, Math.min(1, dx / (r.width / 2)));
    const ny = Math.max(-1, Math.min(1, dy / (r.height / 2)));
    gsap.to(el, { x: nx * STRENGTH, y: ny * STRENGTH, duration: DURATION, ease: 'power3.out' });
  };
  const onLeave = () => {
    gsap.to(el, { x: 0, y: 0, duration: DURATION * 1.2, ease: 'power3.out' });
  };
  el.addEventListener('mousemove', onMove);
  el.addEventListener('mouseleave', onLeave);
  registry.set(el, { onMove, onLeave });
}

export function disposeAll() {
  for (const [el, { onMove, onLeave }] of registry) {
    el.removeEventListener('mousemove', onMove);
    el.removeEventListener('mouseleave', onLeave);
    gsap.set(el, { clearProps: 'transform,x,y' });
  }
  registry.clear();
}
