# Salesforce Integration Setup (Trust Center)

This project supports Salesforce integration to automatically control Trust Center organization access based on Salesforce customer status.

Quick links:
- Customer admin onboarding (short guide): `/Users/kutluhanbayram/Desktop/TRUST CENTER/docs/SALESFORCE_ONBOARDING_ADMIN.md`
- Technical setup + troubleshooting (this document)

## What the Integration Does

- Connects to a Salesforce org using OAuth 2.0 (PKCE-supported)
- Pulls Salesforce `Account` and `Contact` records
- Uses an Account status field (for example `Type`) to determine access
- Derives Trust Center organization domains from **related Contact email domains**
- Updates Trust Center organization status:
  - allowed statuses -> `whitelisted`
  - non-allowed statuses -> `no_access`

Important:
- Access assignment is **domain-based**, not per-user provisioning (yet)
- Domains are derived from **Contact emails**, not `Account.Website`

## Recommended Setup Model

- A Salesforce admin performs one-time app setup
- A Trust Center admin configures and connects Salesforce in `Admin -> Integrations`
- End users do not need Salesforce setup access

Best practice:
- Use a dedicated Salesforce integration user with read access to all relevant `Account`/`Contact` records

## 1. Create the Salesforce App (Admin Setup)

Salesforce UI varies by org. You may see either:
- `New Connected App` (older flow), or
- `New External Client App` (newer flow)

### If You See "New External Client App" (common)

1. Go to `Setup -> App Manager`
2. Click `New External Client App`
3. Create an app with:
   - OAuth enabled
   - Callback URL:
     - local: `http://localhost:4000/api/admin/integrations/salesforce/callback`
     - production: `https://<your-backend-domain>/api/admin/integrations/salesforce/callback`
   - Scopes:
     - `api`
     - `refresh_token` / `offline_access`
4. Save and open app details
5. Copy:
   - `Consumer Key` (Client ID)
   - `Consumer Secret` (Client Secret)

Notes:
- External Client Apps often require PKCE. This project supports PKCE.
- Keep client secret enabled for server-side refresh token flow.

### If You See "New Connected App" (legacy flow)

1. Go to `Setup -> App Manager -> New Connected App`
2. Enable OAuth settings
3. Set callback URL (same as above)
4. Add scopes:
   - `api`
   - `refresh_token` / `offline_access`
5. Save and copy:
   - Consumer Key
   - Consumer Secret

## 2. Configure Salesforce in Trust Center (Admin UI)

Open:
- `Admin -> Integrations`

Salesforce is collapsible by default. Expand the Salesforce section and configure:

- `Client ID` = Salesforce `Consumer Key`
- `Client Secret` = Salesforce `Consumer Secret`
- `Redirect URI`
  - local: `http://localhost:4000/api/admin/integrations/salesforce/callback`
- `Auth Base URL`
  - production org: `https://login.salesforce.com`
  - sandbox org: `https://test.salesforce.com`
- `API Version` (example: `v59.0`)
- `Status Field`
  - choose from dropdown (Account fields) or enter custom API name
  - examples: `Type`, `Customer_Status__c`
- `Allowed Statuses`
  - select from dropdown (picklist values) and/or add custom values
  - examples: `Customer - Direct`, `Customer`, `Active Customer`
- `Domain Field`
  - stored for reference/debugging only (current access assignment uses Contact email domains)

Click:
- `Save Salesforce Settings`

## 3. Connect Salesforce (OAuth)

1. In the same Salesforce section, click `Connect Salesforce`
2. Approve access in Salesforce
3. You will be redirected back to:
   - `/admin/integrations?salesforce=connected`

After connect, the Integrations page shows:
- Connected Salesforce user (name / username / user ID)
- Connected Salesforce org (org name / org ID)
- Instance URL

This is the best way to confirm which org/user your app is actually using.

## 4. Validate Sync Mapping (Recommended)

Create test Salesforce data:

1. Create an `Account`
   - Name: any customer name
   - Status field (for example `Type`): one of your allowed statuses (example `Customer - Direct`)
