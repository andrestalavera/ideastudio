// interactions/reveals.js — adds .is-revealed to [data-reveal] elements
// when they enter the viewport. Stagger is via inline --reveal-step CSS var.

let observer = null;

function ensureObserver() {
  if (observer) return observer;
  observer = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (e.isIntersecting) {
        e.target.classList.add('is-revealed');
        observer.unobserve(e.target);
      }
    }
  }, { rootMargin: '-10% 0px', threshold: 0.05 });
  return observer;
}

export function attachReveals() {
  const io = ensureObserver();
  for (const el of document.querySelectorAll('[data-reveal]:not(.is-revealed)')) {
    io.observe(el);
  }
  // Observe newly added nodes too (pages rerender after culture switch).
  if (!attachReveals._mo) {
    attachReveals._mo = new MutationObserver(() => {
      for (const el of document.querySelectorAll('[data-reveal]:not(.is-revealed)')) {
        io.observe(el);
      }
    });
    attachReveals._mo.observe(document.body, { childList: true, subtree: true });
  }
}

export function disposeReveals() {
  observer?.disconnect();
  observer = null;
  attachReveals._mo?.disconnect();
  attachReveals._mo = null;
}
