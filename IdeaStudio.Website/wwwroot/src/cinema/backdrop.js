// wwwroot/src/cinema/backdrop.js
// A single full-viewport WebGL "aurora" shader. Runs continuously, tinted by
// --ds-scene-accent / --ds-scene-accent-2 (read from the document root).
// Mouse parallax + scroll pulse. Honors prefers-reduced-motion.

import {
  WebGLRenderer, Scene, OrthographicCamera, Clock,
  Mesh, PlaneGeometry, ShaderMaterial, Color, Vector2,
} from 'three';
import { prefersReducedMotion } from './utils/reduced-motion.js';

const vert = /* glsl */`
varying vec2 vUv;
void main() { vUv = uv; gl_Position = vec4(position, 1.0); }
`;

// Aurora: two layers of domain-warped noise. Tint lerps between two accent
// colors. Soft vignette keeps edges dark so it never competes with content.
const frag = /* glsl */`
precision highp float;
varying vec2 vUv;
uniform float uTime;
uniform float uScrollPulse;
uniform vec2  uMouse;
uniform vec2  uResolution;
uniform vec3  uAccentA;
uniform vec3  uAccentB;
uniform vec3  uDeep;

// Hash & value noise.
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  float a = hash(i), b = hash(i + vec2(1., 0.));
  float c = hash(i + vec2(0., 1.)), d = hash(i + vec2(1., 1.));
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}
float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 4; i++) { v += a * noise(p); p *= 2.0; a *= 0.5; }
  return v;
}

void main() {
  vec2 uv = vUv;
  float aspect = uResolution.x / max(uResolution.y, 1.0);
  vec2 p = vec2((uv.x - 0.5) * aspect, uv.y - 0.5);

  // Mouse parallax.
  p += (uMouse - 0.5) * 0.08;

  // Domain warping for the flow.
  float t = uTime * 0.08;
  vec2 q = vec2(fbm(p * 1.3 + vec2(0.0, t)),
                fbm(p * 1.3 + vec2(5.2, -t * 0.7)));
  vec2 r = vec2(fbm(p * 2.0 + q + vec2(1.7, 9.2) + t * 0.5),
                fbm(p * 2.0 + q + vec2(8.3, 2.8) - t * 0.4));
  float n = fbm(p * 1.7 + r);

  // Bands: stretch Y, compress X — gives the aurora a horizontal-flowing feel.
  float band = sin(p.y * 3.0 + n * 2.8 + t * 0.6) * 0.5 + 0.5;
  float flow = smoothstep(0.25, 0.85, mix(n, band, 0.55));

  // Tint.
  vec3 col = mix(uAccentA, uAccentB, flow);

  // Base deep.
  col = mix(uDeep, col, 0.30 + uScrollPulse * 0.25);

  // Vignette — radial falloff so the edges are quiet.
  float vign = smoothstep(1.1, 0.4, length(p));
  col *= (0.6 + 0.4 * vign);

  gl_FragColor = vec4(col, 1.0);
}
`;

let state = null;

