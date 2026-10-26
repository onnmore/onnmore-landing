# Admin workspace setup

The admin page is `admin.html`. Existing customer profiles and service
applications are stored in the separate Google Apps Script project bound to
the **ONNMORE Customer Portal** spreadsheet. The add-on
`apps-script/PortalAdmin.gs` reads the `Customers` and `Applications` tabs and
lets authorized admins update application status. It does not expose OTPs or
customer session tokens.

Quotations and UPI orders are managed separately by the plan-checkout Apps
Script project using `apps-script/Admin.gs`. The two Apps Script projects must
both be configured to use the same Google OAuth client ID and admin email
allowlist.

## 1. Configure Google sign-in

1. In Google Cloud Console, create a **Web application** OAuth client ID.
   Add `https://onnmore.space` as an authorized JavaScript origin (and add
   `https://www.onnmore.space` only if the site is served from that origin).
2. Set `window.ONNMORE_ADMIN_GOOGLE_CLIENT_ID` in `assets/admin-config.js` to
   that client ID. The client ID is public; do not put a client secret in the
   website.
3. In **both** Apps Script projects, open **Project Settings → Script
   Properties** and set:
   - `ADMIN_GOOGLE_CLIENT_ID`: the same OAuth client ID.
   - `ADMIN_EMAILS`: comma-separated Google account email addresses permitted
     to view customer data and administer requests.

Each Apps Script add-on verifies the Google ID token, its audience and email
allowlist server-side. The page's `noindex` metadata is not access control.

## 2. Connect existing customer and application records

1. Open the Apps Script project bound to the **ONNMORE Customer Portal**
   spreadsheet—the project whose existing `doPost(e)` handles actions such as
   `submitPublicLead`, `getApplications` and `verifyOtp`.
2. Add a new script file named `PortalAdmin` and paste in the full contents of
   `apps-script/PortalAdmin.gs`. Do not replace the existing portal code.
3. In that project's existing `doPost(e)`, add the following cases inside its
   existing `switch (action)`, before `default`:

   ```javascript
   case 'adminPortalDashboard':
   case 'adminPortalUpdateApplication':
     result = handleAdminPortalRequest_(body);
     break;
   ```

   The existing `jsonResponse(result)` should remain in place. The front-end
   uses the portal Web App URL already present in `assets/admin-config.js`.
4. Save, authorize the requested services, then open **Deploy → Manage
   deployments**, edit the existing portal Web App, select **New version** and
   deploy. Keep its existing URL and its current access setting so the customer
   portal continues working.
5. Confirm the attached spreadsheet has the `Customers` and `Applications`
   tabs and that `Applications` has the columns already used by the portal:
   `ReferenceNumber`, `CustomerID`, `ServiceKey`, `ServiceName`, `Status`,
   `Notes`, `SubmittedAt`, and `LastUpdatedAt`.

The **Customers** tab in the admin reads customer profile fields from
`Customers`; **Enquiries** reads and updates request records in `Applications`.
Approving a request changes its `Status` to `Approved`, which the existing
customer portal can display.

## 3. Connect quotations and payments (optional)

To use the separate Quotations and Payments tabs, add `apps-script/Admin.gs`
to the existing plan-checkout Apps Script project, route its admin actions
through that project's `doPost` dispatcher, and deploy a new version while
keeping its URL. Follow the checkout add-on's helper/deployment requirements;
it depends on the checkout project's existing order functions and spreadsheet.
The checkout project also needs the same `ADMIN_GOOGLE_CLIENT_ID` and
`ADMIN_EMAILS` Script Properties.

## 4. Web3Forms history

The admin can show customer profiles and applications that are already in the
portal spreadsheet. It cannot retrieve old submissions directly from a
Web3Forms inbox. Website consultation and service-request forms also send
their requests to the customer portal; older Web3Forms-only submissions must
be exported from the Web3Forms dashboard and imported into the portal sheet if
you want them in this admin.

## 5. Verify the setup

1. Open `https://onnmore.space/admin.html` and sign in with an email in
   `ADMIN_EMAILS`.
2. Refresh the **Customers** and **Enquiries** tabs; compare the rows with the
   `Customers` and `Applications` spreadsheet tabs.
3. Approve a test application and confirm its status changes in the Sheet and
   the customer portal.
4. Only use **Request payment** for an approved quotation. Verify UPI payment
   against the bank statement before recording receipt in the dashboard.

Quotations and payment requests are not GST tax invoices or accounting
software.
