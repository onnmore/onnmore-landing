(function () {
  'use strict';

  var $ = function (id) { return document.getElementById(id); };
  var state = {token: '', email: '', dashboard: {leads: [], quotes: [], orders: []}, verifyOrderId: ''};
  var signInRetries = 0;
  var statusOptions = [
    ['NEW', 'New'],
    ['CONTACTED', 'Contacted'],
    ['APPROVED', 'Approved'],
    ['QUOTED', 'Quoted'],
    ['IN_PROGRESS', 'In progress'],
    ['CLOSED', 'Closed']
  ];

  function escapeHtml(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (char) {
      return {'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[char];
    });
  }

  function money(value) {
    return '₹' + Number(value || 0).toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2});
  }

  function formatDate(value) {
    if (!value) return '—';
    var date = new Date(value);
    return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString('en-IN', {dateStyle: 'medium', timeStyle: 'short'});
  }

  function alertUser(message, success) {
    var box = $('workspaceAlert');
    box.textContent = message;
    box.classList.toggle('success', Boolean(success));
    box.hidden = false;
    box.scrollIntoView({behavior: 'smooth', block: 'nearest'});
  }

  function clearAlert() {
    $('workspaceAlert').hidden = true;
    $('workspaceAlert').textContent = '';
  }

  async function api(payload) {
    var url = window.ONNMORE_PAYMENT_API_URL || '';
    if (!url) throw new Error('The Apps Script endpoint is missing. Configure the checkout API URL first.');
    var request = Object.assign({}, payload);
    if (request.action !== 'submitLead') request.token = state.token;
    var response = await fetch(url, {
      method: 'POST',
      headers: {'Content-Type': 'text/plain;charset=utf-8'},
      body: JSON.stringify(request)
    });
    if (!response.ok) throw new Error('The admin service could not be reached. Please try again.');
    var result = await response.json();
    if (!result || !result.ok) throw new Error(result && result.error || 'The request could not be completed.');
    return result;
  }

  function showWorkspace() {
    $('signinPanel').hidden = true;
    $('workspace').hidden = false;
    $('signOutBtn').hidden = false;
    $('adminIdentity').textContent = state.email;
    $('adminIdentity').hidden = false;
  }

  function signOut(message) {
    state.token = '';
    state.email = '';
    state.dashboard = {leads: [], quotes: [], orders: []};
    $('workspace').hidden = true;
    $('signinPanel').hidden = false;
    $('signOutBtn').hidden = true;
    $('adminIdentity').hidden = true;
    var statusMessage = message || 'You have signed out.';
    $('googleSignIn').replaceChildren();
    signInRetries = 0;
    initializeSignIn();
    $('signinMessage').textContent = statusMessage;
  }

  function initializeSignIn() {
    var clientId = window.ONNMORE_ADMIN_GOOGLE_CLIENT_ID || '';
    if (!clientId || clientId === 'SET_GOOGLE_OAUTH_WEB_CLIENT_ID') {
      $('signinMessage').textContent = 'Admin setup is incomplete: add the Google OAuth web client ID to assets/admin-config.js.';
      return;
    }
    if (!window.google || !window.google.accounts || !window.google.accounts.id) {
      if (signInRetries++ >= 20) {
        $('signinMessage').textContent = 'Google sign-in did not load. Check your connection or content blocker, then refresh this page.';
        return;
      }
      window.setTimeout(initializeSignIn, 250);
      return;
    }
    signInRetries = 0;
    $('signinMessage').textContent = 'Only email addresses authorized in the Apps Script settings can access this workspace.';
    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: async function (response) {
        state.token = response.credential || '';
        try {
          var claims = JSON.parse(atob(state.token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
          state.email = claims.email || 'Authorized administrator';
          showWorkspace();
          await loadDashboard();
        } catch (error) {
            signOut(error.message || 'Sign-in could not be verified. Please try again.');
        }
      }
    });
    window.google.accounts.id.renderButton($('googleSignIn'), {
      type: 'standard', theme: 'filled_black', size: 'large', shape: 'pill',
      text: 'signin_with', width: 250
    });
  }

  async function loadDashboard() {
    clearAlert();
    $('refreshBtn').disabled = true;
    try {
      state.dashboard = await api({action: 'adminDashboard'});
      renderDashboard();
    } catch (error) {
      alertUser(error.message, false);
      if (/sign in|authorized|configured/i.test(error.message)) signOut(error.message);
    } finally {
      $('refreshBtn').disabled = false;
    }
  }

  function renderDashboard() {
    var data = state.dashboard;
    var leads = data.leads || [], quotes = data.quotes || [], orders = data.orders || [];
    $('metricLeads').textContent = leads.filter(function (lead) { return lead.status !== 'CLOSED'; }).length;
    $('metricQuotes').textContent = quotes.filter(function (quote) { return quote.status !== 'PAID' && quote.status !== 'CANCELLED'; }).length;
    $('metricPayments').textContent = orders.filter(function (order) { return order.status === 'UPI_PROOF_SUBMITTED' || order.status === 'PROOF'; }).length;
    $('metricPaid').textContent = orders.filter(function (order) { return order.status === 'PAID'; }).length;
    renderLeads(leads);
    renderQuotes(quotes);
    renderOrders(orders);
  }

  function renderLeads(leads) {
    var body = $('leadsBody');
    $('leadsEmpty').hidden = leads.length > 0;
    body.innerHTML = leads.map(function (lead) {
      var selected = lead.status || 'NEW';
      var options = statusOptions.map(function (option) {
        return '<option value="' + option[0] + '"' + (selected === option[0] ? ' selected' : '') + '>' + option[1] + '</option>';
      }).join('');
      return '<tr>' +
        '<td><strong>' + escapeHtml(lead.name) + '</strong><small>' + escapeHtml(lead.email) + '<br>' + escapeHtml(lead.phone) + (lead.businessName ? '<br>' + escapeHtml(lead.businessName) : '') + '</small></td>' +
        '<td><strong>' + escapeHtml(lead.serviceName || lead.serviceKey || 'General enquiry') + '</strong><small>' + escapeHtml(lead.details || '') + (lead.location ? '<br>' + escapeHtml(lead.location) : '') + '</small></td>' +
        '<td>' + escapeHtml(formatDate(lead.submittedAt)) + '<small>' + escapeHtml(lead.source || 'Website') + '</small></td>' +
        '<td><select class="status-select" data-lead-status="' + escapeHtml(lead.caseId) + '" aria-label="Status for ' + escapeHtml(lead.name) + '">' + options + '</select></td>' +
        '<td><div class="table-actions">' +
        (selected !== 'APPROVED' && selected !== 'CLOSED' ? '<button class="button small primary" type="button" data-action="approve-lead" data-id="' + escapeHtml(lead.caseId) + '">Approve request</button>' : '') +
        '<button class="button small" type="button" data-action="quote-lead" data-id="' + escapeHtml(lead.caseId) + '">Create quote</button></div></td>' +
        '</tr>';
    }).join('');
  }

  function renderQuotes(quotes) {
    var body = $('quotesBody');
    $('quotesEmpty').hidden = quotes.length > 0;
    body.innerHTML = quotes.map(function (quote) {
      var itemServices = (quote.lineItems || []).map(function (item) { return item.service; }).filter(Boolean);
      var serviceList = Array.from(new Set(itemServices)).join(', ') || quote.service;
      var actions = '';
      if (quote.status === 'DRAFT') actions += '<button class="button small" type="button" data-action="send-quote" data-id="' + escapeHtml(quote.quoteId) + '">Email quote</button>';
      if (quote.status === 'SENT') actions += '<button class="button small primary" type="button" data-action="request-payment" data-id="' + escapeHtml(quote.quoteId) + '">Request payment</button>';
      if (quote.status === 'PAYMENT_REQUESTED') actions += '<button class="button small" type="button" data-action="request-payment" data-id="' + escapeHtml(quote.quoteId) + '">Resend payment request</button>';
      if (quote.status === 'PAID') actions += '<span class="paid-label">Paid</span>';
      return '<tr><td><strong>' + escapeHtml(quote.quoteId) + '</strong><small>' + escapeHtml(formatDate(quote.createdAt)) + '</small></td>' +
        '<td><strong>' + escapeHtml(quote.customerName) + '</strong><small>' + escapeHtml(quote.email) + '</small></td>' +
        '<td><strong>' + escapeHtml(quote.service) + '</strong><small>' + escapeHtml(serviceList) + '</small></td>' +
        '<td><strong>' + escapeHtml(money(quote.subtotal)) + '</strong></td>' +
        '<td>' + escapeHtml(quote.status) + (quote.validUntil ? '<small>Valid until ' + escapeHtml(quote.validUntil) + '</small>' : '') + '</td>' +
        '<td><div class="table-actions">' + actions + '</div></td></tr>';
    }).join('');
  }

  function renderOrders(orders) {
    var body = $('ordersBody');
    $('ordersEmpty').hidden = orders.length > 0;
    body.innerHTML = orders.map(function (order) {
      var proofUrl = /^https:\/\/[^\s"'<>]+$/i.test(order.proofUrl || '') ? order.proofUrl : '';
      var proof = proofUrl ? '<a href="' + escapeHtml(proofUrl) + '" target="_blank" rel="noopener noreferrer">Open proof</a>' : '—';
      var canVerify = (order.status === 'UPI_PROOF_SUBMITTED' || order.status === 'PROOF') && order.serviceType === 'custom-quote';
      var verifyButton = canVerify ? '<button class="button small primary" type="button" data-action="verify-payment" data-id="' + escapeHtml(order.orderId) + '">Verify bank credit</button>' : '';
      var receipt = order.receiptSent === 'FAILED — resend manually' ? '<span class="warning-label">Receipt email failed</span>' : escapeHtml(order.receiptSent || '—');
      return '<tr><td><strong>' + escapeHtml(order.orderId) + '</strong><small>' + escapeHtml(formatDate(order.createdAt)) + '</small></td>' +
        '<td><strong>' + escapeHtml(order.customerName) + '</strong><small>' + escapeHtml(order.email) + '<br>' + escapeHtml(order.planName || order.serviceType) + '</small></td>' +
        '<td><strong>' + escapeHtml(money(order.amount)) + '</strong></td>' +
        '<td>' + escapeHtml(order.status) + (order.utr ? '<small>UTR: ' + escapeHtml(order.utr) + '</small>' : '') + '</td>' +
        '<td>' + proof + (verifyButton ? '<div class="table-actions" style="margin-top:7px">' + verifyButton + '</div>' : '') + '</td>' +
        '<td>' + receipt + '</td></tr>';
    }).join('');
  }

  function openQuote(lead) {
    $('quoteForm').reset();
    $('quoteLeadId').value = lead ? lead.caseId : '';
    $('quoteCustomerName').value = lead ? lead.name || '' : '';
    $('quoteEmail').value = lead ? lead.email || '' : '';
    $('quotePhone').value = lead ? lead.phone || '' : '';
    $('quoteBusiness').value = lead ? lead.businessName || '' : '';
    $('quoteService').value = lead ? lead.serviceName || lead.serviceKey || 'Business consultancy' : '';
    $('quoteValidUntil').value = '';
    $('quoteNotes').value = '';
    $('quoteTerms').value = '';
    $('lineItems').replaceChildren();
    addLineItem(lead ? lead.serviceName || lead.serviceKey || 'Service' : '');
    updateQuoteTotal();
    $('quoteDialog').showModal();
  }

  function addLineItem(service) {
    var row = document.createElement('div');
    row.className = 'line-item';
    row.innerHTML = '<input class="item-service" maxlength="100" aria-label="Line item service" placeholder="Service" required>' +
      '<input class="item-description" maxlength="240" aria-label="Line item description" placeholder="Description / scope" required>' +
      '<input class="item-quantity" type="number" min="1" max="1000" step="1" value="1" aria-label="Quantity" required>' +
      '<input class="item-price" type="number" min="0" max="100000000" step="0.01" value="0" aria-label="Unit price in rupees" required>' +
      '<button class="remove-line" type="button" aria-label="Remove line item">×</button>';
    row.querySelector('.item-service').value = service || '';
    row.querySelector('.item-description').value = service || '';
    row.querySelectorAll('input').forEach(function (input) { input.addEventListener('input', updateQuoteTotal); });
    row.querySelector('.remove-line').addEventListener('click', function () {
      if ($('lineItems').children.length <= 1) {
        alertUser('A quotation must contain at least one service line.', false);
        return;
      }
      row.remove();
      updateQuoteTotal();
    });
    $('lineItems').appendChild(row);
  }

  function updateQuoteTotal() {
    var total = Array.from(document.querySelectorAll('.line-item')).reduce(function (sum, row) {
      var quantity = Number(row.querySelector('.item-quantity').value || 0);
      var price = Number(row.querySelector('.item-price').value || 0);
      return sum + quantity * price;
    }, 0);
    $('quoteTotal').textContent = money(total);
  }

  function collectQuote() {
    var lineItems = Array.from(document.querySelectorAll('.line-item')).map(function (row) {
      return {
        service: row.querySelector('.item-service').value.trim(),
        description: row.querySelector('.item-description').value.trim(),
        quantity: Number(row.querySelector('.item-quantity').value),
        unitPrice: Number(row.querySelector('.item-price').value)
      };
    });
    return {
      leadId: $('quoteLeadId').value,
      customerName: $('quoteCustomerName').value.trim(),
      email: $('quoteEmail').value.trim(),
      phone: $('quotePhone').value.trim(),
      businessName: $('quoteBusiness').value.trim(),
      service: $('quoteService').value.trim(),
      lineItems: lineItems,
      validUntil: $('quoteValidUntil').value,
      notes: $('quoteNotes').value.trim(),
      terms: $('quoteTerms').value.trim()
    };
  }

  async function saveQuote(event) {
    event.preventDefault();
    var button = $('saveQuoteBtn');
    button.disabled = true;
    try {
      var result = await api({action: 'adminCreateQuote', quote: collectQuote()});
      $('quoteDialog').close();
      alertUser('Quotation ' + result.quoteId + ' saved as a draft. Use Email quote to send it to the customer.', true);
      await loadDashboard();
    } catch (error) {
      alertUser(error.message, false);
    } finally {
      button.disabled = false;
    }
  }

  async function runQuoteAction(action, quoteId) {
    var isSend = action === 'adminSendQuote';
    var confirmation = isSend ? 'Email this quotation to the customer?' : 'Email a UPI payment request for this quotation?';
    if (!window.confirm(confirmation)) return;
    try {
      var result = await api({action: action, quoteId: quoteId});
      alertUser(isSend ? 'Quotation emailed to the customer.' : 'Payment request emailed. Order reference: ' + result.orderId, true);
      await loadDashboard();
    } catch (error) {
      alertUser(error.message, false);
    }
  }

  async function approveLead(leadId) {
    try {
      await api({action: 'adminUpdateLead', leadId: leadId, status: 'APPROVED'});
      alertUser('Customer request approved.', true);
      await loadDashboard();
    } catch (error) {
      alertUser(error.message, false);
    }
  }

  function openVerify(order) {
    state.verifyOrderId = order.orderId;
    $('verifyForm').reset();
    $('verifyOrderSummary').textContent = order.customerName + ' · ' + order.orderId + ' · ' + money(order.amount);
    $('verifyDialog').showModal();
  }

  async function verifyPayment(event) {
    event.preventDefault();
    var button = $('confirmPaymentBtn');
    button.disabled = true;
    try {
      var result = await api({
        action: 'adminVerifyQuotePayment',
        orderId: state.verifyOrderId,
        paymentReference: $('verifyReference').value.trim(),
        confirmed: $('confirmBankCredit').checked
      });
      $('verifyDialog').close();
      alertUser(result.message || 'Payment recorded as verified.' + (result.receiptSent === false ? ' Receipt email could not be sent.' : ''), result.receiptSent !== false);
      await loadDashboard();
    } catch (error) {
      alertUser(error.message, false);
    } finally {
      button.disabled = false;
    }
  }

  function downloadCsv(kind) {
    var rows = state.dashboard[kind] || [];
    if (!rows.length) {
      alertUser('There are no ' + kind + ' to export.', false);
      return;
    }
    var columns = kind === 'leads'
      ? [['Case ID', 'caseId'], ['Submitted', 'submittedAt'], ['Name', 'name'], ['Email', 'email'], ['Phone', 'phone'], ['Business', 'businessName'], ['Service', 'serviceName'], ['Details', 'details'], ['Status', 'status']]
      : kind === 'quotes'
        ? [['Quote ID', 'quoteId'], ['Created', 'createdAt'], ['Lead ID', 'leadId'], ['Customer', 'customerName'], ['Email', 'email'], ['Service', 'service'], ['Line items', 'lineItems'], ['Total', 'subtotal'], ['Status', 'status'], ['Order ID', 'orderId']]
        : [['Order ID', 'orderId'], ['Created', 'createdAt'], ['Customer', 'customerName'], ['Email', 'email'], ['Service', 'serviceType'], ['Plan / quote', 'planName'], ['Amount', 'amount'], ['Status', 'status'], ['UTR', 'utr'], ['Proof URL', 'proofUrl']];
    function cell(value) {
      var text = Array.isArray(value) ? value.map(function (item) { return item.service + ': ' + item.description + ' x' + item.quantity + ' @ ' + item.unitPrice; }).join('; ') : String(value == null ? '' : value);
      if (/^[\s]*[=+\-@]/.test(text)) text = "'" + text;
      return '"' + text.replace(/"/g, '""') + '"';
    }
    var csv = [columns.map(function (column) { return cell(column[0]); }).join(',')]
      .concat(rows.map(function (row) {
        return columns.map(function (column) { return cell(row[column[1]]); }).join(',');
      })).join('\r\n');
    var url = URL.createObjectURL(new Blob(['\ufeff' + csv], {type: 'text/csv;charset=utf-8'}));
    var link = document.createElement('a');
    link.href = url;
    link.download = 'onnmore-' + kind + '-' + new Date().toISOString().slice(0, 10) + '.csv';
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  document.querySelectorAll('.tab').forEach(function (tab) {
    tab.addEventListener('click', function () {
      document.querySelectorAll('.tab').forEach(function (other) {
        var active = other === tab;
        other.classList.toggle('active', active);
        other.setAttribute('aria-selected', String(active));
      });
      document.querySelectorAll('[role="tabpanel"]').forEach(function (panel) {
        panel.hidden = panel.id !== tab.dataset.panel;
      });
    });
  });

  $('refreshBtn').addEventListener('click', loadDashboard);
  $('signOutBtn').addEventListener('click', signOut);
  $('newQuoteBtn').addEventListener('click', function () { openQuote(null); });
  $('addLineItemBtn').addEventListener('click', function () { addLineItem(''); });
  $('quoteForm').addEventListener('submit', saveQuote);
  $('verifyForm').addEventListener('submit', verifyPayment);
  $('closeQuoteBtn').addEventListener('click', function () { $('quoteDialog').close(); });
  $('cancelQuoteBtn').addEventListener('click', function () { $('quoteDialog').close(); });
  $('closeVerifyBtn').addEventListener('click', function () { $('verifyDialog').close(); });
  $('cancelVerifyBtn').addEventListener('click', function () { $('verifyDialog').close(); });
  document.querySelectorAll('.export-btn').forEach(function (button) {
    button.addEventListener('click', function () { downloadCsv(button.dataset.export); });
  });

  document.addEventListener('change', async function (event) {
    var select = event.target.closest('[data-lead-status]');
    if (!select) return;
    select.disabled = true;
    try {
      await api({action: 'adminUpdateLead', leadId: select.dataset.leadStatus, status: select.value});
      alertUser('Enquiry status updated.', true);
      await loadDashboard();
    } catch (error) {
      alertUser(error.message, false);
      await loadDashboard();
    } finally {
      select.disabled = false;
    }
  });

  document.addEventListener('click', function (event) {
    var button = event.target.closest('[data-action]');
    if (!button) return;
    var id = button.dataset.id;
    if (button.dataset.action === 'quote-lead') {
      var lead = state.dashboard.leads.find(function (item) { return item.caseId === id; });
      openQuote(lead || null);
    } else if (button.dataset.action === 'approve-lead') {
      approveLead(id);
    } else if (button.dataset.action === 'send-quote') {
      runQuoteAction('adminSendQuote', id);
    } else if (button.dataset.action === 'request-payment') {
      runQuoteAction('adminRequestQuotePayment', id);
    } else if (button.dataset.action === 'verify-payment') {
      var order = state.dashboard.orders.find(function (item) { return item.orderId === id; });
      if (order) openVerify(order);
    }
  });

  initializeSignIn();
})();
