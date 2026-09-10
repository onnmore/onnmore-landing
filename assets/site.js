/* ══════════ ONNMORE — SHARED SITE SCRIPT (subpages) ══════════ */

/* ── Theme ── */
function setTheme(theme) {
  const val = theme === 'light' ? 'light' : 'dark';
  if (val === 'light') document.documentElement.setAttribute('data-theme', 'light');
  else document.documentElement.removeAttribute('data-theme');
  try { localStorage.setItem('onnmore_theme', val); } catch (e) {}
  document.querySelectorAll('.theme-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-theme-choice') === val);
  });
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', val === 'light' ? '#ffffff' : '#09090f');
}
function initThemeSwitch() {
  let saved = 'dark';
  try { saved = localStorage.getItem('onnmore_theme') || 'dark'; } catch (e) {}
  document.querySelectorAll('.theme-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-theme-choice') === saved);
  });
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', saved === 'light' ? '#ffffff' : '#09090f');
}

/* ── WhatsApp links ── */
const WA_NUMBER = '919477110971';
const WA_DEFAULT_MSG = "Hi Onnmore, I'd like some help with my business registration/compliance.";
function waLink(msg) { return `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg || WA_DEFAULT_MSG)}`; }
function updateWaLinks() {
  document.querySelectorAll('[data-wa-link]').forEach(el => { el.href = waLink(el.getAttribute('data-wa-link') || WA_DEFAULT_MSG); });
  ['heroWaLink','heroWaLink2','faqWaLink','contactWaLink','footWaLink','footWaLink2','mnavWaLink','fabWaLink','ctaWaLink','reviewsWaLink'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.href = waLink();
  });
}

/* ── Mobile nav ── */
function initMobileNav() {
  const mToggle = document.getElementById('mobileToggle');
  const mNav    = document.getElementById('mobileNav');
  const mClose  = document.getElementById('mobileNavClose');
  if (!mToggle || !mNav) return;
  mToggle.addEventListener('click', () => {
    mNav.classList.add('open');
    mNav.setAttribute('aria-hidden', 'false');
    mToggle.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  });
  window.closeMobileNav = function closeMobileNav() {
    mNav.classList.remove('open');
    mNav.setAttribute('aria-hidden', 'true');
    mToggle.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  };
  if (mClose) mClose.addEventListener('click', window.closeMobileNav);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') window.closeMobileNav(); });
}

/* ── FAQ accordion helper (native <details> already handles most of it) ── */

/* ── Scroll reveal ── */
let _revealObserver = null;
function initScrollReveal() {
  const REVEAL_SELECTORS = ['.reveal-el'];
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const els = Array.from(document.querySelectorAll(REVEAL_SELECTORS.join(','))).filter(el => !el.dataset.revealInit);
  if (!els.length) return;
  const groupCounts = new Map();
  els.forEach(el => {
    el.dataset.revealInit = '1';
    el.classList.add('reveal');
    const parent = el.parentElement;
    const idx = groupCounts.get(parent) || 0;
    groupCounts.set(parent, idx + 1);
    el.style.transitionDelay = reduceMotion ? '0ms' : (Math.min(idx, 6) * 70) + 'ms';
  });
  if (reduceMotion || !('IntersectionObserver' in window)) {
    els.forEach(el => el.classList.add('is-visible'));
    return;
  }
  if (!_revealObserver) {
    _revealObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          _revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });
  }
  els.forEach(el => _revealObserver.observe(el));
}

/* ── Add to Home Screen ── */
let a2hsDeferredPrompt = null;
function a2hsIsStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
}
function a2hsDetectPlatform() {
  const ua = navigator.userAgent || '';
  if (/iPhone|iPad|iPod/.test(ua) && !window.MSStream) return 'ios';
  if (/Android/.test(ua)) return 'android';
  return 'desktop';
}
function a2hsInitFab() {
  const fab = document.getElementById('fabA2hs');
  if (!fab) return;
  if (a2hsIsStandalone()) { fab.classList.add('is-hidden'); return; }
}
function openA2hsModal() {
  const overlay = document.getElementById('a2hsOverlay');
  if (!overlay) return;
  overlay.classList.add('show');
  document.body.style.overflow = 'hidden';
  a2hsSwitchTab(a2hsDetectPlatform());
  const installBtn = document.getElementById('a2hsInstallNow');
  if (installBtn) installBtn.style.display = a2hsDeferredPrompt ? 'flex' : 'none';
}
function closeA2hsModal() {
  const overlay = document.getElementById('a2hsOverlay');
  if (!overlay) return;
  overlay.classList.remove('show');
  document.body.style.overflow = '';
}
function a2hsSwitchTab(platform) {
  document.querySelectorAll('.a2hs-tab').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-platform') === platform);
  });
  document.querySelectorAll('[data-platform-panel]').forEach(panel => {
    panel.style.display = panel.getAttribute('data-platform-panel') === platform ? 'flex' : 'none';
  });
}
async function a2hsTriggerInstall() {
  if (!a2hsDeferredPrompt) return;
  const installBtn = document.getElementById('a2hsInstallNow');
  a2hsDeferredPrompt.prompt();
  const choice = await a2hsDeferredPrompt.userChoice;
  a2hsDeferredPrompt = null;
  if (installBtn) installBtn.style.display = 'none';
  if (choice.outcome === 'accepted') closeA2hsModal();
}
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  a2hsDeferredPrompt = e;
  const overlay = document.getElementById('a2hsOverlay');
  const installBtn = document.getElementById('a2hsInstallNow');
  if (overlay && installBtn && overlay.classList.contains('show')) installBtn.style.display = 'flex';
});
window.addEventListener('appinstalled', () => {
  a2hsDeferredPrompt = null;
  const fab = document.getElementById('fabA2hs');
  if (fab) fab.classList.add('is-hidden');
  closeA2hsModal();
});
document.addEventListener('click', (e) => {
  const overlay = document.getElementById('a2hsOverlay');
  if (overlay && e.target === overlay) closeA2hsModal();
});

/* ── Init ── */
(function () {
  document.addEventListener('DOMContentLoaded', function () {
    initThemeSwitch();
    updateWaLinks();
    initMobileNav();
    initScrollReveal();
    a2hsInitFab();
    const yr = document.getElementById('year');
    if (yr) yr.textContent = new Date().getFullYear();
  });
})();
