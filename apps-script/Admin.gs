/**
 * Onnmore admin, lead and quotation endpoints.
 * Add this file to the existing plan checkout Apps Script project.
 */
const ADMIN_LEAD_HEADERS_ = [
  'Case ID', 'Submitted At', 'Updated At', 'Name', 'Email', 'Phone',
  'Business Name', 'Location', 'Service Key', 'Service Name', 'Details',
  'Status', 'Source', 'Terms Accepted At'
];
const ADMIN_QUOTE_HEADERS_ = [
  'Quote ID', 'Created At', 'Updated At', 'Lead ID', 'Customer Name',
  'Email', 'Phone', 'Business Name', 'Service', 'Line Items JSON',
  'Subtotal', 'Status', 'Valid Until', 'Notes', 'Terms', 'Payment Order ID'
];

function handleAdminRequest_(request) {
  const action = String(request && request.action || '');
  if (action === 'submitLead') return submitWebsiteLead_(request.lead || {});
  if (!/^admin[A-Z]/.test(action)) return {ok:false, error:'Unsupported checkout request.'};
  try {
    authorizeAdmin_(request.token);
    switch (action) {
      case 'adminDashboard': return getAdminDashboard_();
      case 'adminUpdateLead': return updateAdminLead_(request.leadId, request.status);
      case 'adminCreateQuote': return createAdminQuote_(request.quote || {});
      case 'adminUpdateQuote': return updateAdminQuote_(request.quoteId, request.quote || {});
      case 'adminSendQuote': return sendAdminQuote_(request.quoteId);
      case 'adminRequestQuotePayment': return requestQuotePayment_(request.quoteId);
      case 'adminVerifyQuotePayment': return verifyQuotePayment_(request.orderId, request.paymentReference, request.confirmed);
      default: return {ok:false, error:'Unsupported admin action.'};
    }
  } catch (err) {
    const message = String(err && err.message || '');
    const safeErrors = [
      'Admin access is not configured.',
      'Please sign in again.',
      'Your admin sign-in has expired. Please sign in again.',
      'Admin sign-in could not be verified.',
      'This Google account is not authorized to use the admin page.'
    ];
    if (safeErrors.indexOf(message) >= 0 || /^(Add between|Check each|Enter the customer|Enter a valid quotation expiry date|The quotation total|Quotation not found|Only draft quotations)/.test(message)) {
      return {ok:false, error:message};
    }
    console.error('Admin request failed (' + action + '): ' + err);
    return {ok:false, error:'The admin request failed. Please retry; if it continues, check the Apps Script execution log.'};
  }
}

function authorizeAdmin_(token) {
  const props = PropertiesService.getScriptProperties();
  const clientId = String(props.getProperty('ADMIN_GOOGLE_CLIENT_ID') || '').trim();
  const allowlist = String(props.getProperty('ADMIN_EMAILS') || '').toLowerCase()
    .split(',').map(function (email) { return email.trim(); }).filter(Boolean);
  if (!clientId || !allowlist.length) throw new Error('Admin access is not configured.');
  if (!token || String(token).length > 5000) throw new Error('Please sign in again.');

  const response = UrlFetchApp.fetch(
    'https://oauth2.googleapis.com/tokeninfo?id_token=' + encodeURIComponent(String(token)),
    {muteHttpExceptions:true}
  );
  if (response.getResponseCode() !== 200) throw new Error('Your admin sign-in has expired. Please sign in again.');
  const claims = JSON.parse(response.getContentText());
  const issuer = String(claims.iss || '');
  const email = String(claims.email || '').trim().toLowerCase();
  if (issuer !== 'accounts.google.com' && issuer !== 'https://accounts.google.com') throw new Error('Admin sign-in could not be verified.');
  if (String(claims.aud || '') !== clientId || String(claims.email_verified || '') !== 'true' || allowlist.indexOf(email) < 0) {
    throw new Error('This Google account is not authorized to use the admin page.');
  }
}

