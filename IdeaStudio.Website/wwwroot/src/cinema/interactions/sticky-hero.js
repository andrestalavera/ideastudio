// Toggles <html class="is-past-hero"> when the Home intro hero scrolls
// out of view. Cheap IntersectionObserver — no rAF.

const TARGET_ID = 'home-intro-hero';
let observer = null;

export function attach() {
  const el = document.getElementById(TARGET_ID);
  if (!el) {
    // Not on Home — ensure the class is off so other pages don't carry it over.
    if (observer) { observer.disconnect(); observer = null; }
    document.documentElement.classList.remove('is-past-hero');
    return;
  }
  if (observer) { observer.disconnect(); observer = null; }
  observer = new IntersectionObserver((entries) => {
    const entry = entries[0];
    // When the hero is NOT intersecting the viewport, we've scrolled past.
    document.documentElement.classList.toggle('is-past-hero', !entry.isIntersecting);
  }, { rootMargin: '-64px 0px 0px 0px', threshold: 0 });
  observer.observe(el);
}

export function detach() {
  observer?.disconnect();
  observer = null;
  document.documentElement.classList.remove('is-past-hero');
}
