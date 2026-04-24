// passes/thread.js — scroll-unfurling iridescent thread.
// Reads [data-thread-anchor] positions in the DOM, builds a Catmull-Rom
// spline through their centers, emits a thick triangle-strip polyline,
// clips by arc length driven by scroll progress.

import vertSrc from '../shaders/thread.vert';
import fragSrc from '../shaders/thread.frag';

function hexToRgb(hex) {
  const m = hex.trim().match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
  if (!m) return [0, 1, 1];
  return [parseInt(m[1], 16) / 255, parseInt(m[2], 16) / 255, parseInt(m[3], 16) / 255];
}
function readPalette() {
  const s = getComputedStyle(document.documentElement);
  return {
    duck:  hexToRgb(s.getPropertyValue('--ir-duck')  || '#00c2d4'),
    blue:  hexToRgb(s.getPropertyValue('--ir-blue')  || '#2d44ff'),
    amber: hexToRgb(s.getPropertyValue('--ir-amber') || '#ff8c1a'),
    pink:  hexToRgb(s.getPropertyValue('--ir-pink')  || '#ff3670'),
  };
}

function compile(gl, type, src) {
  const sh = gl.createShader(type);
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    console.error('thread shader error:', gl.getShaderInfoLog(sh));
    return null;
  }
  return sh;
}

// Catmull-Rom interpolation.
function catmull(p0, p1, p2, p3, t) {
  const t2 = t * t;
  const t3 = t2 * t;
  return [
    0.5 * ((2 * p1[0]) + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3),
    0.5 * ((2 * p1[1]) + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3),
  ];
}

// Sample an array of anchor points into `segments` polyline points.
function sampleSpline(anchors, segments) {
  if (anchors.length < 2) return [];
  const pts = [];
  // Duplicate endpoints to keep Catmull-Rom stable at the borders.
  const extended = [anchors[0], ...anchors, anchors[anchors.length - 1]];
  const total = anchors.length - 1;
  for (let i = 0; i < segments; i++) {
    const u = (i / (segments - 1)) * total;
    const seg = Math.min(Math.floor(u), total - 1);
    const localT = u - seg;
    pts.push(catmull(extended[seg], extended[seg + 1], extended[seg + 2], extended[seg + 3], localT));
  }
  return pts;
}

