/**
 * Admin access to the existing Customer Portal Customers and Applications tabs.
 * Add this file to the Apps Script project bound to ONNMORE Customer Portal.
 */
function handleAdminPortalRequest_(body) {
  const action = String(body && body.action || '');
  if (action !== 'adminPortalDashboard' && action !== 'adminPortalUpdateApplication') {
    return {ok:false, error:'Unsupported portal admin request.'};
  }
  try {
    authorizePortalAdmin_(body.token);
    if (action === 'adminPortalDashboard') return getPortalAdminDashboard_();
    return updatePortalAdminApplication_(body.referenceNumber, body.status);
  } catch (err) {
    const message = String(err && err.message || '');
    const safeErrors = [
      'Admin access is not configured.',
      'Please sign in again.',
      'Your admin sign-in has expired. Please sign in again.',
      'Admin sign-in could not be verified.',
      'This Google account is not authorized to use the admin page.',
      'Application not found.',
      'Choose a valid application status.'
    ];
    if (safeErrors.indexOf(message) >= 0) return {ok:false, error:message};
    console.error('Portal admin request failed (' + action + '): ' + err);
    return {ok:false, error:'The portal admin request failed. Check the Apps Script execution log.'};
  }
}

function authorizePortalAdmin_(token) {
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
  if (issuer !== 'accounts.google.com' && issuer !== 'https://accounts.google.com') {
    throw new Error('Admin sign-in could not be verified.');
  }
  if (String(claims.aud || '') !== clientId || String(claims.email_verified || '') !== 'true' || allowlist.indexOf(email) < 0) {
    throw new Error('This Google account is not authorized to use the admin page.');
  }
}

function getPortalAdminDashboard_() {
  const customerRows = sheetToObjects(getSheet(CONFIG.SHEET_CUSTOMERS));
  const customerById = Object.create(null);
  const customers = customerRows.map(function (row) {
    const customer = {
      customerId:String(row.CustomerID || ''),
      name:portalAdminText_(row.Name),
      email:portalAdminText_(row.Email),
      phone:portalAdminText_(row.Phone),
      businessName:portalAdminText_(row.BusinessName),
      createdAt:portalAdminDate_(row.CreatedAt || row.CreatedOn || row.RegisteredAt)
    };
    if (customer.customerId) customerById[customer.customerId] = customer;
    return customer;
  }).filter(function (customer) { return customer.customerId || customer.email; });

  const applications = sheetToObjects(getSheet(CONFIG.SHEET_APPLICATIONS)).map(function (row) {
    const customerId = String(row.CustomerID || '');
    const customer = customerById[customerId] || {};
    return {
      caseId:portalAdminText_(row.ReferenceNumber),
      customerId:customerId,
      name:customer.name || '',
      email:customer.email || '',
      phone:customer.phone || '',
      businessName:customer.businessName || '',
      serviceKey:portalAdminText_(row.ServiceKey),
      serviceName:portalAdminText_(row.ServiceName),
      status:portalAdminText_(row.Status) || 'Submitted',
      details:portalAdminText_(row.Details || row.Notes),
      submittedAt:portalAdminDate_(row.SubmittedAt),
      updatedAt:portalAdminDate_(row.LastUpdatedAt),
      source:'Customer portal'
    };
  }).filter(function (application) { return application.caseId; })
    .sort(function (a, b) { return portalAdminTimestamp_(b.submittedAt) - portalAdminTimestamp_(a.submittedAt); });

  const applicationCounts = {};
  applications.forEach(function (application) {
    applicationCounts[application.customerId] = (applicationCounts[application.customerId] || 0) + 1;
  });
  customers.forEach(function (customer) {
    customer.applicationCount = applicationCounts[customer.customerId] || 0;
  });
  customers.sort(function (a, b) { return a.name.localeCompare(b.name) || a.email.localeCompare(b.email); });

  return {ok:true, customers:customers.slice(0, 1000), applications:applications.slice(0, 1000)};
}

function updatePortalAdminApplication_(referenceNumber, status) {
  const allowed = ['Submitted', 'Approved', 'In Progress', 'Completed', 'Rejected'];
  const nextStatus = String(status || '');
  if (allowed.indexOf(nextStatus) < 0) return {ok:false, error:'Choose a valid application status.'};
  const reference = String(referenceNumber || '').trim();
  if (!reference) return {ok:false, error:'Application not found.'};
  const sheet = getSheet(CONFIG.SHEET_APPLICATIONS);
  const found = findRowByValue(sheet, 'ReferenceNumber', reference);
  if (!found) return {ok:false, error:'Application not found.'};
  setCell(sheet, found.rowNumber, found.headers, 'Status', nextStatus);
  if (found.headers.indexOf('LastUpdatedAt') >= 0) {
    setCell(sheet, found.rowNumber, found.headers, 'LastUpdatedAt', new Date());
  }
  return {ok:true, referenceNumber:reference, status:nextStatus};
}

function portalAdminText_(value) {
  return value == null ? '' : String(value);
}

function portalAdminDate_(value) {
  return value instanceof Date ? value.toISOString() : value || '';
}

function portalAdminTimestamp_(value) {
  const timestamp = new Date(value || 0).getTime();
  return Number.isFinite(timestamp) ? timestamp : 0;
}
