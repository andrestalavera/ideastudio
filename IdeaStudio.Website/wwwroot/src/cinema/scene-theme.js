// Sets the current scene on <html data-scene="..."> and (if parameters.accent)
// exposes --ds-scene-accent as an inline custom property on the root.
//
// Wrapped in document.startViewTransition where supported (see
// interactions/view-transition.js) so the scene swap cross-fades between the
// old and new root snapshot — Blazor WASM same-document route changes thus
// get a 360ms fade too, matching the @view-transition rule in SCSS.

import { withViewTransition } from './interactions/view-transition.js';

const KNOWN = new Set([
  'home', 'cv', 'services-hub', 'realisations', 'legal',
  'service/consulting', 'service/techlead', 'service/training',
  'service/vibe', 'service/mobile', 'service/web',
]);

const ACCENT_PATTERN = /^#[0-9a-fA-F]{3,8}$/;

/**
 * @param {string} scene
 * @param {Record<string, unknown>|null|undefined} parameters
 */
export function applyTheme(scene, parameters) {
  withViewTransition(() => {
    const root = document.documentElement;
    const safeName = KNOWN.has(scene) ? scene : 'default';
    root.dataset.scene = safeName;

    const accent = parameters && typeof parameters === 'object' ? parameters.accent : null;
    if (typeof accent === 'string' && ACCENT_PATTERN.test(accent)) {
      root.style.setProperty('--ds-scene-accent', accent);
    } else {
      root.style.removeProperty('--ds-scene-accent');
    }
  });
}