function submitWebsiteLead_(raw) {
  const lead = raw || {};
  const caseId = adminSafe_(lead.caseId, 50);
  const name = adminSafe_(lead.name, 100);
  const email = String(lead.email || '').trim().toLowerCase();
  const phone = adminSafe_(lead.phone, 30);
  if (!caseId || name.length < 2 || (email && !/^[^\s@|]+@[^\s@|]+\.[^\s@|]+$/.test(email)) || email.length > 160) {
    return {ok:false, error:'Please provide valid contact details.'};
  }
  if (lead.termsAccepted !== true) return {ok:false, error:'Customer consent is required.'};

  const sheet = adminSheet_('Leads', ADMIN_LEAD_HEADERS_);
  const existing = adminFindRow_(sheet, 1, caseId);
  if (existing) return {ok:true, caseId:caseId, duplicate:true};
  const now = new Date();
  sheet.appendRow([
    caseId, now, now, name, email, phone,
    adminSafe_(lead.businessName, 140), adminSafe_(lead.location, 120),
    adminSafe_(lead.serviceKey, 160), adminSafe_(lead.serviceName, 180),
    adminSafe_(lead.details, 1800), 'NEW',
    adminSafe_(lead.source || 'Website', 40), adminSafe_(lead.termsAcceptedAt, 60)
  ]);
  return {ok:true, caseId:caseId};
}

function getAdminDashboard_() {
  const leads = adminSheetRows_('Leads', ADMIN_LEAD_HEADERS_).map(function (r) {
    return {caseId:r[0], submittedAt:adminDate_(r[1]), updatedAt:adminDate_(r[2]), name:r[3], email:r[4], phone:r[5], businessName:r[6], location:r[7], serviceKey:r[8], serviceName:r[9], details:r[10], status:r[11], source:r[12]};
  }).reverse().slice(0, 500);
  const quotes = adminSheetRows_('Quotes', ADMIN_QUOTE_HEADERS_).map(function (r) {
    return {quoteId:r[0], createdAt:adminDate_(r[1]), updatedAt:adminDate_(r[2]), leadId:r[3], customerName:r[4], email:r[5], phone:r[6], businessName:r[7], service:r[8], lineItems:adminParseItems_(r[9]), subtotal:Number(r[10]) || 0, status:r[11], validUntil:r[12], notes:r[13], terms:r[14], orderId:r[15]};
  }).reverse().slice(0, 500);
  const orderSheet = getOrdersSheet_(), last = orderSheet.getLastRow(), orders = [];
  if (last > 1) {
    const start = Math.max(2, last - 499);
    orderSheet.getRange(start, 1, last - start + 1, HEADERS.length).getValues().forEach(function (row) {
      const o = rowToObject_(row);
      orders.push({orderId:o.orderId, createdAt:adminDate_(o.createdAt), updatedAt:adminDate_(o.updatedAt), status:o.status, serviceType:o.serviceType, planName:o.planName, amount:Number(o.amount) || 0, customerName:o.customerName, email:o.email, phone:o.phone, paymentMethod:o.paymentMethod, utr:o.utr || '', proofUrl:o.proofUrl || '', receiptSent:o.receiptSent || ''});
    });
    orders.reverse();
  }
  return {ok:true, leads:leads, quotes:quotes, orders:orders};
}

function updateAdminLead_(leadId, status) {
  const allowed = ['NEW', 'CONTACTED', 'APPROVED', 'QUOTED', 'IN_PROGRESS', 'CLOSED'];
  const next = String(status || '').toUpperCase();
  if (allowed.indexOf(next) < 0) return {ok:false, error:'Choose a valid enquiry status.'};
  const sheet = adminSheet_('Leads', ADMIN_LEAD_HEADERS_);
  const row = adminFindRow_(sheet, 1, String(leadId || ''));
  if (!row) return {ok:false, error:'Enquiry not found.'};
  sheet.getRange(row, 12).setValue(next);
  sheet.getRange(row, 3).setValue(new Date());
  return {ok:true};
}

function createAdminQuote_(raw) {
  const quote = normalizeAdminQuote_(raw);
  const now = new Date(), quoteId = 'ONN-Q-' + Utilities.formatDate(now, Session.getScriptTimeZone(), 'yyMMdd') + '-' + Utilities.getUuid().replace(/-/g, '').slice(0, 6).toUpperCase();
  const sheet = adminSheet_('Quotes', ADMIN_QUOTE_HEADERS_);
  sheet.appendRow([
    quoteId, now, now, quote.leadId, quote.customerName, quote.email, quote.phone,
    quote.businessName, quote.service, JSON.stringify(quote.lineItems),
    quote.subtotal, 'DRAFT', quote.validUntil,
    quote.notes, quote.terms, ''
  ]);
  return {ok:true, quoteId:quoteId, subtotal:quote.subtotal};
}

