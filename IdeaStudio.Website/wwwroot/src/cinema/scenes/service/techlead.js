import { Group, Color } from 'three';
import { createParticles, ringTargets } from '../../layers/particles.js';

export default async function techleadScene(ctx) {
  const { palette, plasma, parameters } = ctx;
  const root = new Group();
  const accent = parameters?.accent ? new Color(parameters.accent) : palette.teal;

  // Central ring: 4000 particles sampled on a torus-like ring.
  const ringCount = 4000;
  const ring = createParticles({ count: ringCount, palette });
  ring.setTargets(ringTargets(ringCount, 0.75));
  ring.setProgress(1);
  ring.setColor(accent);
  ring.setSize(1.8);
  root.add(ring.points);

  // Orbital: 200 particles orbiting at varied radii and speeds.
  const orbitCount = 200;
  const orbit = createParticles({ count: orbitCount, palette });
  const orbitPositions = new Float32Array(orbitCount * 3);
  const orbits = Array.from({ length: orbitCount }, () => ({
    r: 0.9 + Math.random() * 0.4,
    angle: Math.random() * Math.PI * 2,
    speed: 0.4 + Math.random() * 0.6,
    tilt: (Math.random() - 0.5) * 0.5,
  }));
  // Use orbit.setTargets + setProgress(1) with positions we update each frame.
  orbit.setTargets(orbitPositions);
  orbit.setProgress(1);
  orbit.setColor(accent);
  orbit.setSize(2.4);
  root.add(orbit.points);

  plasma.setPalette(palette.bg, palette.deep, accent);
  plasma.setIntensity(0.75);

  return {
    root,
    update(dt) {
      ring.update(dt);
      orbit.update(dt);
      for (let i = 0; i < orbitCount; i++) {
        const o = orbits[i];
        o.angle += dt * o.speed;
        const x = Math.cos(o.angle) * o.r;
        const y = Math.sin(o.angle) * o.r * 0.6 + o.tilt * 0.2;
        const z = Math.sin(o.angle) * o.tilt;
        orbitPositions[i * 3] = x;
        orbitPositions[i * 3 + 1] = y;
        orbitPositions[i * 3 + 2] = z;
      }
      // The target buffer drives final positions at progress=1. Rewrite by setTargets.
      orbit.setTargets(orbitPositions);
      orbit.setProgress(1);
    },
    dispose() { ring.dispose(); orbit.dispose(); },
  };
}
