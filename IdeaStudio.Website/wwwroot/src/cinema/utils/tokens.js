import { Color } from 'three';

// Maps JS palette keys to CSS custom property names defined in wwwroot/scss/base/_root.scss.
// See the design system tokens — custom props are --ds-*-prefixed.
const TOKEN_MAP = {
  bg:    '--ds-bg',
  deep:  '--ds-deep',
  azure: '--ds-azure',
  sky:   '--ds-sky',
  cyan:  '--ds-cyan',
  teal:  '--ds-teal',
  mint:  '--ds-mint',
  fg:    '--ds-fg',
};

export function readPalette() {
  const cs = getComputedStyle(document.documentElement);
  const palette = {};
  for (const [key, prop] of Object.entries(TOKEN_MAP)) {
    const raw = cs.getPropertyValue(prop).trim();
    palette[key] = new Color(raw || '#000');
  }
  return palette;
}