function updateAdminQuote_(quoteId, raw) {
  const found = findAdminQuote_(quoteId);
  if (!found) return {ok:false, error:'Quotation not found.'};
  if (found.quote.status !== 'DRAFT') return {ok:false, error:'Only draft quotations can be edited. Create a new draft if details must change.'};

  const quote = normalizeAdminQuote_(raw);
  const now = new Date();
  found.sheet.getRange(found.row, 3, 1, 13).setValues([[
    now, quote.leadId, quote.customerName, quote.email, quote.phone,
    quote.businessName, quote.service, JSON.stringify(quote.lineItems),
    quote.subtotal, 'DRAFT', quote.validUntil, quote.notes, quote.terms
  ]]);
  return {ok:true, quoteId:found.quote.quoteId, subtotal:quote.subtotal};
}

function normalizeAdminQuote_(raw) {
  const quote = raw || {};
  const customerName = adminSafe_(quote.customerName, 100);
  const email = String(quote.email || '').trim().toLowerCase();
  const phone = adminSafe_(quote.phone, 30);
  const service = adminSafe_(quote.service, 140);
  const lineItems = adminValidateItems_(quote.lineItems);
  if (customerName.length < 2 || !/^[^\s@|]+@[^\s@|]+\.[^\s@|]+$/.test(email) || email.length > 160 || !phone || !service) {
    throw new Error('Enter the customer name, valid email, phone and service.');
  }
  const subtotal = Math.round(lineItems.reduce(function (sum, item) {
    return sum + item.quantity * item.unitPrice;
  }, 0) * 100) / 100;
  if (!subtotal || subtotal > 1000000000) throw new Error('The quotation total must be greater than zero and within the supported limit.');
  const validUntil = adminSafe_(quote.validUntil, 10);
  const expiryDate = validUntil ? new Date(validUntil + 'T00:00:00Z') : null;
  if (validUntil && (!/^\d{4}-\d{2}-\d{2}$/.test(validUntil) || !Number.isFinite(expiryDate.getTime()) || expiryDate.toISOString().slice(0, 10) !== validUntil)) {
    throw new Error('Enter a valid quotation expiry date.');
  }
  return {
    leadId:adminSafe_(quote.leadId, 50),
    customerName:customerName,
    email:email,
    phone:phone,
    businessName:adminSafe_(quote.businessName, 140),
    service:service,
    lineItems:lineItems,
    subtotal:subtotal,
    validUntil:validUntil,
    notes:adminSafe_(quote.notes, 1200),
    terms:adminSafe_(quote.terms, 1200)
  };
}

function sendAdminQuote_(quoteId) {
  const found = findAdminQuote_(quoteId);
  if (!found) return {ok:false, error:'Quotation not found.'};
  const q = found.quote;
  if (q.status === 'PAID' || q.status === 'CANCELLED') return {ok:false, error:'This quotation is no longer available to send.'};
  MailApp.sendEmail({
    to:q.email,
    subject:'Quotation ' + q.quoteId + ' — Onnmore',
    body:adminQuoteText_(q),
    htmlBody:adminQuoteHtml_(q),
    name:'Onnmore'
  });
  adminWriteQuote_(found.row, {status:'SENT', updatedAt:new Date()});
  if (q.leadId) updateAdminLead_(q.leadId, 'QUOTED');
  return {ok:true, quoteId:q.quoteId};
}

