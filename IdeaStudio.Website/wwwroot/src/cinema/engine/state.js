// engine/state.js — hero state machine. Single source of truth for
// mesh opacity, thread reveal, letters opacity, and masthead pill visibility.

export class HeroState {
  constructor() {
    this.state = 'hero'; // 'hero' | 'morphing' | 'pill'
    this.progress = 0;   // 0..1 within 'morphing' only
  }

  update(scrollPage, viewportWidth) {
    const mobile = viewportWidth < 640;
    const exitStart = 0.05;
    const exitEnd = mobile ? 0.15 : 0.22;

    let next = 'hero';
    let p = 0;
    if (scrollPage < exitStart) {
      next = 'hero';
      p = 0;
    } else if (scrollPage < exitEnd) {
      next = 'morphing';
      p = (scrollPage - exitStart) / (exitEnd - exitStart);
    } else {
      next = 'pill';
      p = 1;
    }

    if (next !== this.state) {
      this.state = next;
      document.documentElement.dataset.heroState = next;
    }
    this.progress = p;
  }
}
