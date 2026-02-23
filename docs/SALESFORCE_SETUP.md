# Salesforce Integration Setup

This project supports Salesforce integration to automatically grant or block Trust Center organization access based on Salesforce account status.

## Integration Method

Use **Salesforce OAuth 2.0 (Connected App)**.

This is preferred over API key patterns because it provides secure delegated authorization and refresh tokens for long-lived server integrations.

## 1. Create a Salesforce Connected App

In Salesforce:
1. Go to `Setup -> App Manager -> New Connected App`
2. Enable OAuth settings
3. Set callback URL to:
   - local: `http://localhost:4000/api/admin/integrations/salesforce/callback`
   - production: `https://<your-backend-domain>/api/admin/integrations/salesforce/callback`
4. Add scopes:
   - `api`
   - `refresh_token`
5. Save and copy:
   - Consumer Key (`SALESFORCE_CLIENT_ID`)
   - Consumer Secret (`SALESFORCE_CLIENT_SECRET`)

## 2. Configure from Admin UI (Recommended)

After the backend is running, open:

- `Admin -> Integrations -> Salesforce Credentials`

Set:
- Client ID
- Client Secret
- Redirect URI
- Auth Base URL (`https://login.salesforce.com` or `https://test.salesforce.com`)
- API version and mapping fields

Save once; the project stores these values server-side for the integration.

## 3. Optional Environment Variables (Fallback)

You can still set backend environment variables if preferred:

```env
SALESFORCE_CLIENT_ID=...
SALESFORCE_CLIENT_SECRET=...
SALESFORCE_REDIRECT_URI=http://localhost:4000/api/admin/integrations/salesforce/callback
SALESFORCE_AUTH_BASE_URL=https://login.salesforce.com
SALESFORCE_API_VERSION=v59.0

SALESFORCE_STATUS_FIELD=Type
SALESFORCE_ALLOWED_STATUSES=Customer,Active Customer
SALESFORCE_DOMAIN_FIELD=Website
```

Notes:
- Use `https://test.salesforce.com` for sandbox auth.
- `SALESFORCE_STATUS_FIELD` can be a custom field, e.g. `Customer_Status__c`.
- `SALESFORCE_DOMAIN_FIELD` can be a custom domain field, e.g. `Domain__c`.

## 4. Connect from Admin API

1. Get authorization URL:
   - `GET /api/admin/integrations/salesforce/connect-url`
2. Open returned `authorizeUrl` in browser and approve access
3. Callback endpoint stores tokens:
   - `GET /api/admin/integrations/salesforce/callback`

## 5. Run Sync

Trigger customer sync:

- `POST /api/admin/integrations/salesforce/sync`

The sync:
- pulls Salesforce Accounts + Contacts
- extracts organization domains
- maps status to Trust Center organization status
  - allowed statuses -> `whitelisted`
  - others -> `no_access`

## 6. Operational Endpoints

- `GET /api/admin/integrations/salesforce/status`
- `POST /api/admin/integrations/salesforce/disconnect`

## Security Notes

- Keep OAuth secrets out of source control.
- Rotate connected app secret periodically.
- Restrict admin route access behind secure auth/session controls.
