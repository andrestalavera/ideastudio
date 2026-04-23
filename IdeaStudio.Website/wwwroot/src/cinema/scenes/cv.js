// wwwroot/src/cinema/scenes/cv.js
import { Group } from 'three';
import { createParticles, textTargets } from '../layers/particles.js';
import { createConstellation } from '../layers/constellation.js';

const TECH_LABELS = [
  '.NET', 'C#', 'Azure', 'Blazor', 'ASP.NET Core', 'TypeScript',
  'React', 'Vue', 'Node.js', 'Kubernetes', 'Docker', 'GitHub Actions',
  'SQL Server', 'PostgreSQL', 'Redis', 'RabbitMQ', 'SignalR', 'gRPC',
];

/**
 * @param {{ scene: import('three').Scene, camera: import('three').Camera, palette: Record<string, import('three').Color>, plasma: any, parameters?: Record<string, unknown>|null }} ctx
 */
export default async function cvScene(ctx) {
  const { palette, plasma } = ctx;
  const root = new Group();

  const isMobile = window.matchMedia('(max-width: 767px)').matches;
  const particleCount = isMobile ? 3000 : 18000;

  const particles = createParticles({ count: particleCount, palette });
  particles.points.position.z = -0.5;
  particles.setColor(palette.cyan);
  root.add(particles.points);

  const constellation = createConstellation({
    nodes: TECH_LABELS.map(label => ({ label })),
    palette,
  });
  if (constellation.mesh) {
    constellation.mesh.position.set(0, 0, -1.3);
    constellation.lines.position.copy(constellation.mesh.position);
    constellation.setOpacity(0);
    root.add(constellation.mesh);
    root.add(constellation.lines);
  }

  const assembleName = () => {
    const targets = textTargets(particleCount, 'Andrés Talavera', {
      fontSize: isMobile ? 80 : 140,
      font: 'Inter, sans-serif',
    });
    particles.setTargets(targets);
    particles.setProgress(1);
  };
  assembleName();
  if ('fonts' in document) {
    document.fonts.ready.then(() => assembleName());
  }

  plasma.setPalette(palette.bg, palette.deep, palette.cyan);
  plasma.setIntensity(0.85);

  const onScroll = () => {
    const hero = document.getElementById('hero');
    if (!hero) return;
    const heroBottom = hero.offsetTop + hero.offsetHeight;
    const p = Math.min(1, Math.max(0, window.scrollY / Math.max(1, heroBottom)));
    particles.setProgress(1 - p);
    constellation.setOpacity?.(p * 0.8);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  return {
    root,
    update(dt) { particles.update(dt); },
    onResize() { onScroll(); },
    dispose() {
      window.removeEventListener('scroll', onScroll);
      particles.dispose();
      constellation.dispose();
    },
  };
}
