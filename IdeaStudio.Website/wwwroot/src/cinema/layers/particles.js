import { BufferGeometry, BufferAttribute, Points, ShaderMaterial, AdditiveBlending } from 'three';

/**
 * Creates a particle field with morphable targets.
 * @param {{ count?: number, palette: Record<string, import('three').Color> }} options
 */
export function createParticles({ count = 18000, palette }) {
  const positions = new Float32Array(count * 3);
  const targets = new Float32Array(count * 3);
  scatter(positions, count);
  scatter(targets, count);

  const geom = new BufferGeometry();
  geom.setAttribute('position', new BufferAttribute(positions, 3));
  geom.setAttribute('aTarget', new BufferAttribute(targets, 3));

  const mat = new ShaderMaterial({
    uniforms: {
      uProgress: { value: 0 },
      uSize: { value: 1.5 },
      uTime: { value: 0 },
      uColor: { value: palette.cyan },
    },
    vertexShader: /* glsl */ `
      attribute vec3 aTarget;
      uniform float uProgress;
      uniform float uSize;
      uniform float uTime;
      varying float vAlpha;
      void main() {
        vec3 p = mix(position, aTarget, smoothstep(0.0, 1.0, uProgress));
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_PointSize = uSize * (300.0 / max(0.0001, -mv.z));
        gl_Position = projectionMatrix * mv;
        vAlpha = 0.55 + 0.45 * sin(uTime * 2.0 + p.x * 5.0);
      }
    `,
    fragmentShader: /* glsl */ `
      precision mediump float;
      uniform vec3 uColor;
      varying float vAlpha;
      void main() {
        vec2 uv = gl_PointCoord - 0.5;
        float d = length(uv);
        float a = smoothstep(0.5, 0.0, d) * vAlpha;
        gl_FragColor = vec4(uColor, a);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
  });

  const points = new Points(geom, mat);

  return {
    points,
    /** Replace the aTarget buffer. `arr.length` must equal `count * 3`. */
    setTargets(arr) {
      geom.setAttribute('aTarget', new BufferAttribute(arr, 3));
    },
    /** 0 = scattered, 1 = assembled onto targets. */
    setProgress(v) { mat.uniforms.uProgress.value = v; },
    setColor(c) { mat.uniforms.uColor.value = c; },
    setSize(px) { mat.uniforms.uSize.value = px; },
    /** Call every frame with delta seconds. */
    update(dt) { mat.uniforms.uTime.value += dt; },
    dispose() { geom.dispose(); mat.dispose(); },
  };
}

/**
 * Random scattered positions in a wide box centered at origin.
 * Writes into `arr` in place (expected length = count * 3).
 */
export function scatterTargets(count) {
  const arr = new Float32Array(count * 3);
  scatter(arr, count);
  return arr;
}

function scatter(arr, n) {
  for (let i = 0; i < n; i++) {
    arr[i*3]   = (Math.random() - 0.5) * 3.0;
    arr[i*3+1] = (Math.random() - 0.5) * 1.8;
    arr[i*3+2] = (Math.random() - 0.5) * 2.0;
  }
}

/**
 * Rasterizes `text` to an off-screen canvas, samples filled pixels, and returns
 * a Float32Array of `count * 3` positions distributed across those pixels.
 * Positions are normalized into `bounds` width/height (clip-space-like scale).
 *
 * @param {number} count
 * @param {string} text
 * @param {{ fontSize?: number, fontWeight?: number, font?: string, bounds?: { w: number, h: number } }} [options]
 */
export function textTargets(count, text, options = {}) {
  const fontSize = options.fontSize ?? 140;
  const fontWeight = options.fontWeight ?? 700;
  const font = options.font ?? 'Inter, sans-serif';
  const bounds = options.bounds ?? { w: 2.4, h: 0.9 };

  const cv = document.createElement('canvas');
  cv.width = 1024;
  cv.height = 320;
  const ctx = cv.getContext('2d');
  ctx.fillStyle = '#fff';
  ctx.font = `${fontWeight} ${fontSize}px ${font}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, cv.width / 2, cv.height / 2);

  const data = ctx.getImageData(0, 0, cv.width, cv.height).data;
  const pts = [];
  for (let y = 0; y < cv.height; y += 3) {
    for (let x = 0; x < cv.width; x += 3) {
      const i = (y * cv.width + x) * 4;
      if (data[i + 3] > 128) pts.push([x, y]);
    }
  }

  const out = new Float32Array(count * 3);
  if (pts.length === 0) {
    // Degenerate: text not visible (canvas 2D unavailable?). Fall back to scatter.
    scatter(out, count);
    return out;
  }

  for (let i = 0; i < count; i++) {
    const [x, y] = pts[i % pts.length];
    out[i*3]   = ((x / cv.width) - 0.5) * bounds.w;
    out[i*3+1] = (0.5 - (y / cv.height)) * bounds.h;
    out[i*3+2] = (Math.random() - 0.5) * 0.1;
  }
  return out;
}

/**
 * Positions distributed on a ring in the XY plane.
 * @param {number} count
 * @param {number} radius
 */
export function ringTargets(count, radius = 1.0) {
  const out = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const theta = (i / count) * Math.PI * 2 + Math.random() * 0.03;
    const r = radius + (Math.random() - 0.5) * 0.05;
    out[i*3]   = Math.cos(theta) * r;
    out[i*3+1] = Math.sin(theta) * r;
    out[i*3+2] = (Math.random() - 0.5) * 0.1;
  }
  return out;
}
