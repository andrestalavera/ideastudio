// Cosmic WebGL2 backdrop: star field (3 depth layers with twinkle) + domain-
// warped fBm nebula (amber + deep violet) + slow radial rotation + periodic
// shooting stars. No library — single fullscreen-quad fragment shader.
// Replaces the previous <video> (iOS Safari low-power mode couldn't autoplay).

const VERT = `#version 300 es
in vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }`;

const FRAG = `#version 300 es
precision highp float;
out vec4 outColor;
uniform float uTime;
uniform vec2 uResolution;
uniform vec3 uAccent;
uniform vec3 uBg;

float hash11(float x) { return fract(sin(x * 127.1) * 43758.5453); }
float hash21(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
vec2 hash22(vec2 p) {
  return fract(sin(vec2(dot(p, vec2(127.1, 311.7)),
                        dot(p, vec2(269.5, 183.3)))) * 43758.5453);
}
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  float a = hash21(i), b = hash21(i + vec2(1.0, 0.0));
  float c = hash21(i + vec2(0.0, 1.0)), d = hash21(i + vec2(1.0, 1.0));
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}
float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 5; i++) { v += a * noise(p); p *= 2.0; a *= 0.5; }
  return v;
}

// Hash-positioned star inside each grid cell, with twinkle.
float stars(vec2 uv, float density, float twinkleSpeed) {
  vec2 cell = floor(uv);
  vec2 f = fract(uv);
  vec2 r = hash22(cell);
  if (r.x > density) return 0.0;
  vec2 p = f - r;
  float d = length(p);
  float size = 0.02 + r.y * 0.03;
  float tw = 0.5 + 0.5 * sin(uTime * twinkleSpeed + r.x * 6.28318);
  return smoothstep(size, 0.0, d) * tw;
}

// One shooting star every ~12 s, random direction from top.
float shootingStar(vec2 p) {
  float t = mod(uTime, 12.0);
  if (t > 1.5) return 0.0;
  float seed = floor(uTime / 12.0);
  vec2 start = hash22(vec2(seed, 0.0)) * vec2(1.8, 1.0) - vec2(0.9, 0.0);
  vec2 dir = normalize(vec2(-1.0, -0.4 + hash11(seed + 1.0) * 0.3));
  float progress = t / 1.5;
  vec2 head = start + dir * progress * 1.5;
  vec2 d = p - head;
  float along = dot(d, -dir);
  float perp  = length(d + dir * along);
  float streak = smoothstep(0.003, 0.0, perp) * smoothstep(0.25, 0.0, along) * step(0.0, along);
  float glow   = smoothstep(0.05, 0.0, length(d));
  return (streak * 0.95 + glow * 0.45) * (1.0 - progress);
}

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution;
  float aspect = uResolution.x / max(uResolution.y, 1.0);
  vec2 p = vec2((uv.x - 0.5) * aspect, uv.y - 0.5);

  // Slow radial swirl — the universe drifts.
  float ang = length(p) * 0.25 + uTime * 0.008;
  mat2 rot = mat2(cos(ang), -sin(ang), sin(ang), cos(ang));
  vec2 sp = rot * p;

  // Two-step domain warp for the nebula.
  float t = uTime * 0.02;
  vec2 q = vec2(fbm(sp * 1.2 + vec2(0.0, t)),
                fbm(sp * 1.2 + vec2(5.2, -t)));
  vec2 r = vec2(fbm(sp * 2.0 + q + t * 0.4),
                fbm(sp * 2.0 + q + vec2(3.1, 1.7) - t * 0.3));
  float neb = fbm(sp * 1.6 + r);
  float nebMask = smoothstep(0.38, 0.78, neb);

  // Nebula color: deep violet-blue with amber warm pockets.
  vec3 violet = vec3(0.10, 0.05, 0.22);
  vec3 nebCol = mix(violet, uAccent * 0.85, nebMask);
  vec3 col = mix(uBg, nebCol, nebMask * 0.55);

  // Star field — three depth layers.
  vec2 uvStar = uv * vec2(aspect, 1.0);
  float sFar  = stars(uvStar * 180.0, 0.05, 2.0) * 0.55;
  float sMid  = stars(uvStar * 90.0,  0.08, 3.5) * 0.90;
  float sNear = stars(uvStar * 45.0,  0.03, 1.2) * 1.30;
  col += vec3(1.0, 0.95, 0.85) * (sFar + sMid + sNear);

  // Shooting star.
  col += vec3(1.0, 0.9, 0.75) * shootingStar(p);

  // Radial vignette keeps edges quiet.
  float vign = smoothstep(1.15, 0.35, length(p));
  col *= (0.55 + 0.45 * vign);

  outColor = vec4(col, 1.0);
}`;

