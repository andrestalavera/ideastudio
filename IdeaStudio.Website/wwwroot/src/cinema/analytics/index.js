// wwwroot/src/cinema/analytics/index.js
// Runtime for analytics consent + page-view tracking.
// Loaded as part of cinema.bundle.js. Exposes window.ideaAnalytics.
//
// Behavior:
//   - On localhost: every call is a no-op (no scripts, no fetches).
//   - setConsent(true)  -> updates Consent Mode v2 to granted; lazy-loads Clarity.
//   - setConsent(false) -> updates Consent Mode v2 to denied (idempotent).
//   - trackPageView(url) -> always fires gtag page_view; calls the Clarity
//                           page hook once Clarity is loaded.

const GA_ID = 'G-VFWV1QDJFB';
const CLARITY_ID = 'whf48fcfv3';

const isLocalhost =
  typeof location !== 'undefined' &&
  (location.hostname === 'localhost' ||
   location.hostname === '127.0.0.1' ||
   location.hostname === '[::1]');

let clarityLoaded = false;

function gtag() {
  if (typeof window === 'undefined' || !window.dataLayer) return;
  window.dataLayer.push(arguments);
}

function loadClarity() {
  if (clarityLoaded || isLocalhost) return;
  clarityLoaded = true;
  // Standard Microsoft Clarity loader, inlined to avoid a separate file.
  (function (c, l, a, r, i) {
    c[a] = c[a] || function () { (c[a].q = c[a].q || []).push(arguments); };
    const t = l.createElement(r); t.async = 1; t.src = 'https://www.clarity.ms/tag/' + i;
    const y = l.getElementsByTagName(r)[0]; y.parentNode.insertBefore(t, y);
  })(window, document, 'clarity', 'script', CLARITY_ID);
}

export function setConsent(grant) {
  if (isLocalhost) return;
  if (!!grant) {
    gtag('consent', 'update', {
      ad_storage: 'granted',
      ad_user_data: 'granted',
      ad_personalization: 'granted',
      analytics_storage: 'granted'
    });
    loadClarity();
  } else {
    gtag('consent', 'update', {
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
      analytics_storage: 'denied'
    });
  }
}

export function trackPageView(url) {
  if (isLocalhost) return;
  // Defer one tick so SeoHead has a chance to update document.title first.
  setTimeout(() => {
    gtag('event', 'page_view', {
      page_location: url || (typeof location !== 'undefined' ? location.href : ''),
      page_title: typeof document !== 'undefined' ? document.title : ''
    });
    if (clarityLoaded && window.clarity) {
      window.clarity('set', 'page', url || location.href);
    }
  }, 50);
}

// Conversion / interaction events (CTA clicks, contact submits, downloads).
export function trackEvent(name, params) {
  if (isLocalhost || !name) return;
  gtag('event', name, params || {});
  if (clarityLoaded && window.clarity) {
    try { window.clarity('event', name); } catch (e) { /* noop */ }
  }
}

if (typeof window !== 'undefined') {
  window.ideaAnalytics = { setConsent, trackPageView, trackEvent };
}
