import { Group, Color } from 'three';
import { createParticles, scatterTargets } from '../../layers/particles.js';

const BASE_OFFSET = 0.02;

export default async function vibeScene(ctx) {
  const { palette, plasma, parameters } = ctx;
  const root = new Group();
  const accent = parameters?.accent ? new Color(parameters.accent) : palette.azure;
  const complement = palette.sky;

  const count = 5000;

  // Layer A: accent, nudged slightly right.
  const a = createParticles({ count, palette });
  a.setTargets(scatterTargets(count));
  a.setProgress(1);
  a.setColor(accent);
  a.setSize(1.4);
  a.points.position.x = BASE_OFFSET;
  root.add(a.points);

  // Layer B: complement, nudged slightly left.
  const b = createParticles({ count, palette });
  b.setTargets(scatterTargets(count));
  b.setProgress(1);
  b.setColor(complement);
  b.setSize(1.4);
  b.points.position.x = -BASE_OFFSET;
  root.add(b.points);

  plasma.setPalette(palette.bg, palette.deep, accent);
  plasma.setIntensity(0.32);

  let t = 0;
  let nextGlitch = 1.5 + Math.random() * 2.5;
  let glitchTimer = 0;

  return {
    root,
    update(dt) {
      t += dt;
      a.update(dt);
      b.update(dt);
      if (t >= nextGlitch) {
        const magnitude = 0.04 + Math.random() * 0.04;
        a.points.position.x =  magnitude;
        b.points.position.x = -magnitude;
        nextGlitch = t + 1.5 + Math.random() * 2.5;
        if (glitchTimer) clearTimeout(glitchTimer);
        glitchTimer = setTimeout(() => {
          a.points.position.x =  BASE_OFFSET;
          b.points.position.x = -BASE_OFFSET;
          glitchTimer = 0;
        }, 150);
      }
    },
    dispose() {
      if (glitchTimer) { clearTimeout(glitchTimer); glitchTimer = 0; }
      a.dispose();
      b.dispose();
    },
  };
}
