// Scroll-reveal: toggles `is-revealed` on [data-reveal] (and [data-reveal-words])
// via IntersectionObserver. SCSS handles the opacity + transform; JS only flips
// the class.
//
// A MutationObserver on <body> watches for Blazor re-renders that insert new
// reveal elements (e.g. cards appearing after async data load) and
// auto-attaches them — otherwise only elements present at the initial
// attachAll() call would animate.

/** @type {IntersectionObserver|null} */
let observer = null;
/** @type {MutationObserver|null} */
let mutationObserver = null;

/** @type {WeakSet<Element>} */
const attached = new WeakSet();

// [data-reveal] is the classic opacity/transform block reveal; [data-reveal-words]
// is the Phase C5.1 per-word chapter-title reveal. Both just need `is-revealed`
// toggled on entry — the SCSS drives two different animations from the same class.
const SELECTOR = '[data-reveal], [data-reveal-words]';

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
  if (root.hasAttribute?.('data-reveal') || root.hasAttribute?.('data-reveal-words')) {
    attachOne(root);
  }
  root.querySelectorAll?.(SELECTOR).forEach(attachOne);
}

export function attachAll() {
  if (typeof IntersectionObserver === 'undefined') {
    document.querySelectorAll(`${SELECTOR}`).forEach(el => {
      if (!el.classList.contains('is-revealed')) el.classList.add('is-revealed');
    });
    return;
  }

  ensureObserver();
  document.querySelectorAll(SELECTOR).forEach(attachOne);

  // Watch for future reveal nodes inserted by Blazor re-renders.
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