function requestQuotePayment_(quoteId) {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(8000)) return {ok:false, error:'The order service is busy. Please retry.'};
  try {
    const found = findAdminQuote_(quoteId);
    if (!found) return {ok:false, error:'Quotation not found.'};
    const q = found.quote;
    if (q.status !== 'SENT' && q.status !== 'PAYMENT_REQUESTED') return {ok:false, error:'Send the quotation before requesting payment.'};
    if (q.orderId) {
      const prior = findOrderById_(q.orderId);
      if (prior && prior.data.status === UPI_STATUS.PAID) return {ok:false, error:'This quotation is already paid.'};
      if (prior && (prior.data.status === UPI_STATUS.PENDING || prior.data.status === UPI_STATUS.PROOF)) {
        sendQuotePaymentEmail_(q, prior.data.orderId);
        return {ok:true, orderId:prior.data.orderId, reused:true};
      }
    }

    const orderId = makeOrderId_();
    if (!buildUpiLink_(orderId, q.subtotal)) return {ok:false, error:'UPI payment is not configured for this website.'};
    const now = new Date();
    appendOrderRow_({
      orderId:orderId, txnid:'', createdAt:now, updatedAt:now,
      status:UPI_STATUS.PENDING, serviceType:'custom-quote', planId:'custom-quote',
      planName:'Quotation ' + q.quoteId, amount:q.subtotal,
      customerName:q.customerName, email:q.email, phone:q.phone,
      businessName:q.businessName, businessType:'', state:'', city:'',
      deviceType:'', deviceModel:'', websiteUrl:'', requirements:q.service,
      consentAt:'', paymentId:'', paymentMode:'UPI', receiptSent:'',
      paymentMethod:'UPI'
    });
    adminWriteQuote_(found.row, {status:'PAYMENT_REQUESTED', updatedAt:now, orderId:orderId});
    sendQuotePaymentEmail_(q, orderId);
    return {ok:true, orderId:orderId};
  } finally {
    lock.releaseLock();
  }
}

function verifyQuotePayment_(orderId, paymentReference, confirmed) {
  if (confirmed !== true) return {ok:false, error:'Confirm the bank credit before recording payment.'};
  const reference = adminSafe_(paymentReference, 100);
  if (!reference) return {ok:false, error:'Enter the bank UTR or payment reference.'};
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(8000)) return {ok:false, error:'The order service is busy. Please retry.'};
  try {
    const found = findOrderById_(String(orderId || ''));
    if (!found || found.data.serviceType !== 'custom-quote') return {ok:false, error:'Custom quotation payment not found.'};
    const o = found.data;
    if (o.status === UPI_STATUS.PAID) return {ok:true, alreadyPaid:true, receiptSent:o.receiptSent};
    if (o.status !== UPI_STATUS.PENDING && o.status !== UPI_STATUS.PROOF) return {ok:false, error:'This payment is not available for verification.'};

    updateOrder_(found.row, {
      status:UPI_STATUS.PAID, updatedAt:new Date(), paymentId:reference,
      paymentMode:'UPI', receiptSent:'Sending'
    });
    const quote = findAdminQuoteByOrder_(o.orderId);
    if (quote) adminWriteQuote_(quote.row, {status:'PAID', updatedAt:new Date()});
    try {
      sendQuotePaymentReceipt_(o, reference);
      updateOrder_(found.row, {receiptSent:'Yes ' + new Date().toISOString()});
      return {ok:true, status:UPI_STATUS.PAID, receiptSent:true};
    } catch (err) {
      console.error('Quotation payment receipt failed: ' + err);
      updateOrder_(found.row, {receiptSent:'FAILED — resend manually'});
      return {ok:true, status:UPI_STATUS.PAID, receiptSent:false, message:'Payment was recorded, but the receipt email could not be sent.'};
    }
  } finally {
    lock.releaseLock();
  }
}

function sendQuotePaymentEmail_(q, orderId) {
  const link = getSiteUrl_() + '/upi-payment.html?order=' + encodeURIComponent(orderId);
  const amount = adminMoney_(q.subtotal);
  const body = 'Hello ' + q.customerName + ',\n\nPayment is requested for quotation ' + q.quoteId + ' (' + q.service + ').\nAmount requested: ' + amount + '\nPayment reference: ' + orderId + '\n\nOpen this secure Onnmore page to pay by UPI and submit your payment proof: ' + link + '\n\nThis is a payment request, not a tax invoice or payment receipt. We will verify the bank credit before confirming payment.\n\nOnnmore Technologies Private Limited';
  const html = '<div style="font-family:Arial,sans-serif;max-width:640px;margin:auto;color:#18212a"><h2 style="color:#13865b">Payment request</h2><p>Hello ' + escapeHtml_(q.customerName) + ',</p><p>Payment is requested for quotation <strong>' + escapeHtml_(q.quoteId) + '</strong> (' + escapeHtml_(q.service) + ').</p><p style="font-size:24px;font-weight:bold">' + escapeHtml_(amount) + '</p><p>Order reference: ' + escapeHtml_(orderId) + '</p><p><a href="' + escapeHtml_(link) + '" style="display:inline-block;padding:12px 18px;background:#13865b;color:white;text-decoration:none;border-radius:8px">Open UPI payment page</a></p><p>This is a payment request, not a tax invoice or payment receipt. We will verify the bank credit before confirming payment.</p><p>Onnmore Technologies Private Limited</p></div>';
  MailApp.sendEmail({to:q.email, subject:'Payment request ' + q.quoteId + ' — Onnmore', body:body, htmlBody:html, name:'Onnmore Payments'});
}

