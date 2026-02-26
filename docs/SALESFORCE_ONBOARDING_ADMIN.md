# Salesforce Onboarding (Customer Admin Guide)

This guide is the short version for non-technical admins who want to connect Salesforce to the Trust Center.

Use this if you just want to:
- connect Salesforce
- choose which customer statuses should get access
- run sync and verify it worked

For the full technical guide, use:
- `/Users/kutluhanbayram/Desktop/TRUST CENTER/docs/SALESFORCE_SETUP.md`

## What You Need Before Starting

- Trust Center admin access (`/admin/integrations`)
- Salesforce admin access (or someone who can create an app and provide credentials)
- Salesforce customer records with:
  - an Account status field (often `Type`)
  - related Contacts with customer email addresses

Important:
- Trust Center access is granted by **customer email domain from Salesforce Contacts**
- Example: if a Contact email is `security@acme.com`, the Trust Center organization domain becomes `acme.com`

## Step 1: Create the Salesforce App (one-time)

In Salesforce:
1. Open `Setup`
2. Go to `App Manager`
3. Click:
   - `New External Client App` (common), or
   - `New Connected App` (older orgs)
4. Enable OAuth
5. Use this callback URL (local setup):
   - `http://localhost:4000/api/admin/integrations/salesforce/callback`
6. Add scopes:
   - `api`
   - `refresh_token` / `offline_access`
7. Save

Copy these values from the app:
- `Consumer Key` (this is your Client ID)
- `Consumer Secret` (this is your Client Secret)

## Step 2: Configure Salesforce in the Trust Center

In your Trust Center:
1. Open `Admin -> Integrations`
2. Expand the `Salesforce` section
3. Fill in:
   - `Client ID` = Consumer Key
   - `Client Secret` = Consumer Secret
   - `Redirect URI` = `http://localhost:4000/api/admin/integrations/salesforce/callback`
   - `Auth Base URL`
     - Production Salesforce: `https://login.salesforce.com`
     - Sandbox: `https://test.salesforce.com`
   - `Status Field` (usually `Type`)
   - `Allowed Statuses` (select the statuses that should get access, for example `Customer - Direct`)
4. Click `Save Salesforce Settings`

## Step 3: Connect Salesforce

1. Click `Connect Salesforce`
2. Approve access in Salesforce
3. You should return to the Integrations page

After connect, check the Salesforce section:
- `Connected Salesforce User`
- `Connected Salesforce Org`

This confirms which Salesforce account/org the Trust Center is using.

## Step 4: Test with Real or Test Customers

In Salesforce, create or use customer data:
1. Create an `Account`
2. Set the Account status field (example `Type`) to one of your allowed values
3. Add at least one related `Contact` with the customer email domain
   - Example: `alice@customerco.com`

## Step 5: Run Sync

Back in `Admin -> Integrations`:
1. Click `Sync Now`

Check:
- `Last Sync Summary`
- `Salesforce Sync Audit`

What to look for:
- The Account appears in the audit
- The related Contact email is shown
- The derived domain matches the customer email domain
- The decision is `whitelisted` (if the status is allowed)

## If Something Looks Wrong

### “I don’t recognize these Accounts/Contacts”

Check on the Integrations page:
- `Connected Salesforce User`
- `Connected Salesforce Org`

You may be looking at a different Salesforce org/user in your browser.

### “Counts look too high”

`Contacts Queried (Org-wide)` counts all Salesforce Contacts with email that the connected Salesforce user can see.

This number can be higher than the number of Accounts you are testing.

### “Account did not create an organization”

Usually one of these:
- No related Contact email on the Account
- Contact email uses a personal domain
- Account status is not in `Allowed Statuses`

## Recommended Ongoing Setup

- Use a dedicated Salesforce integration user
- Make sure that user can read all customer Accounts and Contacts
- Use the Sync Audit to verify changes before relying on automation
