// cinema/index.js — V3 orchestrator. Owns the renderer, clock, inputs, hero
// state machine, and the mesh + thread passes. Exposes initialize /
// applyTheme / dispose over JS interop.

import { Renderer } from './engine/renderer.js';
import { Clock } from './engine/clock.js';
import { Inputs } from './engine/inputs.js';
import { HeroState } from './engine/state.js';
import { createMeshPass } from './passes/mesh.js';
import { createThreadPass } from './passes/thread.js';
import { attachReveals, disposeReveals } from './interactions/reveals.js';
import { attachCursor, disposeCursor } from './interactions/cursor.js';
import { attachNavMorph, disposeNavMorph } from './interactions/nav-morph.js';
import { prefersReducedMotion, batteryLow, setMotionMode } from './utils/perf.js';

let booted = false;
let renderer = null;
let clock = null;
let inputs = null;
let state = null;
let mesh = null;
let thread = null;
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
  thread = createThreadPass(renderer);

  const ctx = () => ({ pointer: inputs.pointer, scroll: inputs.scroll, state });

  clock = new Clock((t, dt) => {
    inputs.step(dt);
    state.update(inputs.scroll.page, window.innerWidth);
    const c = ctx();
    mesh?.render(t, c);
    thread?.render(t, c);
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

  // Route-change hook: re-anchor the thread and rewire reveals when the
  // DOM swaps via Blazor's router.
  window.addEventListener('ideastudio:routechanged', () => {
    attachReveals();
    thread?.rebuild();
  });
}

export function applyTheme(scene) {
  if (typeof scene === 'string') document.documentElement.dataset.scene = scene;
  mesh?.refreshPalette?.();
  thread?.refresh?.();
}

export function dispose() {
  clock?.stop();
  thread?.dispose();
  mesh?.dispose();
  inputs?.dispose();
  renderer?.dispose();
  disposeReveals();
  disposeCursor();
  disposeNavMorph();
  mesh = null; thread = null; renderer = null; inputs = null; state = null; clock = null;
  booted = false;
  pauseReasons.clear();
}

if (typeof window !== 'undefined') {
  window.ideastudioCinema = { initialize, applyTheme, dispose };
}
