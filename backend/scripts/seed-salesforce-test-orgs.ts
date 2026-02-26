import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || 'http://supabase-kong:8000';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || '';
if (!supabaseServiceKey) {
  throw new Error('SUPABASE_SERVICE_KEY is required');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
  global: { headers: { apikey: supabaseServiceKey } },
});

type SalesforceConnection = {
  id: string;
  instance_url: string;
  access_token: string;
  token_type?: string;
};

type IntegrationSettings = {
  config?: Record<string, any>;
};

function makeSeedDomain(index: number): string {
  const suffix = String(index).padStart(2, '0');
  return `tcseed${suffix}co.com`;
}

async function main() {
  const countArg = process.argv.find((a) => a.startsWith('--count='));
  const count = Math.max(1, Math.min(50, Number(countArg?.split('=')[1] || '10') || 10));
  const prefix = (process.argv.find((a) => a.startsWith('--prefix='))?.split('=')[1] || 'TC Seed').trim();
  const fixExistingPrefix = (process.argv.find((a) => a.startsWith('--fix-existing-prefix='))?.split('=')[1] || '').trim();

  const { data: connection, error: connErr } = await supabase
    .from('salesforce_connections')
    .select('id, instance_url, access_token, token_type')
    .eq('is_active', true)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (connErr) throw new Error(`Failed to load active Salesforce connection: ${connErr.message}`);
  if (!connection) throw new Error('No active Salesforce connection found. Connect Salesforce first.');

  const { data: settings } = await supabase
    .from('integration_settings')
    .select('config')
    .eq('provider', 'salesforce')
    .maybeSingle();

  const cfg = ((settings as IntegrationSettings | null)?.config || {}) as Record<string, any>;
  const apiVersion = String(cfg.api_version || process.env.SALESFORCE_API_VERSION || 'v59.0');
  const statusField = String(cfg.status_field || process.env.SALESFORCE_STATUS_FIELD || 'Type');
  const allowedStatuses = String(cfg.allowed_statuses || process.env.SALESFORCE_ALLOWED_STATUSES || 'Customer - Direct,Customer,Active Customer')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const preferredStatus = allowedStatuses[0] || 'Customer - Direct';

  console.log(`Using Salesforce instance: ${connection.instance_url}`);
  console.log(`API version: ${apiVersion}`);
  console.log(`Status field config: ${statusField}`);
  console.log(`Preferred allowed status: ${preferredStatus}`);

  if (fixExistingPrefix) {
    await fixExistingSeedRecords(connection as SalesforceConnection, apiVersion, fixExistingPrefix);
    return;
  }

  for (let i = 1; i <= count; i += 1) {
    const suffix = String(i).padStart(2, '0');
    const orgName = `${prefix} ${suffix}`;
    const domain = makeSeedDomain(i);
    const accountPayload: Record<string, any> = {
      Name: orgName,
      Website: `https://${domain}`,
    };

    if (statusField === 'Type') {
      accountPayload.Type = preferredStatus;
    }

    let accountId: string | null = null;
    try {
      const accountResp = await sfPost(connection as SalesforceConnection, apiVersion, '/sobjects/Account', accountPayload) as any;
      accountId = String(accountResp.id || '');
    } catch (error: any) {
      // If picklist value/type causes a failure, retry without status field so seeding can still proceed.
      if (statusField === 'Type') {
        delete accountPayload.Type;
        const accountResp = await sfPost(connection as SalesforceConnection, apiVersion, '/sobjects/Account', accountPayload) as any;
        accountId = String(accountResp.id || '');
        console.warn(`[${suffix}] Account created without Type due to status value error`);
      } else {
        throw error;
      }
    }

    if (!accountId) throw new Error(`Failed to create Account for ${orgName}`);

    const contactPayload = {
      FirstName: 'Test',
      LastName: `User ${suffix}`,
      Email: `tester+${suffix}@${domain}`,
      AccountId: accountId,
    };
    const contactResp = await sfPost(connection as SalesforceConnection, apiVersion, '/sobjects/Contact', contactPayload) as any;

    console.log(`[${suffix}] Account ${accountId} | Contact ${contactResp.id} | ${contactPayload.Email}`);
  }

  console.log(`Created ${count} test Salesforce Accounts + Contacts.`);
}

