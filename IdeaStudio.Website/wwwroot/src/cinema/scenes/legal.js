import { Group } from 'three';

/**
 * Minimal ambient scene for Legal/Privacy pages — no particles, no
 * constellation. Tunes the plasma down so the backdrop stays quiet behind
 * text-heavy content.
 *
 * @param {{ palette: Record<string, import('three').Color>, plasma: any }} ctx
 */
export default async function legalScene(ctx) {
  const { palette, plasma } = ctx;
  const root = new Group();

  // Dim plasma, shift palette toward deep ink (less chromatic pop).
  plasma.setPalette(palette.bg, palette.deep, palette.deep);
  plasma.setIntensity(0.2);

  return {
    root,
    update(_dt) {},
    dispose() {},
  };
}
