import { Group, Color } from 'three';
import { createParticles } from '../../layers/particles.js';

function roundedRectTargets(count, w, h, r, centerY = 0) {
  // Distribute points uniformly along the perimeter.
  const out = new Float32Array(count * 3);
  // Perimeter = 2*(w - 2r) + 2*(h - 2r) + 2*PI*r
  const straightW = Math.max(0, w - 2 * r);
  const straightH = Math.max(0, h - 2 * r);
  const arc = Math.PI * r * 2;
  const total = 2 * straightW + 2 * straightH + arc;
  for (let i = 0; i < count; i++) {
    let t = (i / count) * total;
    let x, y;
    if (t < straightW) { // top
      x = -straightW / 2 + t;
      y = h / 2;
    } else if ((t -= straightW) < arc / 4) { // top-right arc
      const a = (t / (arc / 4)) * (Math.PI / 2);
      x = straightW / 2 + Math.sin(a) * r;
      y = h / 2 - r + Math.cos(a) * r;
    } else if ((t -= arc / 4) < straightH) { // right
      x = w / 2;
      y = h / 2 - r - t;
    } else if ((t -= straightH) < arc / 4) { // bottom-right arc
      const a = (t / (arc / 4)) * (Math.PI / 2);
      x = straightW / 2 + Math.cos(a) * r;
      y = -h / 2 + r - Math.sin(a) * r;
    } else if ((t -= arc / 4) < straightW) { // bottom
      x = straightW / 2 - t;
      y = -h / 2;
    } else if ((t -= straightW) < arc / 4) { // bottom-left arc
      const a = (t / (arc / 4)) * (Math.PI / 2);
      x = -straightW / 2 - Math.sin(a) * r;
      y = -h / 2 + r - Math.cos(a) * r;
    } else if ((t -= arc / 4) < straightH) { // left
      x = -w / 2;
      y = -h / 2 + r + t;
    } else { // top-left arc
      t -= straightH;
      const a = (t / (arc / 4)) * (Math.PI / 2);
      x = -straightW / 2 - Math.cos(a) * r;
      y = h / 2 - r + Math.sin(a) * r;
    }
    out[i * 3] = x;
    out[i * 3 + 1] = y + centerY;
    out[i * 3 + 2] = (Math.random() - 0.5) * 0.04;
  }
  return out;
}

export default async function mobileScene(ctx) {
  const { palette, plasma, parameters } = ctx;
  const root = new Group();
  const accent = parameters?.accent ? new Color(parameters.accent) : palette.mint;

  const count = 3000;
  const particles = createParticles({ count, palette });
  particles.setTargets(roundedRectTargets(count, 0.7, 1.3, 0.12));
  particles.setColor(accent);
  particles.setSize(1.8);

  // Start scattered (below view for "rise from bottom" feel).
  const initial = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    initial[i * 3] = (Math.random() - 0.5) * 2.4;
    initial[i * 3 + 1] = -1.1 - Math.random() * 0.3; // below view
    initial[i * 3 + 2] = (Math.random() - 0.5) * 0.1;
  }
  // Abuse the geometry position attribute: particles lerp position -> target by progress.
  particles.points.geometry.attributes.position.array.set(initial);
  particles.points.geometry.attributes.position.needsUpdate = true;
  particles.setProgress(0);

  root.add(particles.points);

  plasma.setPalette(palette.bg, palette.deep, accent);
  plasma.setIntensity(0.28);

  const RISE_MS = 1600;
  let t = 0;
  let done = false;

  return {
    root,
    update(dt) {
      particles.update(dt);
      if (done) return;
      t += dt * 1000;
      const p = Math.min(1, t / RISE_MS);
      const eased = 1 - Math.pow(1 - p, 3);
      particles.setProgress(eased);
      if (p >= 1) done = true;
    },
    dispose() { particles.dispose(); },
  };
}
