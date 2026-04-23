import { boot, switchScene, shutdown, registerScene } from './engine.js';
import cvScene from './scenes/cv.js';
import homeScene from './scenes/home.js';
import servicesHubScene from './scenes/services-hub.js';
import * as reveals from './scroll/reveals.js';
import * as pinned from './scroll/pinned-timeline.js';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
gsap.registerPlugin(ScrollTrigger);

registerScene('cv', cvScene);
registerScene('home', homeScene);
registerScene('services-hub', servicesHubScene);

let booted = false;

/**
 * @param {HTMLCanvasElement} canvas
 */
export async function initialize(canvas) {
  if (booted) return;
  const result = await boot(canvas);
  booted = result !== null;
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
 *   Blazor serializes RevealOptions to camelCase via JS interop default naming policy.
 */
export async function registerReveal(id, element, options) {
  reveals.register(id, element, options);
}

export async function unregisterReveal(id) {
  reveals.unregister(id);
}

/**
 * @param {HTMLElement} container
 * @param {HTMLElement} track
 * @param {number} cardCount
 */
export async function registerPinnedTimeline(container, track, cardCount) {
  if (cardCount <= 0) return;
  pinned.register(container, track);
}

export async function unregisterPinnedTimeline() {
  pinned.unregister();
}

export async function setCulture(cultureName) {}

export async function dispose() {
  reveals.disposeAll();
  pinned.unregister();
  shutdown();
  booted = false;
}
