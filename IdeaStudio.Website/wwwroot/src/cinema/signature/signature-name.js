// signature-name.js — renders a name in WebGL as a living glyph object.
// Never flat text: the name emerges from a turbulent mesh, breathes in
// place, reacts to cursor proximity, and dissolves on scroll.
//
// Technique: generate a soft mask from the font via Canvas2D + blur,
// upload as an R8 texture, sample in a fragment shader with warp / noise
// / cursor attraction / scroll scatter.
//
// No framework, no library. One canvas + one fragment shader.

const VERT = `#version 300 es
in vec2 aPos;
out vec2 vUv;
void main() {
  vUv = (aPos + 1.0) * 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}`;

const FRAG = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 outColor;

uniform sampler2D uField;   // blurred text mask, 0..1
uniform float     uTime;
uniform float     uEmerge;  // 0 (invisible) → 1 (fully formed)
uniform float     uDissolve;// 0 (intact) → 1 (scattered)
uniform vec2      uCursor;  // normalized -1..1 in canvas space, -10,-10 if absent
uniform vec2      uResolution;
uniform vec3      uFg;
uniform vec3      uAccent;

// Small hash for per-pixel jitter.
float hash21(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
vec2  hash22(vec2 p) { return fract(sin(vec2(dot(p, vec2(127.1, 311.7)),
                                              dot(p, vec2(269.5, 183.3)))) * 43758.5453); }

// 2D value noise.
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  float a = hash21(i), b = hash21(i + vec2(1.0, 0.0));
  float c = hash21(i + vec2(0.0, 1.0)), d = hash21(i + vec2(1.0, 1.0));
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

void main() {
  vec2 uv = vUv;
  // Canvas-space position in -1..1 (to compare with uCursor in -1..1).
  vec2 p = uv * 2.0 - 1.0;

  // --- Idle breathing: slow domain warp on the sample position. ---
  float t = uTime;
  vec2 breathe = vec2(
    noise(uv * 3.5 + vec2(0.0, t * 0.18)),
    noise(uv * 3.5 + vec2(5.2, -t * 0.14))
  ) - 0.5;
  vec2 sampleUV = uv + breathe * 0.008;

  // --- Cursor attraction: nearby pixels pull toward the cursor. ---
  vec2 toCursor = p - uCursor;
  float d = length(toCursor);
  float pull = smoothstep(0.60, 0.0, d);
  sampleUV += -normalize(toCursor + 1e-5) * pull * 0.035;

  // --- Scatter for dissolution. Per-pixel random offset scaled by scroll. ---
  vec2 scatter = (hash22(floor(uv * 520.0) + floor(t * 8.0)) - 0.5)
                 * uDissolve * 0.06;
  sampleUV += scatter;

  // --- Sample the text field. ---
  float field = texture(uField, sampleUV).r;

  // --- Emergence: the "inside" threshold marches from 1.0 (nothing) to 0.40 (solid).
  // Plus a turbulent mask so the letters don't snap in — they crystallize.
  float emerge = clamp(uEmerge, 0.0, 1.0);
  float turbulence = noise(uv * 4.2 + vec2(t * 0.3, -t * 0.2));
  float noiseGate = mix(1.0, turbulence, 1.0 - emerge);
  float thresh = mix(1.0, 0.40, emerge);

  // Letter body (crisp edge via smoothstep around threshold).
  float inside = smoothstep(thresh + 0.02, thresh - 0.02, field * noiseGate);

  // Glow just outside the letter edge — a warm amber halo.
  float glow = smoothstep(thresh + 0.18, thresh + 0.02, field * noiseGate) - inside;

  // Compose.
  vec3 col = uFg;
  col += uAccent * glow * 0.55;
  float alpha = inside + glow * 0.35;

  // Dissolve: fade the whole thing as scroll pulls us out of the hero.
  alpha *= 1.0 - smoothstep(0.1, 0.9, uDissolve);

  outColor = vec4(col, alpha);
}`;

const TEXT_PAD_Y_RATIO = 0.22; // vertical padding around glyphs (% of font size)

function hexToRgb(hex) {
  const m = (hex || '').trim().match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
  if (!m) return [1, 1, 1];
  return [parseInt(m[1], 16) / 255, parseInt(m[2], 16) / 255, parseInt(m[3], 16) / 255];
}

/**
 * Generates a soft-edge text mask via Canvas2D + blur, returns an ImageData
 * whose red channel encodes the mask (0..255). The output size is picked to
 * give the chosen font plenty of detail + room for the blur halo.
 */
async function buildField(text, { fontSize, fontFamily, fontWeight, fontStyle, blurPx }) {
  // Wait for the web font to load so we don't rasterize with a fallback.
  if ('fonts' in document && document.fonts.load) {
    try {
      await document.fonts.load(`${fontStyle} ${fontWeight} ${fontSize}px "${fontFamily}"`);
    } catch { /* ignore — fallback will render */ }
  }

  // Measure the text at the target size.
  const probe = document.createElement('canvas');
  probe.width = 4; probe.height = 4;
  const pctx = probe.getContext('2d');
  pctx.font = `${fontStyle} ${fontWeight} ${fontSize}px "${fontFamily}", serif`;
  const metrics = pctx.measureText(text);
  const textW = Math.ceil(metrics.width);

  const padX = Math.ceil(blurPx * 1.8);
  const padY = Math.ceil(fontSize * TEXT_PAD_Y_RATIO + blurPx * 1.4);
  const w = textW + padX * 2;
  const h = Math.ceil(fontSize * 1.25) + padY * 2;

  // Draw the text in white on a black background.
  const cv = document.createElement('canvas');
  cv.width = w;
  cv.height = h;
  const ctx = cv.getContext('2d');
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#fff';
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'center';
  ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px "${fontFamily}", serif`;
  ctx.fillText(text, w / 2, h / 2);

  // Re-draw through a blur filter to create a soft mask (approximation of an SDF).
  const blurred = document.createElement('canvas');
  blurred.width = w; blurred.height = h;
  const bctx = blurred.getContext('2d');
  bctx.fillStyle = '#000';
  bctx.fillRect(0, 0, w, h);
  bctx.filter = `blur(${blurPx}px)`;
  bctx.drawImage(cv, 0, 0);
  bctx.filter = 'none';

  // Also overlay the crisp original for a cleaner inside-threshold.
  bctx.globalCompositeOperation = 'lighten';
  bctx.drawImage(cv, 0, 0);
  bctx.globalCompositeOperation = 'source-over';

  return bctx.getImageData(0, 0, w, h);
}