function sendQuotePaymentReceipt_(order, reference) {
  const amount = adminMoney_(order.amount);
  const body = 'Hello ' + order.customerName + ',\n\nWe have manually verified the payment against our bank credit.\n\nQuotation: ' + order.planName.replace(/^Quotation /, '') + '\nOrder reference: ' + order.orderId + '\nAmount recorded: ' + amount + '\nPayment reference: ' + reference + '\n\nThis email confirms receipt of the payment only. It is not a GST tax invoice. Please contact Onnmore if you require a tax invoice.\n\nOnnmore Technologies Private Limited';
  const html = '<div style="font-family:Arial,sans-serif;max-width:640px;margin:auto;color:#18212a"><h2 style="color:#13865b">Payment confirmed</h2><p>Hello ' + escapeHtml_(order.customerName) + ',</p><p>We have manually verified the payment against our bank credit.</p><table style="border-collapse:collapse;width:100%">' + emailRow_('Quotation', order.planName.replace(/^Quotation /, '')) + emailRow_('Order reference', order.orderId) + emailRow_('Amount recorded', amount) + emailRow_('Payment reference', reference) + '</table><p>This email confirms receipt of the payment only. It is not a GST tax invoice. Please contact Onnmore if you require a tax invoice.</p><p>Onnmore Technologies Private Limited</p></div>';
  MailApp.sendEmail({to:order.email, subject:'Payment confirmed — Onnmore ' + order.orderId, body:body, htmlBody:html, name:'Onnmore Payments'});
}

function adminQuoteText_(q) {
  const lines = q.lineItems.map(function (item) {
    return item.service + ': ' + item.description + ' — ' + item.quantity + ' × ' + adminMoney_(item.unitPrice) + ' = ' + adminMoney_(item.quantity * item.unitPrice);
  });
  return 'Hello ' + q.customerName + ',\n\nQuotation ' + q.quoteId + '\nService: ' + q.service + '\n\n' + lines.join('\n') + '\n\nQuotation total: ' + adminMoney_(q.subtotal) + '\nValid until: ' + (q.validUntil || 'Please contact us to confirm validity') + '\n\n' + (q.notes ? q.notes + '\n\n' : '') + (q.terms ? q.terms + '\n\n' : '') + 'This quotation is not a GST tax invoice. Any tax invoice will be issued separately after accounting review.\n\nOnnmore Technologies Private Limited';
}

function adminQuoteHtml_(q) {
  const rows = q.lineItems.map(function (item) {
    return '<tr><td>' + escapeHtml_(item.service) + '</td><td>' + escapeHtml_(item.description) + '</td><td style="text-align:right">' + item.quantity + '</td><td style="text-align:right">' + escapeHtml_(adminMoney_(item.unitPrice)) + '</td><td style="text-align:right">' + escapeHtml_(adminMoney_(item.quantity * item.unitPrice)) + '</td></tr>';
  }).join('');
  const paragraphs = [q.notes, q.terms].filter(Boolean).map(function (text) {
    return '<p>' + escapeHtml_(text).replace(/\n/g, '<br>') + '</p>';
  }).join('');
  return '<div style="font-family:Arial,sans-serif;max-width:760px;margin:auto;color:#18212a"><h2 style="color:#13865b">Quotation ' + escapeHtml_(q.quoteId) + '</h2><p>Hello ' + escapeHtml_(q.customerName) + ',</p><p>Service: <strong>' + escapeHtml_(q.service) + '</strong></p><table style="border-collapse:collapse;width:100%"><thead><tr><th align="left">Service</th><th align="left">Description</th><th align="right">Qty</th><th align="right">Rate</th><th align="right">Amount</th></tr></thead><tbody>' + rows + '</tbody><tfoot><tr><td colspan="4" style="text-align:right;padding:12px"><strong>Quotation total</strong></td><td style="text-align:right"><strong>' + escapeHtml_(adminMoney_(q.subtotal)) + '</strong></td></tr></tfoot></table><p>Valid until: ' + escapeHtml_(q.validUntil || 'Please contact us to confirm validity') + '</p>' + paragraphs + '<p>This quotation is not a GST tax invoice. Any tax invoice will be issued separately after accounting review.</p><p>Onnmore Technologies Private Limited</p></div>';
}

