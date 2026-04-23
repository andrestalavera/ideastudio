import { boot, switchScene, shutdown, registerScene, pulseActiveScene } from './engine.js';
import cvScene from './scenes/cv.js';
import homeScene from './scenes/home.js';
import servicesHubScene from './scenes/services-hub.js';
import consultingScene from './scenes/service/consulting.js';
import techleadScene from './scenes/service/techlead.js';
import trainingScene from './scenes/service/training.js';
import vibeScene from './scenes/service/vibe.js';
import mobileScene from './scenes/service/mobile.js';
import webScene from './scenes/service/web.js';
import realisationsScene from './scenes/realisations.js';
import legalScene from './scenes/legal.js';
import * as reveals from './scroll/reveals.js';
import * as pinned from './scroll/pinned-timeline.js';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
gsap.registerPlugin(ScrollTrigger);

registerScene('cv', cvScene);
registerScene('home', homeScene);
registerScene('services-hub', servicesHubScene);
registerScene('service/consulting', consultingScene);
registerScene('service/techlead',   techleadScene);
registerScene('service/training',   trainingScene);
registerScene('service/vibe',       vibeScene);
registerScene('service/mobile',     mobileScene);
registerScene('service/web',        webScene);
registerScene('realisations',       realisationsScene);
registerScene('legal',              legalScene);

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

/**
 * Forwards a keyless pulse signal to the active scene. Scenes opt in by
 * exposing a `pulse()` method from their factory. Used for filter-change
 * bursts (see scenes/realisations.js).
 */
export async function pulse() {
  pulseActiveScene();
}

export async function dispose() {
  reveals.disposeAll();
  pinned.unregister();
  shutdown();
  booted = false;
}