function compile(gl, type, src) {
  const s = gl.createShader(type);
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    console.error('[signature] shader:', gl.getShaderInfoLog(s));
    return null;
  }
  return s;
}

/**
 * @param {HTMLCanvasElement} canvas
 * @param {{
 *   text: string,
 *   fontFamily?: string,
 *   fontWeight?: string|number,
 *   fontStyle?: string,
 *   fontSizePx?: number,
 *   blurPx?: number,
 *   fgHex?: string,
 *   accentHex?: string,
 *   emergeMs?: number,
 * }} options
 */
export async function mountSignature(canvas, options) {
  const text = options.text;
  const fontFamily = options.fontFamily ?? 'Instrument Serif';
  const fontWeight = options.fontWeight ?? 400;
  const fontStyle  = options.fontStyle  ?? 'italic';
  const fontSizePx = options.fontSizePx ?? 520;
  const blurPx     = options.blurPx     ?? 36;
  const emergeMs   = options.emergeMs   ?? 2500;

  const field = await buildField(text, { fontSize: fontSizePx, fontFamily, fontWeight, fontStyle, blurPx });

  const gl = canvas.getContext('webgl2', { antialias: true, alpha: true, premultipliedAlpha: false });
  if (!gl) {
    console.warn('[signature] WebGL2 unavailable — fallback <h1> will show.');
    canvas.style.display = 'none';
    canvas.parentElement?.classList.add('ds-signature--fallback');
    return { dispose() {} };
  }

  const vs = compile(gl, gl.VERTEX_SHADER, VERT);
  const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
  if (!vs || !fs) {
    canvas.style.display = 'none';
    canvas.parentElement?.classList.add('ds-signature--fallback');
    return { dispose() {} };
  }

  const prog = gl.createProgram();
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    console.error('[signature] link:', gl.getProgramInfoLog(prog));
    return { dispose() {} };
  }
  gl.useProgram(prog);

  // Fullscreen quad.
  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
  const aPos = gl.getAttribLocation(prog, 'aPos');
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

  // Upload the field as an R8 texture.
  const tex = gl.createTexture();
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, tex);
  // Extract the red channel into a Uint8Array for R8 upload.
  const r = new Uint8Array(field.width * field.height);
  for (let i = 0; i < r.length; i++) r[i] = field.data[i * 4];
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.R8, field.width, field.height, 0, gl.RED, gl.UNSIGNED_BYTE, r);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  const uField     = gl.getUniformLocation(prog, 'uField');
  const uTime      = gl.getUniformLocation(prog, 'uTime');
  const uEmerge    = gl.getUniformLocation(prog, 'uEmerge');
  const uDissolve  = gl.getUniformLocation(prog, 'uDissolve');
  const uCursor    = gl.getUniformLocation(prog, 'uCursor');
  const uResolution = gl.getUniformLocation(prog, 'uResolution');
  const uFg        = gl.getUniformLocation(prog, 'uFg');
  const uAccent    = gl.getUniformLocation(prog, 'uAccent');

  gl.uniform1i(uField, 0);

  // Read colors from CSS at boot (re-read on refresh()).
  let palette = readPalette();
  function readPalette() {
    const cs = getComputedStyle(document.documentElement);
    return {
      fg:     hexToRgb(cs.getPropertyValue('--fg')    || cs.getPropertyValue('--ds-fg')    || '#f3efe7'),
      accent: hexToRgb(cs.getPropertyValue('--ir-amber') || cs.getPropertyValue('--ds-accent') || '#ff8c1a'),
    };
  }

  // Keep canvas DPR-aware + matching its displayed aspect to the field's.
  const fieldAspect = field.width / field.height;
  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cssW = canvas.clientWidth;
    const cssH = canvas.clientHeight;
    const w = Math.max(1, Math.round(cssW * dpr));
    const h = Math.max(1, Math.round(cssH * dpr));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    gl.viewport(0, 0, w, h);
  }
  resize();
  // The canvas's CSS height is driven by its aspect-ratio (set in SCSS) to
  // match the field, so we don't need to override it here.
  const onResize = () => resize();
  window.addEventListener('resize', onResize, { passive: true });

  // Cursor tracking — normalized to canvas rect, -1..1 range, lerped.
  let cursorTargetX = -10, cursorTargetY = -10;
  let cursorX = -10, cursorY = -10;
  const onPointerMove = (e) => {
    const r = canvas.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * 2 - 1;
    const y = 1 - ((e.clientY - r.top) / r.height) * 2;
    // Only "feel" the cursor when it's inside or near the canvas.
    if (e.clientX >= r.left - 60 && e.clientX <= r.right + 60
        && e.clientY >= r.top - 60 && e.clientY <= r.bottom + 60) {
      cursorTargetX = x; cursorTargetY = y;
    } else {
      cursorTargetX = -10; cursorTargetY = -10;
    }
  };
  const onPointerLeave = () => { cursorTargetX = -10; cursorTargetY = -10; };
  window.addEventListener('pointermove', onPointerMove, { passive: true });
  window.addEventListener('pointerleave', onPointerLeave);

  // Scroll progress → dissolve. Fully dissolved once hero is 80% out of view.
  let dissolve = 0;
  const onScroll = () => {
    const r = canvas.getBoundingClientRect();
    const viewportH = window.innerHeight || 800;
    // 0 when the canvas is fully on-screen; 1 when it's 80% past the viewport top.
    const p = -r.top / (viewportH * 0.8);
    dissolve = Math.max(0, Math.min(1, p));
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Emergence tween (ease-out cubic).
  const mountedAt = performance.now();
  const emergeDur = Math.max(1, emergeMs);

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let raf = 0;
  let running = true;

  gl.clearColor(0, 0, 0, 0);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

  function draw(now) {
    if (!running) return;
    const t = (now - mountedAt) * 0.001;
    const raw = (now - mountedAt) / emergeDur;
    const emerge = reducedMotion ? 1 : (raw >= 1 ? 1 : (1 - Math.pow(1 - Math.min(1, raw), 3)));

    // Lerp cursor.
    cursorX += (cursorTargetX - cursorX) * 0.18;
    cursorY += (cursorTargetY - cursorY) * 0.18;

    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform1f(uTime, t);
    gl.uniform1f(uEmerge, emerge);
    gl.uniform1f(uDissolve, dissolve);
    gl.uniform2f(uCursor, cursorX, cursorY);
    gl.uniform2f(uResolution, canvas.width, canvas.height);
    gl.uniform3fv(uFg, palette.fg);
    gl.uniform3fv(uAccent, palette.accent);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    raf = requestAnimationFrame(draw);
  }
  raf = requestAnimationFrame(draw);

  const onVis = () => {
    if (document.hidden) { running = false; cancelAnimationFrame(raf); }
    else if (!running) { running = true; raf = requestAnimationFrame(draw); }
  };
  document.addEventListener('visibilitychange', onVis);

  return {
    fieldAspect,                     // aspect ratio of the rendered text — use to size the canvas CSS-side
    refresh() { palette = readPalette(); },
    dispose() {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerleave', onPointerLeave);
      window.removeEventListener('scroll', onScroll);
      document.removeEventListener('visibilitychange', onVis);
      gl.deleteTexture(tex);
      gl.deleteBuffer(buf);
      gl.deleteVertexArray(vao);
      gl.deleteProgram(prog);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
    },
  };
}
