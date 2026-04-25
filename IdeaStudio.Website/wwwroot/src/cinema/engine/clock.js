// engine/clock.js — single rAF loop with frame-budget guard.
// Pause rules (hooked in index.js):
//   - document.hidden
//   - canvas not in viewport (IntersectionObserver)
//   - prefers-reduced-motion
//   - battery ≤ 20% && not charging
//   - pointer: coarse and no touch for 30s

export class Clock {
  constructor(onTick) {
    this.onTick = onTick;
    this.running = false;
    this.handle = 0;
    this.last = 0;
    this._loop = (t) => {
      this.handle = requestAnimationFrame(this._loop);
      const dt = this.last ? t - this.last : 16;
      // Skip frame if the previous one was too expensive.
      if (dt > 45 && this.last) { this.last = t; return; }
      this.last = t;
      this.onTick(t / 1000, dt / 1000);
    };
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.last = 0;
    this.handle = requestAnimationFrame(this._loop);
  }

  stop() {
    if (!this.running) return;
    cancelAnimationFrame(this.handle);
    this.running = false;
    this.handle = 0;
  }
}