function adminValidateItems_(items) {
  if (!Array.isArray(items) || !items.length || items.length > 30) throw new Error('Add between 1 and 30 service line items.');
  return items.map(function (item) {
    item = item && typeof item === 'object' ? item : {};
    const service = adminSafe_(item.service, 100);
    const description = adminSafe_(item.description, 240);
    const quantity = Number(item.quantity);
    const unitPrice = Math.round(Number(item.unitPrice) * 100) / 100;
    if (!service || !description || !Number.isInteger(quantity) || quantity < 1 || quantity > 1000 || !Number.isFinite(unitPrice) || unitPrice < 0 || unitPrice > 100000000) {
      throw new Error('Check each service, description, quantity and unit price.');
    }
    return {service:service, description:description, quantity:quantity, unitPrice:unitPrice};
  });
}

function adminSheet_(name, headers) {
  const ss = getOrdersSheet_().getParent();
  let sheet = ss.getSheetByName(name);
  if (!sheet) sheet = ss.insertSheet(name);
  if (sheet.getLastRow() === 0) sheet.appendRow(headers);
  else if (sheet.getLastColumn() < headers.length) sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  return sheet;
}

function adminSheetRows_(name, headers) {
  const sheet = adminSheet_(name, headers), last = sheet.getLastRow();
  return last > 1 ? sheet.getRange(2, 1, last - 1, headers.length).getValues() : [];
}

function adminFindRow_(sheet, column, value) {
  if (!value || sheet.getLastRow() < 2) return 0;
  const cells = sheet.getRange(2, column, sheet.getLastRow() - 1, 1).getDisplayValues();
  for (let i = 0; i < cells.length; i++) if (cells[i][0] === String(value)) return i + 2;
  return 0;
}

function findAdminQuote_(quoteId) {
  const sheet = adminSheet_('Quotes', ADMIN_QUOTE_HEADERS_);
  const row = adminFindRow_(sheet, 1, String(quoteId || ''));
  if (!row) return null;
  const r = sheet.getRange(row, 1, 1, ADMIN_QUOTE_HEADERS_.length).getValues()[0];
  return {row:row, sheet:sheet, quote:{quoteId:r[0], createdAt:adminDate_(r[1]), updatedAt:adminDate_(r[2]), leadId:r[3], customerName:r[4], email:r[5], phone:r[6], businessName:r[7], service:r[8], lineItems:adminParseItems_(r[9]), subtotal:Number(r[10]) || 0, status:r[11], validUntil:r[12], notes:r[13], terms:r[14], orderId:r[15]}};
}

function findAdminQuoteByOrder_(orderId) {
  const sheet = adminSheet_('Quotes', ADMIN_QUOTE_HEADERS_);
  const row = adminFindRow_(sheet, 16, String(orderId || ''));
  return row ? {row:row, sheet:sheet} : null;
}

function adminWriteQuote_(row, changes) {
  const sheet = adminSheet_('Quotes', ADMIN_QUOTE_HEADERS_);
  const columns = {updatedAt:3, status:12, orderId:16};
  Object.keys(changes).forEach(function (key) {
    if (columns[key]) sheet.getRange(row, columns[key]).setValue(changes[key]);
  });
}

function adminParseItems_(value) {
  try { const items = JSON.parse(String(value || '[]')); return Array.isArray(items) ? items : []; }
  catch (err) { console.error('Quotation line item data could not be parsed: ' + err); return []; }
}

function adminDate_(value) {
  return value instanceof Date ? value.toISOString() : value || '';
}

function adminSafe_(value, max) {
  const text = safeText_(value, max || 500);
  const normalized = String(text || '').slice(0, max || 500);
  return /^[\s]*[=+\-@]/.test(normalized) ? "'" + normalized : normalized;
}

function adminMoney_(amount) {
  return '₹' + Number(amount || 0).toLocaleString('en-IN', {minimumFractionDigits:2, maximumFractionDigits:2});
}
