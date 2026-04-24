// Phase C3: CSS-first foundation + living WebGL aurora backdrop + GSAP
// orchestration for the hero entrance. CSS keeps char reveal, page stagger,
// 3D tilt, view transitions, read progress; WebGL adds a single continuous
// aurora behind everything; GSAP amplifies the hero envelope.

import * as cursor from './interactions/cursor.js';
import * as reveals from './interactions/reveals.js';
import * as magnetic from './interactions/magnetic.js';
import * as stickyHero from './interactions/sticky-hero.js';
import * as heroStage from './interactions/hero-stage.js';
import * as backdrop from './backdrop.js';
import { applyTheme as applyThemeInternal } from './scene-theme.js';

let booted = false;

export async function initialize() {
  if (booted) return;
  booted = true;
  backdrop.boot();
  cursor.enable();
  reveals.attachAll();
  magnetic.attachAll();
  stickyHero.attach();
  heroStage.attachAll();
}

/**
 * @param {string} scene
 * @param {Record<string, unknown>|null} parameters
 */
export async function applyTheme(scene, parameters) {
  applyThemeInternal(scene, parameters);
  backdrop.refresh();     // re-read CSS accents after the data-scene swap
  // After a page swap, newly-rendered DOM needs reveals/magnetic/sticky-hero re-attached.
  reveals.attachAll();
  magnetic.attachAll();
  stickyHero.attach();
  heroStage.reset();      // allow a new page's hero to play
  heroStage.attachAll();
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
  backdrop.shutdown();
  booted = false;
}
