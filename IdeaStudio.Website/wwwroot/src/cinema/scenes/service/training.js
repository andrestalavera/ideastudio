import { Group, Color } from 'three';
import { createParticles, textTargets } from '../../layers/particles.js';

const WORDS = ['LEARN', 'TEACH', 'SHARE'];
const CYCLE_MS = 2400;

export default async function trainingScene(ctx) {
  const { palette, plasma, parameters } = ctx;
  const root = new Group();
  const accent = parameters?.accent ? new Color(parameters.accent) : palette.cyan;

  const isMobile = window.matchMedia('(max-width: 767px)').matches;
  const count = isMobile ? 4000 : 12000;

  const particles = createParticles({ count, palette });
  particles.setColor(accent);
  particles.setSize(1.6);
  root.add(particles.points);

  let wordIndex = 0;
  let t = 0;

  const applyWord = (word) => {
    particles.setTargets(textTargets(count, word, {
      fontSize: isMobile ? 80 : 140,
      font: 'Inter, sans-serif',
    }));
  };

  // Wait for Inter to be available, then start cycling.
  const ready = 'fonts' in document && 'load' in document.fonts
    ? document.fonts.load(`700 ${isMobile ? 80 : 140}px "Inter"`).catch(() => {})
    : Promise.resolve();

  let active = false;
  ready.then(() => {
    applyWord(WORDS[0]);
    active = true;
  });

  plasma.setPalette(palette.bg, palette.deep, accent);
  plasma.setIntensity(0.28);

  return {
    root,
    update(dt) {
      particles.update(dt);
      if (!active) return;
      t += dt * 1000;
      // Progress ramps 0 -> 1 over CYCLE_MS, then resets with a new word.
      let phase = (t % CYCLE_MS) / CYCLE_MS;
      if (t >= CYCLE_MS) {
        t = t - CYCLE_MS;
        wordIndex = (wordIndex + 1) % WORDS.length;
        applyWord(WORDS[wordIndex]);
        phase = 0;
      }
      // Ease-out cubic on the phase.
      const eased = 1 - Math.pow(1 - phase, 3);
      particles.setProgress(eased);
    },
    dispose() { particles.dispose(); },
  };
}
