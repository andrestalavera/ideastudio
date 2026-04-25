// interactions/reveals.js — toggles .is-revealed on [data-reveal] elements
// based on viewport intersection. Reversible: scrolling back up re-hides,
// scrolling down reveals again. Stagger via --reveal-step CSS var.

let observer = null;

function ensureObserver() {
  if (observer) return observer;
  observer = new IntersectionObserver((entries) => {
    for (const e of entries) {
      // Toggle both ways — no unobserve, so reveals replay on reverse scroll.
      e.target.classList.toggle('is-revealed', e.isIntersecting);
    }
  }, { rootMargin: '-8% 0px -8% 0px', threshold: 0.05 });
  return observer;
}

export function attachReveals() {
  const io = ensureObserver();
  for (const el of document.querySelectorAll('[data-reveal]')) {
    io.observe(el);
  }
  if (!attachReveals._mo) {
    attachReveals._mo = new MutationObserver(() => {
      for (const el of document.querySelectorAll('[data-reveal]')) {
        io.observe(el);  // re-observing an already-observed node is a no-op.
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
