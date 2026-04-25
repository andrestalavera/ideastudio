// engine/renderer.js — single WebGL2 context + shared full-screen quad +
// half-resolution ping-pong render target. Passes render into the RT and we
// upscale in a final blit. One resize listener at this level; passes read
// renderer.size on each frame.

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.gl = canvas.getContext('webgl2', {
      alpha: true,
      antialias: false,
      premultipliedAlpha: false,
      powerPreference: 'low-power',
    });

    if (!this.gl) {
      this.unsupported = true;
      return;
    }

    this.size = { w: 0, h: 0, dpr: 1, scale: 0.5 };
    this.quad = this._buildQuad();
    this._onResize = () => this.resize();
    window.addEventListener('resize', this._onResize, { passive: true });
    this.resize();
  }

  resize() {
    if (!this.gl) return;
    const w = window.innerWidth;
    const h = window.innerHeight;
    const mobile = w < 640;
    const dprCap = mobile ? 1.25 : 1.75;
    const dpr = Math.min(window.devicePixelRatio || 1, dprCap);
    const scale = mobile ? 0.35 : 0.5;

    this.canvas.width  = Math.floor(w * dpr);
    this.canvas.height = Math.floor(h * dpr);
    this.canvas.style.width  = w + 'px';
    this.canvas.style.height = h + 'px';

    this.size = { w, h, dpr, scale };
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
  }

  _buildQuad() {
    const gl = this.gl;
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      -1, -1,  1, -1,  -1, 1,
      -1,  1,  1, -1,   1, 1,
    ]), gl.STATIC_DRAW);
    return buf;
  }

  dispose() {
    window.removeEventListener('resize', this._onResize);
    if (this.gl && this.quad) this.gl.deleteBuffer(this.quad);
    this.gl = null;
  }
}