export function createThreadPass(renderer) {
  const gl = renderer.gl;
  if (!gl) return null;

  const vs = compile(gl, gl.VERTEX_SHADER, vertSrc);
  const fs = compile(gl, gl.FRAGMENT_SHADER, fragSrc);
  if (!vs || !fs) return null;
  const prog = gl.createProgram();
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    console.error('thread link error:', gl.getProgramInfoLog(prog));
    return null;
  }
  gl.deleteShader(vs);
  gl.deleteShader(fs);

  const loc = {
    pos:    gl.getAttribLocation(prog, 'a_pos'),
    normal: gl.getAttribLocation(prog, 'a_normal'),
    side:   gl.getAttribLocation(prog, 'a_side'),
    arc:    gl.getAttribLocation(prog, 'a_arc'),
    resolution: gl.getUniformLocation(prog, 'u_resolution'),
    thickness:  gl.getUniformLocation(prog, 'u_thickness'),
    revealed:   gl.getUniformLocation(prog, 'u_revealed'),
    duck:  gl.getUniformLocation(prog, 'u_duck'),
    blue:  gl.getUniformLocation(prog, 'u_blue'),
    amber: gl.getUniformLocation(prog, 'u_amber'),
    pink:  gl.getUniformLocation(prog, 'u_pink'),
  };

  const vbo = gl.createBuffer();
  const mobile = () => window.innerWidth < 640;
  let vertexCount = 0;
  let palette = readPalette();

  // Rebuild the geometry from the current DOM.
  function rebuild() {
    // Thread is a desktop-only ornament — mobile is too narrow to give it
    // visual room without competing with content.
    if (mobile()) { vertexCount = 0; return; }

    const nodes = Array.from(document.querySelectorAll('[data-thread-anchor]'));
    if (nodes.length < 3) { vertexCount = 0; return; }

    // Route the thread along the LEFT margin, not through each anchor's
    // center. Each anchor contributes a y-coordinate; x oscillates in a
    // gentle sway around a fixed column so the spline feels organic
    // instead of degenerating into a straight vertical line.
    const viewportY = window.scrollY;
    const vw = window.innerWidth;
    const column = Math.max(28, Math.min(vw * 0.08, 120));  // ~8% of viewport, clamped
    const swayAmp = Math.min(48, vw * 0.02);
    const anchors = nodes.map((el, i) => {
      const r = el.getBoundingClientRect();
      const sway = Math.sin(i * 1.7) * swayAmp;
      return [column + sway, r.top + r.height * 0.5 + viewportY];
    });

    const segs = 180;
    const spline = sampleSpline(anchors, segs);

    // Emit triangle strip: two verts per sample (side -1 / +1), with normals.
    const data = [];
    for (let i = 0; i < spline.length; i++) {
      const prev = spline[Math.max(0, i - 1)];
      const next = spline[Math.min(spline.length - 1, i + 1)];
      const tx = next[0] - prev[0];
      const ty = next[1] - prev[1];
      const len = Math.max(0.0001, Math.hypot(tx, ty));
      const nx = -ty / len;
      const ny =  tx / len;
      const arc = i / (spline.length - 1);
      data.push(spline[i][0], spline[i][1], nx, ny, -1, arc);
      data.push(spline[i][0], spline[i][1], nx, ny,  1, arc);
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.DYNAMIC_DRAW);
    vertexCount = spline.length * 2;
  }

  const refresh = () => { palette = readPalette(); rebuild(); };
  window.addEventListener('scroll', rebuild, { passive: true });
  window.addEventListener('resize', rebuild, { passive: true });

  // Wait one rAF so layout has measured.
  requestAnimationFrame(rebuild);

  return {
    name: 'thread',
    refresh,
    rebuild,
    render(t, ctx) {
      if (vertexCount === 0) return;
      gl.useProgram(prog);
      gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
      // interleaved: pos(2) normal(2) side(1) arc(1) = 6 floats
      const stride = 6 * 4;
      gl.enableVertexAttribArray(loc.pos);
      gl.vertexAttribPointer(loc.pos, 2, gl.FLOAT, false, stride, 0);
      gl.enableVertexAttribArray(loc.normal);
      gl.vertexAttribPointer(loc.normal, 2, gl.FLOAT, false, stride, 8);
      gl.enableVertexAttribArray(loc.side);
      gl.vertexAttribPointer(loc.side, 1, gl.FLOAT, false, stride, 16);
      gl.enableVertexAttribArray(loc.arc);
      gl.vertexAttribPointer(loc.arc, 1, gl.FLOAT, false, stride, 20);

      // Resolution is the document-space bounds (for the y-flip in shader
      // we pass canvas pixel size, and we've baked scroll into positions).
      gl.uniform2f(loc.resolution, renderer.canvas.width, renderer.canvas.height);
      gl.uniform1f(loc.thickness, (mobile() ? 2.5 : 3.5) * renderer.size.dpr);
      gl.uniform1f(loc.revealed, Math.min(1, ctx.scroll.page * 1.1 + 0.02));
      gl.uniform3fv(loc.duck,  palette.duck);
      gl.uniform3fv(loc.blue,  palette.blue);
      gl.uniform3fv(loc.amber, palette.amber);
      gl.uniform3fv(loc.pink,  palette.pink);

      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, vertexCount);
      gl.disable(gl.BLEND);
    },
    dispose() {
      window.removeEventListener('scroll', rebuild);
      window.removeEventListener('resize', rebuild);
      if (gl) { gl.deleteProgram(prog); gl.deleteBuffer(vbo); }
    },
  };
}
