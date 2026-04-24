// Scroll-reveal: toggles `is-revealed` on [data-reveal] via IntersectionObserver.
// SCSS handles the opacity + transform; JS only flips the class.
//
// A MutationObserver on <body> watches for Blazor re-renders that insert new
// [data-reveal] elements (e.g. cards appearing after async data load) and
// auto-attaches them — otherwise only elements present at the initial
// attachAll() call would animate.

/** @type {IntersectionObserver|null} */
let observer = null;
/** @type {MutationObserver|null} */
let mutationObserver = null;

/** @type {WeakSet<Element>} */
const attached = new WeakSet();

function ensureObserver() {
  observer ??= new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-revealed');
        observer.unobserve(entry.target);
      }
    }
  }, { rootMargin: '0px 0px -10% 0px', threshold: 0 });
}

function attachOne(el) {
  if (attached.has(el)) return;
  attached.add(el);
  observer.observe(el);
}

function scanSubtree(root) {
  if (root.nodeType !== 1) return;
  if (root.hasAttribute?.('data-reveal')) attachOne(root);
  root.querySelectorAll?.('[data-reveal]').forEach(attachOne);
}

export function attachAll() {
  if (typeof IntersectionObserver === 'undefined') {
    document.querySelectorAll('[data-reveal]:not(.is-revealed)')
      .forEach(el => el.classList.add('is-revealed'));
    return;
  }

  ensureObserver();
  document.querySelectorAll('[data-reveal]').forEach(attachOne);

  // Watch for future [data-reveal] nodes inserted by Blazor re-renders.
  if (!mutationObserver && typeof MutationObserver !== 'undefined') {
    mutationObserver = new MutationObserver((mutations) => {
      for (const m of mutations) {
        for (const node of m.addedNodes) scanSubtree(node);
      }
    });
    mutationObserver.observe(document.body, { childList: true, subtree: true });
  }
}

export function disposeAll() {
  observer?.disconnect();
  observer = null;
  mutationObserver?.disconnect();
  mutationObserver = null;
}
