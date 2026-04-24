import {
  Group,
  BufferGeometry,
  BufferAttribute,
  LineSegments,
  LineBasicMaterial,
} from 'three';
import { createParticles } from '../layers/particles.js';

function sphereTargets(arr, radius) {
  const n = arr.length / 3;
  for (let i = 0; i < n; i++) {
    const u = Math.random();
    const v = Math.random();
    const theta = 2 * Math.PI * u;
    const phi = Math.acos(2 * v - 1);
    arr[i * 3]     = radius * Math.sin(phi) * Math.cos(theta);
    arr[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta) * 0.6;
    arr[i * 3 + 2] = radius * Math.cos(phi);
  }
}

/**
 * @param {{ palette: Record<string, import('three').Color>, plasma: any }} ctx
 */
export default async function homeScene(ctx) {
  const { palette, plasma } = ctx;
  const root = new Group();

  const isMobile = window.matchMedia('(max-width: 767px)').matches;
  const count = isMobile ? 2500 : 12000;

  const particles = createParticles({ count, palette });
  particles.setColor(palette.mint);

  const targets = new Float32Array(count * 3);
  sphereTargets(targets, 1.1);
  particles.setTargets(targets);
  particles.setProgress(1);
  root.add(particles.points);

  // Six rays: two endpoints per ray, three coords per endpoint.
  const rayPositions = new Float32Array(6 * 2 * 3);
  const rayGeom = new BufferGeometry();
  rayGeom.setAttribute('position', new BufferAttribute(rayPositions, 3));
  const rayMat = new LineBasicMaterial({
    color: palette.azure,
    transparent: true,
    opacity: 0.6,
  });
  const rays = new LineSegments(rayGeom, rayMat);
  root.add(rays);

  // Grid is mounted before PageScene renders, but if a future change reorders
  // things, re-query next tick as a fallback. `cards` is cached for the scene's
  // lifetime to avoid querySelectorAll on every scroll event.
  let cards = document.querySelectorAll('[data-service-anchor]');

  const updateRays = () => {
    if (!cards.length) return;
    const w = window.innerWidth;
    const h = window.innerHeight;
    for (let i = 0; i < Math.min(6, cards.length); i++) {
      const rect = cards[i].getBoundingClientRect();
      const cx = ((rect.left + rect.width / 2) / w) * 2 - 1;
      const cy = -(((rect.top + rect.height / 2) / h) * 2 - 1);
      const base = i * 6;
      rayPositions[base + 0] = 0;
      rayPositions[base + 1] = 0;
      rayPositions[base + 2] = 0;
      rayPositions[base + 3] = cx * 1.2;
      rayPositions[base + 4] = cy * 0.7;
      rayPositions[base + 5] = 0;
    }
    rayGeom.attributes.position.needsUpdate = true;
  };

  updateRays();
  if (!cards.length) {
    requestAnimationFrame(() => {
      cards = document.querySelectorAll('[data-service-anchor]');
      updateRays();
    });
  }
  const onScroll = () => updateRays();
  const onResize = () => updateRays();
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onResize, { passive: true });

  plasma.setPalette(palette.bg, palette.deep, palette.mint);
  plasma.setIntensity(0.28);

  let t = 0;
  return {
    root,
    update(dt) {
      t += dt;
      particles.update(dt);
      root.scale.setScalar(1 + Math.sin(t * 0.8) * 0.03);
    },
    onResize() { updateRays(); },
    setExitProgress(v) {
      // v: 0 = in-place, 1 = fully dispersed. Drives the particles shader's
      // morph uniform to fade the sphere back into its scattered state.
      particles.setProgress(1 - v);
    },
    dispose() {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      particles.dispose();
      rayGeom.dispose();
      rayMat.dispose();
    },
  };
}
