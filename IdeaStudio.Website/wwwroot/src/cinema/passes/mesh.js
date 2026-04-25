// passes/mesh.js — iridescent mesh backdrop. Reads palette from CSS custom
// properties so SCSS tokens and WebGL stay in sync.

import vertSrc from '../shaders/mesh.vert';
import fragSrc from '../shaders/mesh.frag';

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
    bg:    hexToRgb(s.getPropertyValue('--bg-deep')  || '#05161a'),
  };
}

function compile(gl, type, src) {
  const sh = gl.createShader(type);
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    console.error('mesh shader compile error:', gl.getShaderInfoLog(sh));
    gl.deleteShader(sh);
    return null;
  }
  return sh;
}

export function createMeshPass(renderer) {
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
    console.error('mesh link error:', gl.getProgramInfoLog(prog));
    return null;
  }
  gl.deleteShader(vs);
  gl.deleteShader(fs);

  const loc = {
    pos:        gl.getAttribLocation(prog, 'a_pos'),
    resolution: gl.getUniformLocation(prog, 'u_resolution'),
    time:       gl.getUniformLocation(prog, 'u_time'),
    pointer:    gl.getUniformLocation(prog, 'u_pointer'),
    scroll:     gl.getUniformLocation(prog, 'u_scroll'),
    duck:       gl.getUniformLocation(prog, 'u_duck'),
    blue:       gl.getUniformLocation(prog, 'u_blue'),
    amber:      gl.getUniformLocation(prog, 'u_amber'),
    pink:       gl.getUniformLocation(prog, 'u_pink'),
    bg:         gl.getUniformLocation(prog, 'u_bg'),
  };

  let pal = readPalette();
  const refreshPalette = () => { pal = readPalette(); };

  return {
    name: 'mesh',
    refreshPalette,
    render(t, ctx) {
      const { size } = renderer;
      gl.useProgram(prog);
      gl.bindBuffer(gl.ARRAY_BUFFER, renderer.quad);
      gl.enableVertexAttribArray(loc.pos);
      gl.vertexAttribPointer(loc.pos, 2, gl.FLOAT, false, 0, 0);

      gl.uniform2f(loc.resolution, renderer.canvas.width, renderer.canvas.height);
      gl.uniform1f(loc.time, t);
      gl.uniform2f(loc.pointer, ctx.pointer.x, ctx.pointer.y);
      gl.uniform1f(loc.scroll, ctx.scroll.page);
      gl.uniform3fv(loc.duck,  pal.duck);
      gl.uniform3fv(loc.blue,  pal.blue);
      gl.uniform3fv(loc.amber, pal.amber);
      gl.uniform3fv(loc.pink,  pal.pink);
      gl.uniform3fv(loc.bg,    pal.bg);

      gl.disable(gl.BLEND);
      gl.viewport(0, 0, renderer.canvas.width, renderer.canvas.height);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    },
    dispose() {
      if (gl) gl.deleteProgram(prog);
    },
  };
}
