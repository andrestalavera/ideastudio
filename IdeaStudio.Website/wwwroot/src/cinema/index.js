// Phase D — editorial rebuild.
// WebGL backdrop removed (the CSS radial + breath handles ambience now).
// magnetic interactions dropped. What's left:
//   - cursor: one 12px amber dot, mix-blend-difference.
//   - reveals: IntersectionObserver-driven fade-up for [data-reveal].
//   - sticky-hero: adds is-past-hero on html once the hero has scrolled off.
//   - hero-stage: a quiet GSAP fade-up on hero direct children.

import * as cursor from './interactions/cursor.js';
import * as reveals from './interactions/reveals.js';
import * as stickyHero from './interactions/sticky-hero.js';
import * as heroStage from './interactions/hero-stage.js';
import { applyTheme as applyThemeInternal } from './scene-theme.js';

let booted = false;

export async function initialize() {
  if (booted) return;
  booted = true;
  cursor.enable();
  reveals.attachAll();
  stickyHero.attach();
  heroStage.attachAll();
}

/**
 * @param {string} scene
 * @param {Record<string, unknown>|null} parameters
 */
export async function applyTheme(scene, parameters) {
  applyThemeInternal(scene, parameters);
  reveals.attachAll();
  stickyHero.attach();
  heroStage.reset();
  heroStage.attachAll();
}

export async function pulse() {
  const root = document.documentElement;
  root.classList.remove('is-pulsing');
  void root.offsetWidth;
  root.classList.add('is-pulsing');
  window.setTimeout(() => root.classList.remove('is-pulsing'), 700);
}

export async function dispose() {
  cursor.disable();
  reveals.disposeAll();
  stickyHero.detach();
  booted = false;
}
