// Scroll-reveal: toggles `is-revealed` on [data-reveal] via IntersectionObserver.
// SCSS handles the opacity + transform; JS only flips the class.

/** @type {IntersectionObserver|null} */
let observer = null;

/** @type {WeakSet<Element>} */
const attached = new WeakSet();

export function attachAll() {
  if (typeof IntersectionObserver === 'undefined') {
    document.querySelectorAll('[data-reveal]:not(.is-revealed)')
      .forEach(el => el.classList.add('is-revealed'));
    return;
  }

  observer ??= new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-revealed');
        observer.unobserve(entry.target);
      }
    }
  }, { rootMargin: '0px 0px -10% 0px', threshold: 0 });

  document.querySelectorAll('[data-reveal]').forEach((el) => {
    if (attached.has(el)) return;
    attached.add(el);
    observer.observe(el);
  });
}

export function disposeAll() {
  observer?.disconnect();
  observer = null;
}
