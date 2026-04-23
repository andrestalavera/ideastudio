import { Group } from 'three';
import { createParticles, scatterTargets } from '../layers/particles.js';

const MOBILE_QUERY = '(max-width: 767px)';
const BURST_MS = 650;

/**
 * Three depth layers of scattered particles at different z, with mouse parallax
 * on the root group and scroll parallax where each layer translates Y at a
 * different rate. On pulse(), each layer's progress resets to 0 (scattered
 * "position" buffer) and ease-out-cubics back to 1 (aTarget buffer) over
 * BURST_MS — the "shatter" burst used for filter-change feedback.
 *
 * @param {{ palette: Record<string, import('three').Color>, plasma: any }} ctx
 */
export default async function realisationsScene(ctx) {
  const { palette, plasma } = ctx;
  const root = new Group();

  const isMobile = window.matchMedia(MOBILE_QUERY).matches;

  // Three depth layers (back/mid/front), with different particle counts,
  // sizes, and parallax response factors.
  const specs = [
    { z: -0.9, count: isMobile ? 1200 : 5000, size: 1.2, color: palette.deep,  mouseFactor: 0.05, scrollFactor: 0.05 },
    { z: -0.4, count: isMobile ? 900  : 3500, size: 1.5, color: palette.azure, mouseFactor: 0.10, scrollFactor: 0.10 },
    { z:  0.0, count: isMobile ? 500  : 2000, size: 2.0, color: palette.cyan,  mouseFactor: 0.18, scrollFactor: 0.18 },
  ];

  const layers = specs.map(spec => {
    const p = createParticles({ count: spec.count, palette });
    // Scattered positions for BOTH "position" attribute (the initial scatter)
    // AND "aTarget" (what setProgress(1) morphs toward). Two independent
    // random sets so progress=0 vs progress=1 look distinct — which is what
    // lets the burst read as motion rather than a static shuffle.
    p.setTargets(scatterTargets(spec.count));
    p.setProgress(1);
    p.setColor(spec.color);
    p.setSize(spec.size);
    p.points.position.z = spec.z;
    root.add(p.points);
    return { p, spec };
  });

  plasma.setPalette(palette.bg, palette.deep, palette.azure);
  plasma.setIntensity(0.85);

  // Mouse parallax: root x/y tracks mouse offset (lerped in update).
  let mouseX = 0;
  let mouseY = 0;
  const onMouseMove = (e) => {
    mouseX = (e.clientX / window.innerWidth)  * 2 - 1;
    mouseY = (e.clientY / window.innerHeight) * 2 - 1;
  };
  if (!isMobile) window.addEventListener('mousemove', onMouseMove, { passive: true });

  // Scroll parallax: track scrollY and update layer Y positions per frame.
  let scrollY = window.scrollY || 0;
  const onScroll = () => { scrollY = window.scrollY || 0; };
  window.addEventListener('scroll', onScroll, { passive: true });

  // Burst state: -Infinity = no burst active (progress stays at 1).
  let burstStart = -Infinity;

  return {
    root,
    update(dt) {
      // Mouse parallax (lerp toward target for smoothness).
      const targetX = mouseX * 0.08;
      const targetY = -mouseY * 0.05;
      root.position.x += (targetX - root.position.x) * Math.min(1, dt * 3);
      root.position.y += (targetY - root.position.y) * Math.min(1, dt * 3);

      // Per-layer scroll parallax: shift each layer's y by scrollY * factor,
      // mapped to clip-space units (scrollY in pixels → rough clip units).
      const scrollUnits = scrollY / Math.max(1, window.innerHeight);

      // Burst progress ramp: 0 → 1 over BURST_MS with ease-out-cubic.
      const elapsed = performance.now() - burstStart;
      let burstT = 1; // default: fully assembled
      if (elapsed >= 0 && elapsed < BURST_MS) {
        const p = elapsed / BURST_MS;
        burstT = 1 - Math.pow(1 - p, 3);
      }

      for (const layer of layers) {
        layer.p.update(dt);
        layer.p.setProgress(burstT);
        layer.p.points.position.y = -scrollUnits * layer.spec.scrollFactor;
      }
    },
    onResize() {},
    pulse() {
      // Begin a new burst: progress flips to 0 (shows scattered "position"
      // attribute instead of "aTarget"), then ease-out-cubics back to 1.
      burstStart = performance.now();
    },
    setEnterProgress(_v) {
      // Particles shader doesn't honor material.opacity (vAlpha-driven),
      // so we don't have a clean fade. Accept the additive-blend double-
      // glow during the 600ms crossfade — same tradeoff as Home.
    },
    setExitProgress(_v) {
      // Mirror of setEnterProgress. No-op.
    },
    dispose() {
      if (!isMobile) window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('scroll', onScroll);
      for (const layer of layers) layer.p.dispose();
    },
  };
}
