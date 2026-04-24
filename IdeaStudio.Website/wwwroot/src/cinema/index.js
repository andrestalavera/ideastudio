// cinema/index.js — V3 orchestrator. Exposes initialize / applyTheme / dispose
// over JS interop so Blazor can boot, theme, and tear down the engine.
// Passes (mesh, thread, letters) will be added in Phase 1.

import { Renderer } from './engine/renderer.js';
import { Clock } from './engine/clock.js';
import { Inputs } from './engine/inputs.js';
import { HeroState } from './engine/state.js';
import { prefersReducedMotion, batteryLow, setMotionMode } from './utils/perf.js';

let booted = false;
let renderer = null;
let clock = null;
let inputs = null;
let state = null;
let paused = false;
const pauseReasons = new Set();

async function computeInitialMotion() {
  if (prefersReducedMotion()) return 'reduced';
  if (await batteryLow()) return 'reduced';
  return null;
}

function pause(reason) { pauseReasons.add(reason); clock?.stop(); paused = true; }
function resume(reason) {
  pauseReasons.delete(reason);
  if (pauseReasons.size === 0 && paused) { clock?.start(); paused = false; }
}

export async function initialize() {
  if (booted) return;
  booted = true;

  const canvas = document.getElementById('gl-canvas');
  if (!canvas) return;

  const mode = await computeInitialMotion();
  if (mode) { setMotionMode(mode); return; }

  renderer = new Renderer(canvas);
  if (renderer.unsupported) { setMotionMode('off'); return; }

  inputs = new Inputs();
  state = new HeroState();

  clock = new Clock((t, dt) => {
    inputs.step(dt);
    state.update(inputs.scroll.page, window.innerWidth);
    // passes will render into renderer.gl here (Phase 1)
  });
  clock.start();

  document.addEventListener('visibilitychange', () => {
    document.hidden ? pause('hidden') : resume('hidden');
  });

  // Reading-progress rail.
  const bar = document.getElementById('ds-progress-bar');
  if (bar) {
    const tickBar = () => { bar.style.inlineSize = (inputs.scroll.page * 100).toFixed(2) + '%'; };
    window.addEventListener('scroll', tickBar, { passive: true });
    tickBar();
  }
}

export function applyTheme(scene) {
  if (typeof scene === 'string') document.documentElement.dataset.scene = scene;
}

export function dispose() {
  clock?.stop();
  inputs?.dispose();
  renderer?.dispose();
  renderer = null; inputs = null; state = null; clock = null;
  booted = false;
  pauseReasons.clear();
}

// Expose on window so Blazor's IJSRuntime can reach us without ES module gymnastics.
if (typeof window !== 'undefined') {
  window.ideastudioCinema = { initialize, applyTheme, dispose };
}
