import { Group, Color } from 'three';
import { createParticles, scatterTargets } from '../../layers/particles.js';

export default async function vibeScene(ctx) {
  const { palette, plasma, parameters } = ctx;
  const root = new Group();
  const accent = parameters?.accent ? new Color(parameters.accent) : palette.sky;
  const complement = palette.sky; // azure->sky mild contrast pair

  const count = 5000;

  // Layer A: accent, nudged slightly right.
  const a = createParticles({ count, palette });
  a.setTargets(scatterTargets(count));
  a.setProgress(1);
  a.setColor(accent);
  a.setSize(1.4);
  a.points.position.x = 0.02;
  root.add(a.points);

  // Layer B: complement, nudged slightly left.
  const b = createParticles({ count, palette });
  b.setTargets(scatterTargets(count));
  b.setProgress(1);
  b.setColor(complement);
  b.setSize(1.4);
  b.points.position.x = -0.02;
  root.add(b.points);

  plasma.setPalette(palette.bg, palette.deep, accent);
  plasma.setIntensity(0.95);

  let t = 0;
  let nextGlitch = 1.5 + Math.random() * 2.5;

  return {
    root,
    update(dt) {
      t += dt;
      a.update(dt);
      b.update(dt);
      // Glitch: brief horizontal jitter on both layers + chromatic widening.
      if (t >= nextGlitch) {
        const magnitude = 0.04 + Math.random() * 0.04;
        a.points.position.x =  magnitude;
        b.points.position.x = -magnitude;
        // schedule next glitch.
        nextGlitch = t + 1.5 + Math.random() * 2.5;
        // Ease back over 150ms by decrementing in the next frames.
        setTimeout(() => { a.points.position.x = 0.02; b.points.position.x = -0.02; }, 150);
      }
    },
    dispose() { a.dispose(); b.dispose(); },
  };
}
