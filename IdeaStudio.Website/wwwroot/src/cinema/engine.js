import { WebGLRenderer, Scene, OrthographicCamera, Clock } from 'three';
import { gsap } from 'gsap';
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

  const raf = { id: 0, running: true };

  function render() {
    if (!raf.running) return;
    const dt = clock.getDelta();
    plasma.update(dt);
    state?.activeScene?.update?.(dt);
    renderer.render(scene, camera);
    raf.id = requestAnimationFrame(render);
  }
  raf.id = requestAnimationFrame(render);

  const onResize = () => {
    renderer.setSize(window.innerWidth, window.innerHeight, false);
    state?.activeScene?.onResize?.(window.innerWidth, window.innerHeight);
  };
  window.addEventListener('resize', onResize, { passive: true });

  const reducedMotionDispose = watchReducedMotion(on => {
    if (on) { raf.running = false; cancelAnimationFrame(raf.id); renderer.clear(); }
    else if (!raf.running) { raf.running = true; raf.id = requestAnimationFrame(render); }
  });

  const listenerDisposers = [
    () => window.removeEventListener('resize', onResize),
    reducedMotionDispose,
  ];

  state = { renderer, scene, camera, clock, palette, plasma, activeScene: null, raf, listenerDisposers };
  return state;
}

export async function switchScene(name, parameters) {
  if (!state) return;
  const factory = sceneRegistry.get(name);
  if (!factory) {
    console.warn('[cinema] unknown scene', name);
    return;
  }

  const outgoing = state.activeScene;
  const incoming = await factory({
    scene: state.scene,
    camera: state.camera,
    palette: state.palette,
    plasma: state.plasma,
    parameters,
  });

  setGroupOpacity(incoming.root, 0);
  state.scene.add(incoming.root);

  // Swap early so the render loop animates the incoming scene during the fade.
  state.activeScene = incoming;

  await new Promise(resolve => {
    gsap.to({ v: 0 }, {
      v: 1,
      duration: 0.6,
      ease: 'power2.out',
      onUpdate() {
        const v = this.targets()[0].v;
        if (outgoing) setGroupOpacity(outgoing.root, 1 - v);
        setGroupOpacity(incoming.root, v);
      },
      onComplete: resolve,
    });
  });

  if (outgoing) {
    state.scene.remove(outgoing.root);
    outgoing.dispose?.();
  }
}

function setGroupOpacity(group, v) {
  group.traverse(obj => {
    const mat = obj.material;
    if (!mat) return;
    if (Array.isArray(mat)) {
      for (const m of mat) {
        m.transparent = true;
        m.opacity = v;
      }
    } else {
      mat.transparent = true;
      mat.opacity = v;
    }
  });
}

export function shutdown() {
  if (!state) return;
  state.raf.running = false;
  cancelAnimationFrame(state.raf.id);
  for (const dispose of state.listenerDisposers) dispose();
  state.activeScene?.dispose?.();
  state.plasma.dispose();
  state.renderer.dispose();
  state = null;
}
