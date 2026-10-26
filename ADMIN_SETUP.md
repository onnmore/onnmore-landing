# Admin workspace setup

The admin page is `admin.html`. It is a static front end; authorization,
customer data, quotations, payment orders and email are handled by the
existing plan-checkout Google Apps Script project and its spreadsheet.
`apps-script/Admin.gs` must be added to that same Apps Script project. Do not
deploy it as a separate project: it uses the checkout project's order helpers
and spreadsheet.

## 1. Configure Google sign-in

1. In Google Cloud Console, create a **Web application** OAuth client ID.
   Add `https://onnmore.space` as an authorized JavaScript origin (and add
   `https://www.onnmore.space` only if the site is served from that origin).
2. Set `window.ONNMORE_ADMIN_GOOGLE_CLIENT_ID` in `assets/admin-config.js` to
   the client ID. This client ID is public; do not put a client secret in this
   repository.
3. In the existing checkout Apps Script project, add Script Properties:
   - `ADMIN_GOOGLE_CLIENT_ID`: the same OAuth client ID.
   - `ADMIN_EMAILS`: comma-separated Google account email addresses permitted
     to administer the site.

The Apps Script verifies each Google ID token and checks its audience,
verified email and allowlist. The page's `noindex` metadata is not access
control; the server-side allowlist is the security boundary.

## 2. Add and route the Apps Script add-on

1. Add the complete `apps-script/Admin.gs` source to the existing plan-checkout
   Apps Script project.
2. In its `doPost` dispatcher, after parsing the incoming JSON object as
   `request`, route the new actions through the project's existing JSON
   response helper. For example, where the dispatcher uses
   `ContentService` directly:

   ```javascript
   if (request.action === 'submitLead' || /^admin[A-Z]/.test(String(request.action || ''))) {
     return ContentService
       .createTextOutput(JSON.stringify(handleAdminRequest_(request)))
       .setMimeType(ContentService.MimeType.JSON);
   }
   ```

   Keep the existing checkout, UPI and payment-proof routes unchanged. Put this
   branch before the dispatcher's unsupported-action fallback. If the project
   already has a JSON response helper, use it instead of creating a second
   response format.
3. Save, authorize the requested Google services, and deploy a new version of
   the existing Web App. Keep its current deployment URL so checkout,
   `assets/checkout-config.js`, and this admin page use the same backend.
   The endpoint must retain the access mode required by the existing public
   checkout and lead forms; admin operations remain protected by the server
   verified Google ID token.

The add-on creates `Leads` and `Quotes` tabs in the same spreadsheet as the
existing `Orders` tab. It does not import historical rows from the separate
customer portal backend. Website forms mirror new enquiries to `Leads`;
the normal email, sheet and portal submissions remain in place.

## 3. Publish and smoke-test

1. Publish the static-site changes to the configured GitHub Pages branch.
2. Open `https://onnmore.space/admin.html` and sign in with an email in
   `ADMIN_EMAILS`. Confirm the Enquiries, Quotations and Payments tabs load.
3. Submit a test enquiry from the website and confirm it appears in the
   `Leads` sheet and dashboard. Create a draft quotation and confirm the email
   and total before sending it to a customer.
4. Only use **Request payment** for a real, approved quotation. The customer
   submits proof through the existing UPI page; an admin must compare the
   transaction with the bank statement and explicitly confirm it in the
   dashboard before the order is marked paid.

Do not mark a custom-quotation order as paid by editing the spreadsheet. Use
the admin verification action so the quotation status and non-tax payment
confirmation email are updated together. The workspace creates quotations and
payment requests only; it is not accounting software and does not issue GST
tax invoices.
