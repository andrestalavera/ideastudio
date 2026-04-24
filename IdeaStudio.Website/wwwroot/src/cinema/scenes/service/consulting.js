import {
  Group, BufferGeometry, BufferAttribute, Points, PointsMaterial,
  LineSegments, LineBasicMaterial, Color, AdditiveBlending,
} from 'three';

export default async function consultingScene(ctx) {
  const { palette, plasma, parameters } = ctx;
  const root = new Group();
  const accent = parameters?.accent ? new Color(parameters.accent) : palette.azure;

  // Grid: 5 horizontal + 5 vertical lines, [-1.2, 1.2] wide, [-0.8, 0.8] tall.
  const cols = 5, rows = 5;
  const minX = -1.2, maxX = 1.2, minY = -0.8, maxY = 0.8;
  const xs = Array.from({ length: cols }, (_, i) => minX + (i / (cols - 1)) * (maxX - minX));
  const ys = Array.from({ length: rows }, (_, i) => minY + (i / (rows - 1)) * (maxY - minY));

  // Build segments (horizontal edges + vertical edges).
  const edges = []; // each: [x1, y1, x2, y2]
  for (const y of ys) for (let i = 0; i < cols - 1; i++) edges.push([xs[i], y, xs[i + 1], y]);
  for (const x of xs) for (let j = 0; j < rows - 1; j++) edges.push([x, ys[j], x, ys[j + 1]]);

  const lineBuf = new Float32Array(edges.length * 6);
  for (let i = 0; i < edges.length; i++) {
    const [x1, y1, x2, y2] = edges[i];
    const b = i * 6;
    lineBuf[b] = x1; lineBuf[b+1] = y1; lineBuf[b+2] = -0.3;
    lineBuf[b+3] = x2; lineBuf[b+4] = y2; lineBuf[b+5] = -0.3;
  }
  const lineGeom = new BufferGeometry();
  lineGeom.setAttribute('position', new BufferAttribute(lineBuf, 3));
  const lineMat = new LineBasicMaterial({ color: accent, transparent: true, opacity: 0.18 });
  const lines = new LineSegments(lineGeom, lineMat);
  root.add(lines);

  // Traveling particles along edges.
  const PARTICLE_COUNT = 120;
  const positions = new Float32Array(PARTICLE_COUNT * 3);
  const states = Array.from({ length: PARTICLE_COUNT }, () => ({
    edge: Math.floor(Math.random() * edges.length),
    t: Math.random(),
    speed: 0.25 + Math.random() * 0.5,
  }));
  const particlesGeom = new BufferGeometry();
  particlesGeom.setAttribute('position', new BufferAttribute(positions, 3));
  const particlesMat = new PointsMaterial({
    color: accent,
    size: 0.025,
    transparent: true,
    opacity: 0.85,
    blending: AdditiveBlending,
    depthWrite: false,
  });
  const particles = new Points(particlesGeom, particlesMat);
  root.add(particles);

  plasma.setPalette(palette.bg, palette.deep, accent);
  plasma.setIntensity(0.28);

  const writeParticles = (dt) => {
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const s = states[i];
      s.t += dt * s.speed;
      if (s.t >= 1) {
        s.t = 0;
        s.edge = Math.floor(Math.random() * edges.length);
        s.speed = 0.25 + Math.random() * 0.5;
      }
      const [x1, y1, x2, y2] = edges[s.edge];
      const b = i * 3;
      positions[b] = x1 + (x2 - x1) * s.t;
      positions[b + 1] = y1 + (y2 - y1) * s.t;
      positions[b + 2] = -0.3;
    }
    particlesGeom.attributes.position.needsUpdate = true;
  };
  writeParticles(0);

  return {
    root,
    update(dt) { writeParticles(dt); },
    setEnterProgress(v) { lineMat.opacity = 0.18 * v; particlesMat.opacity = 0.85 * v; },
    setExitProgress(v)  { lineMat.opacity = 0.18 * (1 - v); particlesMat.opacity = 0.85 * (1 - v); },
    dispose() {
      lineGeom.dispose(); lineMat.dispose();
      particlesGeom.dispose(); particlesMat.dispose();
    },
  };
}
