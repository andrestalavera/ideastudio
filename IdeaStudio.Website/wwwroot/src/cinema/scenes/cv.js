// wwwroot/src/cinema/scenes/cv.js
import { Group } from 'three';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
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

  let scrollTrigger = null;
  let introDone = false;

  // While the intro is running, the rAF tick owns particles.setProgress.
  // Once introDone flips true, scroll drives the visual state.
  const applyProgress = (p) => {
    if (!introDone) return;
    const clamped = Math.min(1, Math.max(0, p));
    particles.setProgress(1 - clamped);
    constellation.setOpacity?.(clamped * 0.8);
  };

  const finishIntro = () => {
    introDone = true;
    if (scrollTrigger) applyProgress(scrollTrigger.progress);
  };

  const assembleName = () => {
    const targets = textTargets(particleCount, 'Andrés Talavera', {
      fontSize: isMobile ? 80 : 140,
      font: 'Inter, sans-serif',
    });
    particles.setTargets(targets);
  };

  // Start scattered. Assemble once Inter is available.
  particles.setProgress(0);
  if ('fonts' in document && 'load' in document.fonts) {
    document.fonts.load(`700 ${isMobile ? 80 : 140}px "Inter"`).then(() => {
      assembleName();
      // Fade progress to 1 so the scattered cloud glides into the name shape.
      const start = performance.now();
      const duration = 900;
      const tick = (now) => {
        const t = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - t, 3); // ease-out cubic
        particles.setProgress(eased);
        if (t < 1) requestAnimationFrame(tick);
        else finishIntro();
      };
      requestAnimationFrame(tick);
    }).catch(() => {
      // Font unavailable — fall back to scattered; still readable.
      assembleName();
      particles.setProgress(1);
      finishIntro();
    });
  } else {
    // Legacy browser with no Font Loading API — assemble immediately.
    assembleName();
    particles.setProgress(1);
    finishIntro();
  }

  plasma.setPalette(palette.bg, palette.deep, palette.cyan);
  plasma.setIntensity(0.3);

  const heroEl = document.querySelector('.ds-hero');

  if (heroEl) {
    scrollTrigger = ScrollTrigger.create({
      trigger: heroEl,
      start: 'top top',
      end: 'bottom top',
      onUpdate: (self) => applyProgress(self.progress),
      onRefresh: (self) => applyProgress(self.progress),
    });
  } else {
    // No hero element (unexpected on /cv, but handle gracefully):
    // particles stay assembled, constellation hidden.
    applyProgress(0);
  }

  return {
    root,
    update(dt) { particles.update(dt); },
    dispose() {
      scrollTrigger?.kill();
      particles.dispose();
      constellation.dispose();
    },
  };
}
