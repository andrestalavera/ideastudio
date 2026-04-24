// Raw WebGL2 full-viewport shader. Replaces the previous background video
// which didn't autoplay in iOS Safari low-power mode. No library — a single
// fragment shader + fullscreen quad. Editorial amber-on-black palette.

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

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  float a = hash(i), b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0)), d = hash(i + vec2(1.0, 1.0));
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}
float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 4; i++) { v += a * noise(p); p *= 2.0; a *= 0.5; }
  return v;
}

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution;
  float aspect = uResolution.x / max(uResolution.y, 1.0);
  vec2 p = vec2((uv.x - 0.5) * aspect, uv.y - 0.5);

  // Slow time — deliberately sub-tick for a print-like serenity.
  float t = uTime * 0.04;

  // Two-step domain warp — gives the flow its organic, non-repeating feel.
  vec2 q = vec2(fbm(p * 1.2 + vec2(0.0, t)),
                fbm(p * 1.2 + vec2(5.2, -t)));
  vec2 r = vec2(fbm(p * 1.8 + q + vec2(1.7, 9.2) + t * 0.5),
                fbm(p * 1.8 + q + vec2(8.3, 2.8) - t * 0.4));
  float n = fbm(p * 1.5 + r);

  // Soft horizontal bands for a flowing aurora-like quality.
  float band = sin(p.y * 2.0 + n * 2.5 + t * 0.7) * 0.5 + 0.5;
  float flow = smoothstep(0.30, 0.85, mix(n, band, 0.5));

  // Tint: amber accent on deep black, very muted — the content is the star.
  vec3 highlight = uAccent * 1.2;
  vec3 col = mix(uAccent, highlight, flow);
  col = mix(uBg, col, 0.12);

  // Vignette — quiet edges.
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
  gl.uniform3fv(uBg, hexToRgb(cs.getPropertyValue('--ds-bg').trim() || '#0a0a0b'));

  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.round(canvas.clientWidth * dpr);
    const h = Math.round(canvas.clientHeight * dpr);
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
      gl.viewport(0, 0, w, h);
      gl.uniform2f(uRes, w, h);
    }
  };
  resize();
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

  // Pause rendering when the tab is hidden — saves real battery on laptops
  // without the codec-based restrictions that broke the old <video>.
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

  // Context-loss handling: re-boot on restore.
  canvas.addEventListener('webglcontextlost', (e) => {
    e.preventDefault();
    running = false;
    cancelAnimationFrame(raf);
  });
  canvas.addEventListener('webglcontextrestored', () => {
    // Simplest recovery: reload the page section by re-calling boot().
    // Callers hold the shutdown handle; they can decide.
  });

  return {
    shutdown() {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', onVis);
      gl.deleteBuffer(buf);
      gl.deleteVertexArray(vao);
      gl.deleteProgram(prog);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
    },
  };
}