function hexToRgb(hex) {
  hex = (hex || '').replace('#', '').trim();
  if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
  const n = parseInt(hex, 16);
  if (Number.isNaN(n)) return [0, 0, 0];
  return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255];
}

export function boot() {
  const canvas = document.getElementById('backdrop-canvas');
  if (!canvas) return null;

  const gl = canvas.getContext('webgl2', {
    antialias: false,
    alpha: false,
    powerPreference: 'high-performance',
  });
  if (!gl) {
    console.warn('[backdrop] WebGL2 unavailable');
    document.documentElement.classList.add('no-webgl');
    return null;
  }

  const compile = (type, src) => {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      console.error('[backdrop]', gl.getShaderInfoLog(s));
      return null;
    }
    return s;
  };

  const vs = compile(gl.VERTEX_SHADER, VERT);
  const fs = compile(gl.FRAGMENT_SHADER, FRAG);
  if (!vs || !fs) {
    document.documentElement.classList.add('no-webgl');
    return null;
  }

  const prog = gl.createProgram();
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    console.error('[backdrop]', gl.getProgramInfoLog(prog));
    document.documentElement.classList.add('no-webgl');
    return null;
  }
  gl.useProgram(prog);

  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const aPos = gl.getAttribLocation(prog, 'aPos');
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

  const uTime = gl.getUniformLocation(prog, 'uTime');
  const uRes = gl.getUniformLocation(prog, 'uResolution');
  const uAcc = gl.getUniformLocation(prog, 'uAccent');
  const uBg = gl.getUniformLocation(prog, 'uBg');

  const cs = getComputedStyle(document.documentElement);
  gl.uniform3fv(uAcc, hexToRgb(cs.getPropertyValue('--ds-accent').trim() || '#f3c577'));
  gl.uniform3fv(uBg, hexToRgb(cs.getPropertyValue('--ds-bg').trim() || '#05050a'));

  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.max(1, Math.round(canvas.clientWidth * dpr));
    const h = Math.max(1, Math.round(canvas.clientHeight * dpr));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
      gl.viewport(0, 0, w, h);
      gl.uniform2f(uRes, w, h);
    }
  };
  resize();
  // If the canvas was 0×0 at boot (no layout yet), retry on next frame.
  if (canvas.clientWidth === 0 || canvas.clientHeight === 0) {
    requestAnimationFrame(resize);
  }
  window.addEventListener('resize', resize, { passive: true });

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const start = performance.now();
  let raf = 0;
  let running = true;

  const draw = () => {
    if (!running) return;
    gl.uniform1f(uTime, (performance.now() - start) * 0.001);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    if (!reducedMotion) raf = requestAnimationFrame(draw);
  };
  draw();

  const onVis = () => {
    if (document.hidden) {
      running = false;
      cancelAnimationFrame(raf);
    } else if (!running && !reducedMotion) {
      running = true;
      raf = requestAnimationFrame(draw);
    }
  };
  document.addEventListener('visibilitychange', onVis);

  const onContextLost = (e) => {
    e.preventDefault();
    running = false;
    cancelAnimationFrame(raf);
  };
  canvas.addEventListener('webglcontextlost', onContextLost);

  return {
    shutdown() {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', onVis);
      canvas.removeEventListener('webglcontextlost', onContextLost);
      gl.deleteBuffer(buf);
      gl.deleteVertexArray(vao);
      gl.deleteProgram(prog);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
    },
  };
}
