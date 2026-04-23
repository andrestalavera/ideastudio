import { WebGLRenderer, Scene, OrthographicCamera, Clock } from 'three';
import { createPlasma } from './layers/plasma.js';
import { readPalette } from './utils/tokens.js';
import { hasWebGL2 } from './utils/webgl-support.js';
import { prefersReducedMotion, watchReducedMotion } from './utils/reduced-motion.js';

const sceneRegistry = new Map();
export function registerScene(name, factory) { sceneRegistry.set(name, factory); }

let state = null;

export async function boot(canvas) {
  if (!hasWebGL2()) return null;
  if (prefersReducedMotion()) return null;

  const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight, false);

  const scene = new Scene();
  const camera = new OrthographicCamera(-1, 1, 1, -1, 0, 10);
  const clock = new Clock();
  const palette = readPalette();
  const plasma = createPlasma(palette);
  scene.add(plasma.mesh);

  let activeScene = null;
  let rafId;

  function render() {
    const dt = clock.getDelta();
    plasma.update(dt);
    activeScene?.update?.(dt);
    renderer.render(scene, camera);
    rafId = requestAnimationFrame(render);
  }
  rafId = requestAnimationFrame(render);

  function onResize() {
    renderer.setSize(window.innerWidth, window.innerHeight, false);
    activeScene?.onResize?.(window.innerWidth, window.innerHeight);
  }
  window.addEventListener('resize', onResize, { passive: true });

  watchReducedMotion(on => {
    if (on) { cancelAnimationFrame(rafId); renderer.clear(); }
    else { rafId = requestAnimationFrame(render); }
  });

  state = { renderer, scene, camera, clock, palette, plasma, activeScene, rafId };
  return state;
}

export async function switchScene(name, parameters) {
  if (!state) return;
  const factory = sceneRegistry.get(name);
  if (!factory) { console.warn('[cinema] unknown scene', name); return; }

  if (state.activeScene) {
    state.activeScene.dispose?.();
    state.scene.remove(state.activeScene.root);
  }
  const instance = await factory({
    scene: state.scene, camera: state.camera, palette: state.palette, plasma: state.plasma, parameters,
  });
  if (instance.root) state.scene.add(instance.root);
  state.activeScene = instance;
}

export function shutdown() {
  if (!state) return;
  cancelAnimationFrame(state.rafId);
  state.activeScene?.dispose?.();
  state.plasma.dispose();
  state.renderer.dispose();
  state = null;
}
