// Tiny runtime: scene theming + reveals + magnetic + sticky hero + cursor.
// No WebGL, no GSAP. All visual animation is SCSS.

import * as cursor from './interactions/cursor.js';
import * as reveals from './interactions/reveals.js';
import * as magnetic from './interactions/magnetic.js';
import * as stickyHero from './interactions/sticky-hero.js';
import { applyTheme as applyThemeInternal } from './scene-theme.js';

let booted = false;

export async function initialize() {
  if (booted) return;
  booted = true;
  cursor.enable();
  reveals.attachAll();
  magnetic.attachAll();
  stickyHero.attach();
}

/**
 * @param {string} scene
 * @param {Record<string, unknown>|null} parameters
 */
export async function applyTheme(scene, parameters) {
  applyThemeInternal(scene, parameters);
  // After a page swap, newly-rendered DOM needs reveals/magnetic/sticky-hero re-attached.
  reveals.attachAll();
  magnetic.attachAll();
  stickyHero.attach();
}

export async function pulse() {
  // One-shot class for SCSS-driven reaction to state changes (e.g. filter applied).
  const root = document.documentElement;
  root.classList.remove('is-pulsing');
  // eslint-disable-next-line no-unused-expressions
  void root.offsetWidth; // reflow to reset any in-flight animation
  root.classList.add('is-pulsing');
  window.setTimeout(() => root.classList.remove('is-pulsing'), 700);
}

export async function dispose() {
  cursor.disable();
  reveals.disposeAll();
  magnetic.disposeAll();
  stickyHero.detach();
  booted = false;
}
