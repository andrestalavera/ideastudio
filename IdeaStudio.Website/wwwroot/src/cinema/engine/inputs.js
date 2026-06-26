// engine/inputs.js — smoothed pointer (0..1) + scroll progress (0..1 per page).
// Scroll events only stash the latest scrollY (no layout read); the page
// fraction is computed once per frame in step(), and the scrollable height is
// cached and only re-measured on resize — so scrolling never forces a reflow.

export class Inputs {
  constructor() {
    this.pointer = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5 };
    this.scroll = { page: 0, last: 0 };
    this._scrollY = 0;
    this._maxScroll = 1;
    this._dirty = true;

    this._onMove = (e) => {
      this.pointer.tx = e.clientX / window.innerWidth;
      this.pointer.ty = e.clientY / window.innerHeight;
    };
    this._onScroll = () => {
      this._scrollY = window.scrollY;
      this._dirty = true;
    };
    this._onResize = () => {
      this._measure();
      this._dirty = true;
    };

    this._measure();
    this._scrollY = window.scrollY;
    window.addEventListener('pointermove', this._onMove, { passive: true });
    window.addEventListener('scroll', this._onScroll, { passive: true });
    window.addEventListener('resize', this._onResize, { passive: true });
  }

  _measure() {
    this._maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
  }

  // Called once per frame from the orchestrator.
  step(dt) {
    const a = Math.min(1, dt * 6); // smoothing factor
    this.pointer.x += (this.pointer.tx - this.pointer.x) * a;
    this.pointer.y += (this.pointer.ty - this.pointer.y) * a;
    if (this._dirty) {
      this.scroll.page = Math.min(1, Math.max(0, this._scrollY / this._maxScroll));
      this._dirty = false;
    }
  }

  dispose() {
    window.removeEventListener('pointermove', this._onMove);
    window.removeEventListener('scroll', this._onScroll);
    window.removeEventListener('resize', this._onResize);
  }
}
