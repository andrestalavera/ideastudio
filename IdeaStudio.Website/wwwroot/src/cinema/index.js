import { boot, switchScene, shutdown, registerScene } from './engine.js';

let booted = false;

/**
 * @param {HTMLCanvasElement} canvas
 * @param {any} dotNetRef
 */
export async function initialize(canvas, dotNetRef) {
  if (booted) return;
  const result = await boot(canvas);
  booted = result !== null;
  // Phase 3+ will register actual scenes. For now, the plasma layer is always on.
}

/**
 * @param {string} name
 * @param {Record<string, unknown>|null} parameters
 */
export async function setScene(name, parameters) {
  if (!booted) return;
  await switchScene(name, parameters);
}

/**
 * Registers a DOM element for a scroll-triggered reveal animation.
 * @param {string} id
 * @param {HTMLElement} element
 * @param {{kind:string, delayMs:number, staggerMs:number, selector:string|null}} options
 *   Blazor serializes `RevealOptions` to camelCase via JS interop default naming policy.
 */
export async function registerReveal(id, element, options) {
  // Phase 3 wires this to scroll/reveals.js
}
export async function unregisterReveal(id) {}
export async function registerPinnedTimeline(container, track, cardCount) {}
export async function setCulture(cultureName) {}
export async function dispose() { shutdown(); booted = false; }
