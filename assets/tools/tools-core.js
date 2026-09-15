/* ══════════ ONNMORE TOOLS — CORE (analytics, consent, popup, event tracking) ══════════
   Loaded only on /tools/ pages. Reuses the SAME cookie-consent key and GA4/GTM
   IDs as the main site (index.html) so consent state is shared everywhere and
   a visitor is never asked twice. site.js (theme/mobile-nav/A2HS) is untouched
   and still loaded separately on every page, including these. */

/* ── Cookie / analytics consent (mirrors index.html's implementation) ── */
var COOKIE_CONSENT_KEY = 'onnmore_cookie_consent_v1';
var _analyticsLoaded = false;
function loadConsentAnalytics() {
  if (_analyticsLoaded) return;
  _analyticsLoaded = true;
  try {
    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function () { dataLayer.push(arguments); };
    gtag('js', new Date());
    gtag('config', 'G-PJT7THH2DT', { anonymize_ip: true });
    var ga = document.createElement('script');
    ga.async = true;
    ga.src = 'https://www.googletagmanager.com/gtag/js?id=G-PJT7THH2DT';
    document.head.appendChild(ga);

    window.dataLayer.push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' });
    var gtm = document.createElement('script');
    gtm.async = true;
    gtm.src = 'https://www.googletagmanager.com/gtm.js?id=GTM-56VL3FPC';
    document.head.appendChild(gtm);
  } catch (e) {}
}
function setCookieConsent(choice) {
  try { localStorage.setItem(COOKIE_CONSENT_KEY, choice); } catch (e) {}
  var banner = document.getElementById('cookieConsent');
  if (banner) banner.classList.remove('show');
  if (choice === 'all') loadConsentAnalytics();
}
function initCookieConsent() {
  var choice = '';
  try { choice = localStorage.getItem(COOKIE_CONSENT_KEY) || ''; } catch (e) {}
  if (choice === 'all') { loadConsentAnalytics(); return; }
  if (choice !== 'essential') {
    var banner = document.getElementById('cookieConsent');
    if (banner) banner.classList.add('show');
  }
}

/* ── Safe event tracking ──
   Only a fixed allow-list of parameter keys is ever sent, and values are
   capped/stringified — this makes it structurally hard to accidentally
   leak an email, phone number, GSTIN or similar into GA from a tool page. */
var TRACK_PARAM_ALLOWLIST = ['tool_name', 'tool_category', 'completion_status', 'step', 'cta_id', 'result_type'];
function trackEvent(eventName, params) {
  try {
    var safeParams = {};
    if (params) {
      TRACK_PARAM_ALLOWLIST.forEach(function (k) {
        if (params[k] !== undefined && params[k] !== null) safeParams[k] = String(params[k]).slice(0, 80);
      });
    }
    if (typeof gtag === 'function') gtag('event', eventName, safeParams);
  } catch (e) {}
}

/* ── Auto tool_view + funnel helpers, driven by data attributes on <body> ── */
function currentToolMeta() {
  var b = document.body;
  return { tool_name: b.getAttribute('data-tool-name') || '', tool_category: b.getAttribute('data-tool-category') || '' };
}
function trackToolStart() { trackEvent('tool_start', currentToolMeta()); }
function trackToolComplete(resultType) {
  var meta = currentToolMeta();
  meta.completion_status = 'completed';
  if (resultType) meta.result_type = resultType;
  trackEvent('tool_complete', meta);
}
function trackFormStep(stepNum) {
  var meta = currentToolMeta();
  meta.step = stepNum;
  trackEvent(stepNum <= 1 ? 'form_start' : ('form_step_' + stepNum), meta);
}
function trackCtaClick(ctaId) {
  var meta = currentToolMeta();
  meta.cta_id = ctaId;
  trackEvent('cta_click', meta);
}

/* ── WhatsApp / phone / email click tracking (delegated, no PII ever sent) ── */
function initContactClickTracking() {
  document.addEventListener('click', function (e) {
    var a = e.target.closest ? e.target.closest('a[href]') : null;
    if (!a) return;
    var href = a.getAttribute('href') || '';
    var meta = currentToolMeta();
    if (href.indexOf('wa.me') !== -1) trackEvent('whatsapp_click', meta);
    else if (href.indexOf('tel:') === 0) trackEvent('phone_click', meta);
    else if (href.indexOf('mailto:') === 0) trackEvent('email_click', meta);
  });
}

/* ── Restrained assistance popup ──
   Appears once, after a delay, never immediately on load; dismissal is
   remembered in localStorage so a returning visitor isn't interrupted again. */
var TOOL_POPUP_KEY_PREFIX = 'onnmore_tool_popup_dismissed_';
function initAssistancePopup() {
  var popup = document.getElementById('toolAssistPopup');
  if (!popup) return;
  var toolName = currentToolMeta().tool_name || 'generic';
  var key = TOOL_POPUP_KEY_PREFIX + toolName;
  var dismissed = false;
  try { dismissed = localStorage.getItem(key) === '1'; } catch (e) {}
  if (dismissed) return;
  var shown = false;
  function maybeShow() {
    if (shown) return;
    shown = true;
    popup.classList.add('show');
  }
  setTimeout(maybeShow, 25000);
  window.addEventListener('scroll', function onScroll() {
    if ((window.scrollY + window.innerHeight) / document.body.scrollHeight > 0.6) {
      maybeShow();
      window.removeEventListener('scroll', onScroll);
    }
  });
  var closeBtn = popup.querySelector('.tool-popup-close');
  if (closeBtn) closeBtn.addEventListener('click', function () {
    popup.classList.remove('show');
    try { localStorage.setItem(key, '1'); } catch (e) {}
  });
}

document.addEventListener('DOMContentLoaded', function () {
  initCookieConsent();
  initContactClickTracking();
  initAssistancePopup();
  var meta = currentToolMeta();
  if (meta.tool_name) trackEvent('tool_view', meta);
});