async function fixExistingSeedRecords(connection: SalesforceConnection, apiVersion: string, prefix: string) {
  const soql = `SELECT Id, Name FROM Account WHERE Name LIKE '${prefix.replace(/'/g, "\\'")}%' ORDER BY Name`;
  const accountQuery = await sfGet(connection, apiVersion, `/query?q=${encodeURIComponent(soql)}`);
  const accounts = Array.isArray(accountQuery?.records) ? accountQuery.records : [];

  if (accounts.length === 0) {
    console.log(`No Accounts found matching prefix "${prefix}"`);
    return;
  }

  console.log(`Found ${accounts.length} accounts matching "${prefix}"`);

  let idx = 0;
  for (const account of accounts) {
    idx += 1;
    const suffix = String(idx).padStart(2, '0');
    const nextDomain = makeSeedDomain(idx);
    const nextName = `${prefix} ${suffix}`;

    await sfPatch(connection, apiVersion, `/sobjects/Account/${account.Id}`, {
      Name: nextName,
      Website: `https://${nextDomain}`,
    });

    const contactSoql = `SELECT Id, Email FROM Contact WHERE AccountId = '${String(account.Id).replace(/'/g, "\\'")}' ORDER BY CreatedDate`;
    const contactQuery = await sfGet(connection, apiVersion, `/query?q=${encodeURIComponent(contactSoql)}`);
    const contacts = Array.isArray(contactQuery?.records) ? contactQuery.records : [];

    let contactIdx = 0;
    for (const contact of contacts) {
      contactIdx += 1;
      const email = contactIdx === 1
        ? `tester+${suffix}@${nextDomain}`
        : `tester+${suffix}-${contactIdx}@${nextDomain}`;
      await sfPatch(connection, apiVersion, `/sobjects/Contact/${contact.Id}`, { Email: email });
      console.log(`[${suffix}] Updated Contact ${contact.Id} -> ${email}`);
    }

    console.log(`[${suffix}] Updated Account ${account.Id} -> ${nextName} (${nextDomain})`);
  }

  console.log(`Updated ${accounts.length} seeded account(s) to unique full domains.`);
}

async function sfPost(connection: SalesforceConnection, apiVersion: string, path: string, body: Record<string, any>) {
  const url = `${connection.instance_url}/services/data/${apiVersion}${path}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `${connection.token_type || 'Bearer'} ${connection.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const payload: any = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = Array.isArray(payload)
      ? payload.map((p: any) => p?.message).filter(Boolean).join('; ')
      : payload?.message || payload?.error_description || payload?.error;
    throw new Error(`Salesforce POST ${path} failed (${res.status}): ${msg || 'unknown error'}`);
  }
  return payload;
}

async function sfPatch(connection: SalesforceConnection, apiVersion: string, path: string, body: Record<string, any>) {
  const url = `${connection.instance_url}/services/data/${apiVersion}${path}`;
  const res = await fetch(url, {
    method: 'PATCH',
    headers: {
      Authorization: `${connection.token_type || 'Bearer'} ${connection.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (res.ok) return;
  const payload: any = await res.json().catch(() => ({}));
  const msg = Array.isArray(payload)
    ? payload.map((p: any) => p?.message).filter(Boolean).join('; ')
    : payload?.message || payload?.error_description || payload?.error;
  throw new Error(`Salesforce PATCH ${path} failed (${res.status}): ${msg || 'unknown error'}`);
}

async function sfGet(connection: SalesforceConnection, apiVersion: string, path: string) {
  const url = `${connection.instance_url}/services/data/${apiVersion}${path}`;
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `${connection.token_type || 'Bearer'} ${connection.access_token}`,
      'Content-Type': 'application/json',
    },
  });
  const payload: any = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = Array.isArray(payload)
      ? payload.map((p: any) => p?.message).filter(Boolean).join('; ')
      : payload?.message || payload?.error_description || payload?.error;
    throw new Error(`Salesforce GET ${path} failed (${res.status}): ${msg || 'unknown error'}`);
  }
  return payload;
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