2. Create at least one related `Contact` on that Account
   - Email must use the customer domain you want to grant access for
   - Example: `security@acme.com`

Important:
- If an Account has no related Contact emails with usable domains, it will be skipped.
- Personal email domains may be ignored by normalization rules.

## 5. Run Sync

In `Admin -> Integrations` -> Salesforce:
- Click `Sync Now`

The page shows:

### Last Sync Summary
- `Accounts Processed`: Salesforce `Account` records queried
- `Contacts Queried (Org-wide)`: all `Contact` rows returned by Salesforce query (`Email != NULL`)
- `Contacts Matched to Accounts`: Contacts linked by `AccountId` to processed Accounts
- `Organizations Updated`: Trust Center domain-level updates
- `Organizations Blocked`: orgs set to `no_access`
- `Accounts Skipped (No Domain)`: no usable Contact email domain found

### Salesforce Sync Audit
Per sync run, shows:
- processed Accounts
- status values used
- decision (`whitelisted`, `no_access`, `skipped`)
- matched Contact emails
- derived domains used to update Trust Center organizations

This is the primary debugging view when counts do not match expectations.

## 6. Troubleshooting (Common Issues)

### "missing required code challenge"

Cause:
- Salesforce app requires PKCE but the client flow was not sending it

Status:
- This project supports PKCE now. Retry `Connect Salesforce` with current build.

### "Missing Salesforce config" (`CLIENT_ID`, `CLIENT_SECRET`, `REDIRECT_URI`)

Cause:
- Salesforce credentials not saved in UI or env fallback not configured

Fix:
- Save credentials in `Admin -> Integrations` (recommended), then retry connect

### "permission denied for table integration_settings" / schema cache errors

Cause:
- DB migration/grants not applied or PostgREST schema cache stale

Fix:
- Apply migrations
- Restart `supabase-rest` and `backend`

### Sync count looks wrong (for example, Contacts count higher than expected)

Cause:
- `Contacts Queried (Org-wide)` counts all visible Salesforce Contacts with an email, not just contacts on one account

How to verify:
- Check the `Connected Salesforce User` and `Connected Salesforce Org` panels
- Use `Salesforce Sync Audit` to inspect which Accounts/Contacts were actually used

### You cannot see the same Accounts/Contacts in Salesforce UI

Likely causes:
- wrong Salesforce org (sandbox vs production)
- wrong Salesforce user
- filtered list view (not `All Accounts` / `All Contacts`)
- sharing rules differ from the connected integration user

## 7. Optional Environment Variables (Fallback)

UI configuration is preferred. Environment variables are still supported as fallback:

```env
SALESFORCE_CLIENT_ID=...
SALESFORCE_CLIENT_SECRET=...
SALESFORCE_REDIRECT_URI=http://localhost:4000/api/admin/integrations/salesforce/callback
SALESFORCE_AUTH_BASE_URL=https://login.salesforce.com
SALESFORCE_API_VERSION=v59.0

SALESFORCE_STATUS_FIELD=Type
SALESFORCE_ALLOWED_STATUSES=Customer - Direct,Customer,Active Customer
SALESFORCE_DOMAIN_FIELD=Website
```

Notes:
- `SALESFORCE_DOMAIN_FIELD` is currently retained for compatibility/debugging; access assignment is based on Contact email domains
- Use `https://test.salesforce.com` for sandbox auth

## 8. Useful Admin API Endpoints (Reference)

- `GET /api/admin/integrations/salesforce/status`
- `GET /api/admin/integrations/salesforce/config`
- `PUT /api/admin/integrations/salesforce/config`
- `GET /api/admin/integrations/salesforce/connect-url`
- `GET /api/admin/integrations/salesforce/metadata`
- `GET /api/admin/integrations/salesforce/audit`
- `POST /api/admin/integrations/salesforce/sync`
- `POST /api/admin/integrations/salesforce/disconnect`

## Security Notes

- Keep OAuth secrets out of source control
- Restrict Trust Center admin access
- Use a dedicated Salesforce integration user with least-privilege read access (or org-wide read where appropriate)
- Rotate Salesforce app secrets periodically
