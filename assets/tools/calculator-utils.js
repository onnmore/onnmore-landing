/* ══════════ ONNMORE TOOLS — SHARED CALCULATOR UTILITIES ══════════
   Pure, dependency-free helper functions reused across every tool page.
   Keeping these centralized avoids duplicating logic (and bugs) in 10 files. */

/* Format a number as Indian Rupees with lakh/crore grouping, e.g. 1234567.5 -> "12,34,567.50" */
function fmtINR(num, decimals) {
  if (num === null || num === undefined || isNaN(num)) return '0.00';
  var d = (decimals === undefined) ? 2 : decimals;
  var n = Number(num);
  var neg = n < 0;
  n = Math.abs(n);
  var fixed = n.toFixed(d);
  var parts = fixed.split('.');
  var intPart = parts[0];
  var lastThree = intPart.length > 3 ? intPart.slice(-3) : intPart;
  var otherNumbers = intPart.length > 3 ? intPart.slice(0, intPart.length - 3) : '';
  if (otherNumbers !== '') lastThree = ',' + lastThree;
  var grouped = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + lastThree;
  return (neg ? '-' : '') + grouped + (d > 0 ? '.' + parts[1] : '');
}

/* Safely parse a number from a form field, returning 0 for blank/invalid input */
function parseNum(val) {
  var n = parseFloat(String(val).replace(/,/g, '').trim());
  return isNaN(n) ? 0 : n;
}

/* GST split calculator — the single source of truth for every GST-related tool.
   type: 'exclusive' (amount is pre-tax) or 'inclusive' (amount already includes GST)
   txn: 'intra' (CGST+SGST) or 'inter' (IGST) */
function calcGST(amount, ratePercent, type, txn) {
  amount = parseNum(amount);
  ratePercent = parseNum(ratePercent);
  var base, gstAmount, total;
  if (type === 'inclusive') {
    total = amount;
    base = amount / (1 + ratePercent / 100);
    gstAmount = total - base;
  } else {
    base = amount;
    gstAmount = amount * (ratePercent / 100);
    total = base + gstAmount;
  }
  var result = { base: base, gst: gstAmount, total: total, cgst: 0, sgst: 0, igst: 0 };
  if (txn === 'inter') {
    result.igst = gstAmount;
  } else {
    result.cgst = gstAmount / 2;
    result.sgst = gstAmount / 2;
  }
  return result;
}

/* Copy any text to clipboard with a graceful fallback for older/embedded browsers */
function copyText(text, onDone) {
  function done(ok) { if (typeof onDone === 'function') onDone(ok); }
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text).then(function () { done(true); }).catch(function () { done(false); });
  } else {
    try {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.focus(); ta.select();
      var ok = document.execCommand('copy');
      document.body.removeChild(ta);
      done(ok);
    } catch (e) { done(false); }
  }
}

/* Small helper to briefly flash a "Copied!" state on a button */
function flashCopied(btnEl, label) {
  if (!btnEl) return;
  var original = btnEl.getAttribute('data-original-label') || btnEl.innerHTML;
  btnEl.setAttribute('data-original-label', original);
  btnEl.innerHTML = '<i class="ri-check-line"></i> ' + (label || 'Copied!');
  setTimeout(function () { btnEl.innerHTML = original; }, 1800);
}

/* GST rate options used consistently across GST Calculator, Invoice Generator, etc. */
var GST_RATES = [0, 5, 12, 18, 28];
