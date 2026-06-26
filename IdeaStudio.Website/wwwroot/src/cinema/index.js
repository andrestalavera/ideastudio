// cinema/index.js — V3 orchestrator. Owns the renderer, clock, inputs, hero
// state machine, and the mesh + thread passes. Exposes initialize /
// applyTheme / dispose over JS interop.

import { Renderer } from './engine/renderer.js';
import { Clock } from './engine/clock.js';
import { Inputs } from './engine/inputs.js';
import { HeroState } from './engine/state.js';
import { createMeshPass } from './passes/mesh.js';
import { attachReveals, disposeReveals } from './interactions/reveals.js';
import { attachCursor, disposeCursor } from './interactions/cursor.js';
import { attachNavMorph, disposeNavMorph } from './interactions/nav-morph.js';
import { prefersReducedMotion, batteryLow, setMotionMode } from './utils/perf.js';
export { mountSignature } from './signature/signature-name.js';
import './analytics/index.js'; // side-effect: defines window.ideaAnalytics

let booted = false;
let renderer = null;
let clock = null;
let inputs = null;
let state = null;
let mesh = null;
let paused = false;
const pauseReasons = new Set();

async function computeInitialMotion() {
  if (prefersReducedMotion()) return 'reduced';
  if (await batteryLow()) return 'reduced';
  return null;
}

function pause(r) { pauseReasons.add(r); clock?.stop(); paused = true; }
function resume(r) {
  pauseReasons.delete(r);
  if (pauseReasons.size === 0 && paused) { clock?.start(); paused = false; }
}

export async function initialize() {
  if (booted) return;
  booted = true;

  // Flip the reveal gate on. Until now [data-reveal] / per-char content paints
  // immediately (LCP-safe); from here CSS drops elements into their hidden
  // pre-reveal state and the IntersectionObserver choreographs them in.
  document.documentElement.classList.add('cinema-ready');

  // Always attach reveals/cursor/nav-morph — they work without WebGL.
  attachReveals();
  attachCursor();
  attachNavMorph();

  const canvas = document.getElementById('gl-canvas');
  if (!canvas) return;

  const mode = await computeInitialMotion();
  if (mode) { setMotionMode(mode); return; }

  renderer = new Renderer(canvas);
  if (renderer.unsupported) { setMotionMode('off'); return; }

  inputs = new Inputs();
  state = new HeroState();
  mesh = createMeshPass(renderer);

  const ctx = () => ({ pointer: inputs.pointer, scroll: inputs.scroll, state });

  clock = new Clock((t, dt) => {
    inputs.step(dt);
    state.update(inputs.scroll.page, window.innerWidth);
    const c = ctx();
    mesh?.render(t, c);
  });

  // The mesh is a dark-mode signature; light theme stays static (CSS hides the
  // canvas). Don't burn GPU/battery rendering a hidden canvas in light.
  if (document.documentElement.getAttribute('data-theme') === 'light') {
    pause('theme');
  } else {
    clock.start();
  }

  document.addEventListener('visibilitychange', () => {
    document.hidden ? pause('hidden') : resume('hidden');
  });

  // Reading-progress rail is driven entirely by CSS (animation-timeline:
  // scroll(root)) in components/_progress.scss — no JS scroll listener here.

  // Route-change hook: rewire reveals when the DOM swaps via Blazor's router.
  window.addEventListener('ideastudio:routechanged', () => {
    attachReveals();
  });
}

export function applyTheme(scene) {
  if (typeof scene === 'string') document.documentElement.dataset.scene = scene;
  mesh?.refreshPalette?.();
}

export function dispose() {
  clock?.stop();
  mesh?.dispose();
  inputs?.dispose();
  renderer?.dispose();
  disposeReveals();
  disposeCursor();
  disposeNavMorph();
  // Restore the LCP-safe visible default so torn-down content never sticks
  // hidden if the runtime is disposed without a re-init.
  document.documentElement.classList.remove('cinema-ready');
  mesh = null; renderer = null; inputs = null; state = null; clock = null;
  booted = false;
  pauseReasons.clear();
}

if (typeof window !== 'undefined') {
  window.ideastudioCinema = { initialize, applyTheme, dispose };

  // React to runtime theme switches: pause the backdrop in light, resume +
  // resync the palette in dark. Safe before initialize() (clock/mesh null).
  window.addEventListener('ideastudio:themechanged', (e) => {
    const light = e && e.detail && e.detail.theme === 'light';
    if (light) pause('theme');
    else resume('theme');
    mesh?.refreshPalette?.();
  });
}