export function boot() {
  if (state) return state;
  if (prefersReducedMotion()) return null;

  // Create the canvas as a full-viewport fixed layer behind all content.
  const canvas = document.createElement('canvas');
  canvas.className = 'ds-backdrop-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  document.body.prepend(canvas);

  const renderer = new WebGLRenderer({ canvas, antialias: false, alpha: false, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight, false);

  const scene = new Scene();
  const camera = new OrthographicCamera(-1, 1, 1, -1, 0, 10);
  const clock = new Clock();

  const cs = getComputedStyle(document.documentElement);
  const readColor = (name, fallback) => {
    const raw = cs.getPropertyValue(name).trim();
    return new Color(raw || fallback);
  };

  const uAccentA = { value: readColor('--ds-scene-accent',   '#0ea5e9') };
  const uAccentB = { value: readColor('--ds-scene-accent-2', '#7dd3fc') };
  const uDeep    = { value: readColor('--ds-deep',           '#020617') };

  const mat = new ShaderMaterial({
    vertexShader: vert, fragmentShader: frag,
    uniforms: {
      uTime:        { value: 0 },
      uScrollPulse: { value: 0 },
      uMouse:       { value: new Vector2(0.5, 0.5) },
      uResolution:  { value: new Vector2(window.innerWidth, window.innerHeight) },
      uAccentA, uAccentB, uDeep,
    },
  });
  const mesh = new Mesh(new PlaneGeometry(2, 2), mat);
  mesh.frustumCulled = false;
  scene.add(mesh);

  // Scroll-driven pulse: uScrollPulse eases toward scroll velocity.
  let lastScrollY = window.scrollY || 0;
  let scrollV = 0;
  const onScroll = () => {
    const y = window.scrollY || 0;
    scrollV = Math.min(1, Math.abs(y - lastScrollY) / 24);
    lastScrollY = y;
  };
  window.addEventListener('scroll', onScroll, { passive: true });

  // Mouse tracking (lerped in render loop).
  const targetMouse = new Vector2(0.5, 0.5);
  const onMouse = (e) => {
    targetMouse.set(e.clientX / window.innerWidth, 1 - e.clientY / window.innerHeight);
  };
  window.addEventListener('pointermove', onMouse, { passive: true });

  const onResize = () => {
    renderer.setSize(window.innerWidth, window.innerHeight, false);
    mat.uniforms.uResolution.value.set(window.innerWidth, window.innerHeight);
  };
  window.addEventListener('resize', onResize, { passive: true });

  // Refresh tints when --ds-scene-accent changes (page nav).
  const refreshPalette = () => {
    const cs2 = getComputedStyle(document.documentElement);
    const a1 = cs2.getPropertyValue('--ds-scene-accent').trim()   || '#0ea5e9';
    const a2 = cs2.getPropertyValue('--ds-scene-accent-2').trim() || '#7dd3fc';
    try { uAccentA.value.set(a1); } catch { /* keep previous */ }
    try { uAccentB.value.set(a2); } catch { /* keep previous */ }
  };

  const raf = { id: 0, running: true };
  function render() {
    if (!raf.running) return;
    const dt = clock.getDelta();
    mat.uniforms.uTime.value += dt;
    // Lerp mouse.
    mat.uniforms.uMouse.value.lerp(targetMouse, Math.min(1, dt * 3));
    // Decay scroll pulse.
    scrollV *= Math.pow(0.001, dt); // ~3x decay per 300ms
    mat.uniforms.uScrollPulse.value = scrollV;
    renderer.render(scene, camera);
    raf.id = requestAnimationFrame(render);
  }
  raf.id = requestAnimationFrame(render);

  // Mark html so SCSS can fade the CSS backdrop fallback.
  document.documentElement.classList.add('has-webgl-backdrop');

  // Phase C5.4: flash() spikes scrollV so the aurora gets a "camera flash"
  // beat on page-nav. Uses Math.max so we never cut the value down if a
  // real scroll happens to be louder in that exact frame.
  const flash = () => { scrollV = Math.max(scrollV, 0.8); };

  state = { renderer, mesh, mat, raf, canvas, refreshPalette, flash, cleanup() {
    raf.running = false;
    cancelAnimationFrame(raf.id);
    window.removeEventListener('scroll', onScroll);
    window.removeEventListener('pointermove', onMouse);
    window.removeEventListener('resize', onResize);
    scene.remove(mesh);
    mesh.geometry.dispose();
    mat.dispose();
    renderer.dispose();
    canvas.remove();
    document.documentElement.classList.remove('has-webgl-backdrop');
  }};
  return state;
}

/** Called on page nav so the shader re-reads the new scene accent CSS vars. */
export function refresh() {
  state?.refreshPalette?.();
}

/** One-shot spike on uScrollPulse; decays naturally via the render loop. */
export function flash() {
  state?.flash?.();
}

export function shutdown() {
  state?.cleanup?.();
  state = null;
}
