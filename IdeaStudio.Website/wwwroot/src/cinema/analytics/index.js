// wwwroot/src/cinema/analytics/index.js
// Runtime for analytics consent + page-view tracking.
// Loaded as part of cinema.bundle.js. Exposes window.ideaAnalytics.
//
// Behavior:
//   - On localhost: every call is a no-op (no scripts, no fetches).
//   - setConsent(true)  -> updates Consent Mode v2 to granted; lazy-loads
//                          Clarity and (if META_PIXEL_ID is set) Meta Pixel.
//   - setConsent(false) -> updates Consent Mode v2 to denied (idempotent).
//   - trackPageView(url) -> always fires gtag page_view; calls clarity/fbq
//                           page hooks if those scripts are loaded.
//
// To enable Meta Pixel later: replace META_PIXEL_ID = null with the actual ID.

const GA_ID = 'G-VFWV1QDJFB';
const CLARITY_ID = 'whf48fcfv3';
const META_PIXEL_ID = null; // TODO: set when Meta Pixel ID is available

const isLocalhost =
  typeof location !== 'undefined' &&
  (location.hostname === 'localhost' ||
   location.hostname === '127.0.0.1' ||
   location.hostname === '[::1]');

let clarityLoaded = false;
let pixelLoaded = false;

function gtag() {
  if (typeof window === 'undefined' || !window.dataLayer) return;
  window.dataLayer.push(arguments);
}

function loadClarity() {
  if (clarityLoaded || isLocalhost) return;
  clarityLoaded = true;
  // Standard Microsoft Clarity loader, inlined to avoid a separate file.
  (function (c, l, a, r, i, t, y) {
    c[a] = c[a] || function () { (c[a].q = c[a].q || []).push(arguments); };
    t = l.createElement(r); t.async = 1; t.src = 'https://www.clarity.ms/tag/' + i;
    y = l.getElementsByTagName(r)[0]; y.parentNode.insertBefore(t, y);
  })(window, document, 'clarity', 'script', CLARITY_ID);
}

function loadMetaPixel() {
  if (pixelLoaded || isLocalhost || !META_PIXEL_ID) return;
  pixelLoaded = true;
  // Standard Meta Pixel loader.
  (function (f, b, e, v, n, t, s) {
    if (f.fbq) return; n = f.fbq = function () {
      n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
    };
    if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = '2.0';
    n.queue = []; t = b.createElement(e); t.async = !0;
    t.src = v; s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s);
  })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
  window.fbq('init', META_PIXEL_ID);
  window.fbq('track', 'PageView');
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
    loadMetaPixel();
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
    if (pixelLoaded && window.fbq) {
      window.fbq('track', 'PageView');
    }
  }, 50);
}

if (typeof window !== 'undefined') {
  window.ideaAnalytics = { setConsent, trackPageView };
}
