import { Color } from 'three';

const TOKEN_NAMES = ['ink-0', 'deep', 'azure', 'sky', 'cyan', 'teal', 'mint', 'paper'];

export function readPalette() {
  const cs = getComputedStyle(document.documentElement);
  const palette = {};
  for (const name of TOKEN_NAMES) {
    const raw = cs.getPropertyValue(`--${name}`).trim();
    palette[name] = new Color(raw || '#000');
  }
  return palette;
}
