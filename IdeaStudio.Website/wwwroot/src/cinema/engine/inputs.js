// engine/inputs.js — smoothed pointer (0..1) + scroll progress (0..1 per page).

export class Inputs {
  constructor() {
    this.pointer = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5 };
    this.scroll = { page: 0, last: 0 };
    this._onMove = (e) => {
      this.pointer.tx = e.clientX / window.innerWidth;
      this.pointer.ty = e.clientY / window.innerHeight;
    };
    this._onScroll = () => {
      const h = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      this.scroll.page = Math.min(1, Math.max(0, window.scrollY / h));
    };
    window.addEventListener('pointermove', this._onMove, { passive: true });
    window.addEventListener('scroll', this._onScroll, { passive: true });
    this._onScroll();
  }

  // Called once per frame from the orchestrator.
  step(dt) {
    const a = Math.min(1, dt * 6); // smoothing factor
    this.pointer.x += (this.pointer.tx - this.pointer.x) * a;
    this.pointer.y += (this.pointer.ty - this.pointer.y) * a;
  }

  dispose() {
    window.removeEventListener('pointermove', this._onMove);
    window.removeEventListener('scroll', this._onScroll);
  }
}
