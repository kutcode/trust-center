import crypto from 'crypto';
import { supabase } from '../server';
import { getOrCreateOrganization, isPersonalEmailDomain } from '../utils/organization';

export interface SalesforceConnection {
  id: string;
  instance_url: string;
  access_token: string;
  refresh_token: string;
  token_type: string;
  scope?: string;
  connected_by?: string;
  is_active: boolean;
  last_synced_at?: string;
}

interface SalesforceTokenResponse {
  access_token: string;
  refresh_token?: string;
  instance_url: string;
  token_type: string;
  scope?: string;
}

export interface SalesforceAccountFieldMetadata {
  name: string;
  label: string;
  type: string;
  picklistValues: string[];
}

interface SalesforceConfigRecord {
  id: string;
  provider: string;
  config: Record<string, any>;
  updated_at?: string;
}

export interface SalesforceAdminConfig {
  clientId: string;
  clientSecretConfigured: boolean;
  redirectUri: string;
  authBaseUrl: string;
  apiVersion: string;
  statusField: string;
  allowedStatuses: string;
  domainField: string;
  configuredSource: 'database' | 'environment';
  updatedAt: string | null;
}

export interface SalesforceAdminSecret {
  clientSecret: string;
  source: 'database' | 'environment';
}

interface SalesforceResolvedConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  authBaseUrl: string;
  apiVersion: string;
  statusField: string;
  allowedStatuses: string;
  domainField: string;
}

interface SalesforceConfigInput {
  clientId: string;
  clientSecret?: string;
  redirectUri: string;
  authBaseUrl?: string;
  apiVersion?: string;
  statusField?: string;
  allowedStatuses?: string;
  domainField?: string;
}

const ENC_PREFIX = 'enc:v1:';
const SALESFORCE_PKCE_TTL_MS = 15 * 60 * 1000;
const pkceVerifierStore = new Map<string, { verifier: string; expiresAt: number }>();

function getSecretCipherKey(): Buffer {
  const base = process.env.JWT_SECRET || 'salesforce-state-secret';
  return crypto.createHash('sha256').update(base).digest();
}

function sha256Base64Url(value: string): string {
  return crypto.createHash('sha256').update(value).digest('base64url');
}

function generatePkceVerifier(): string {
  // RFC 7636 verifier length: 43-128 chars. 64 bytes base64url gives a compliant verifier.
  return crypto.randomBytes(64).toString('base64url');
}

function cleanupExpiredPkceVerifiers() {
  const now = Date.now();
  for (const [key, value] of pkceVerifierStore.entries()) {
    if (value.expiresAt <= now) {
      pkceVerifierStore.delete(key);
    }
  }
}

export function createSalesforcePkceChallenge(state: string): { codeChallenge: string; codeChallengeMethod: 'S256' } {
  cleanupExpiredPkceVerifiers();
  const verifier = generatePkceVerifier();
  pkceVerifierStore.set(state, {
    verifier,
    expiresAt: Date.now() + SALESFORCE_PKCE_TTL_MS,
  });
  return {
    codeChallenge: sha256Base64Url(verifier),
    codeChallengeMethod: 'S256',
  };
}

export function consumeSalesforcePkceVerifier(state: string): string | null {
  cleanupExpiredPkceVerifiers();
  const entry = pkceVerifierStore.get(state);
  if (!entry) return null;
  pkceVerifierStore.delete(state);
  if (entry.expiresAt <= Date.now()) return null;
  return entry.verifier;
}

function encryptSecret(value: string): string {
  const iv = crypto.randomBytes(12);
  const key = getSecretCipherKey();
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${ENC_PREFIX}${iv.toString('base64url')}.${tag.toString('base64url')}.${encrypted.toString('base64url')}`;
}

function decryptSecret(value: string): string {
  if (!value) return '';
  if (!value.startsWith(ENC_PREFIX)) {
    return value;
  }

  const encoded = value.slice(ENC_PREFIX.length);
  const [ivB64, tagB64, cipherB64] = encoded.split('.');
  if (!ivB64 || !tagB64 || !cipherB64) {
    throw new Error('Stored Salesforce secret is malformed');
  }

  const key = getSecretCipherKey();
  const iv = Buffer.from(ivB64, 'base64url');
  const tag = Buffer.from(tagB64, 'base64url');
  const encrypted = Buffer.from(cipherB64, 'base64url');
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return decrypted.toString('utf8');
}

async function getStoredSalesforceConfig(): Promise<SalesforceConfigRecord | null> {
  const { data, error } = await supabase
    .from('integration_settings')
    .select('*')
    .eq('provider', 'salesforce')
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load Salesforce integration config: ${error.message}`);
  }

  return (data as SalesforceConfigRecord | null) || null;
}

function getEnvSalesforceConfig() {
  return {
    clientId: process.env.SALESFORCE_CLIENT_ID || '',
    clientSecret: process.env.SALESFORCE_CLIENT_SECRET || '',
    redirectUri: process.env.SALESFORCE_REDIRECT_URI || '',
    authBaseUrl: process.env.SALESFORCE_AUTH_BASE_URL || 'https://login.salesforce.com',
    apiVersion: process.env.SALESFORCE_API_VERSION || 'v59.0',
    statusField: process.env.SALESFORCE_STATUS_FIELD || 'Type',
    allowedStatuses: process.env.SALESFORCE_ALLOWED_STATUSES || 'Customer,Active Customer',
    domainField: process.env.SALESFORCE_DOMAIN_FIELD || 'Website',
  };
}

async function getResolvedSalesforceConfig(): Promise<SalesforceResolvedConfig> {
  const envConfig = getEnvSalesforceConfig();
  const stored = await getStoredSalesforceConfig();
  const storedConfig = stored?.config || {};

  const clientId = String(storedConfig.client_id || envConfig.clientId || '');
  const redirectUri = String(storedConfig.redirect_uri || envConfig.redirectUri || '');
  const authBaseUrl = String(storedConfig.auth_base_url || envConfig.authBaseUrl || 'https://login.salesforce.com');
  const apiVersion = String(storedConfig.api_version || envConfig.apiVersion || 'v59.0');
  const statusField = String(storedConfig.status_field || envConfig.statusField || 'Type');
  const allowedStatuses = String(storedConfig.allowed_statuses || envConfig.allowedStatuses || 'Customer,Active Customer');
  const domainField = String(storedConfig.domain_field || envConfig.domainField || 'Website');

  const storedSecret = storedConfig.client_secret_encrypted ? decryptSecret(String(storedConfig.client_secret_encrypted)) : '';
  const clientSecret = String(storedSecret || envConfig.clientSecret || '');

  const missing: string[] = [];
  if (!clientId) missing.push('SALESFORCE_CLIENT_ID');
  if (!clientSecret) missing.push('SALESFORCE_CLIENT_SECRET');
  if (!redirectUri) missing.push('SALESFORCE_REDIRECT_URI');

  if (missing.length > 0) {
    throw new Error(`Missing Salesforce config: ${missing.join(', ')}`);
  }

  return {
    clientId,
    clientSecret,
    redirectUri,
    authBaseUrl,
    apiVersion,
    statusField,
    allowedStatuses,
    domainField,
  };
}

function validateFieldName(field: string, fallback: string): string {
  const valid = /^[A-Za-z_][A-Za-z0-9_]*(?:__c)?$/.test(field);
  return valid ? field : fallback;
}

function normalizeDomainFromEmail(email: string | null | undefined): string | null {
  if (!email || !email.includes('@')) return null;
  const parts = email.split('@');
  if (parts.length !== 2) return null;
  const domain = parts[1].trim().toLowerCase();
  if (!domain || isPersonalEmailDomain(domain)) return null;
  return domain;
}

function normalizeDomainFromWebsite(website: string | null | undefined): string | null {
  if (!website) return null;
  const trimmed = website.trim();
  if (!trimmed) return null;

  try {
    const url = trimmed.startsWith('http://') || trimmed.startsWith('https://')
      ? new URL(trimmed)
      : new URL(`https://${trimmed}`);
    const host = url.hostname.replace(/^www\./, '').toLowerCase();
    if (!host || isPersonalEmailDomain(host)) return null;
    return host;
  } catch {
    return null;
  }
}

function parseAllowedStatuses(raw: string): string[] {
  return raw
    .split(',')
    .map((x) => x.trim().toLowerCase())
    .filter(Boolean);
}

function isAllowedStatus(value: unknown, allowed: string[]): boolean {
  if (!value || typeof value !== 'string') return false;
  return allowed.includes(value.trim().toLowerCase());
}

function makeStatePayload(adminId: string) {
  return JSON.stringify({
    nonce: crypto.randomBytes(16).toString('hex'),
    ts: Date.now(),
    adminId,
  });
}

function signState(payload: string): string {
  const secret = process.env.JWT_SECRET || 'salesforce-state-secret';
  return crypto.createHmac('sha256', secret).update(payload).digest('hex');
}

export function generateOAuthState(adminId: string): string {
  const payload = makeStatePayload(adminId);
  const signature = signState(payload);
  return `${Buffer.from(payload).toString('base64url')}.${signature}`;
}

export function validateOAuthState(state: string): { valid: boolean; adminId?: string } {
  const [encodedPayload, signature] = state.split('.');
  if (!encodedPayload || !signature) return { valid: false };

  let payload = '';
  try {
    payload = Buffer.from(encodedPayload, 'base64url').toString('utf8');
  } catch {
    return { valid: false };
  }

  const expected = signState(payload);
  if (signature.length !== expected.length) {
    return { valid: false };
  }

  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
    return { valid: false };
  }

  try {
    const parsed = JSON.parse(payload);
    if (!parsed?.ts || typeof parsed.ts !== 'number') return { valid: false };
    if (!parsed?.adminId || typeof parsed.adminId !== 'string') return { valid: false };
    const maxAgeMs = 15 * 60 * 1000;
    if (Date.now() - parsed.ts > maxAgeMs) return { valid: false };
    return { valid: true, adminId: parsed.adminId };
  } catch {
    return { valid: false };
  }
}

export async function getSalesforceAdminConfig(): Promise<SalesforceAdminConfig> {
  const envConfig = getEnvSalesforceConfig();
  const stored = await getStoredSalesforceConfig();
  const storedConfig = stored?.config || {};
  const hasStored = !!stored;

  const clientId = String(storedConfig.client_id || envConfig.clientId || '');
  const redirectUri = String(storedConfig.redirect_uri || envConfig.redirectUri || '');
  const authBaseUrl = String(storedConfig.auth_base_url || envConfig.authBaseUrl || 'https://login.salesforce.com');
  const apiVersion = String(storedConfig.api_version || envConfig.apiVersion || 'v59.0');
  const statusField = String(storedConfig.status_field || envConfig.statusField || 'Type');
  const allowedStatuses = String(storedConfig.allowed_statuses || envConfig.allowedStatuses || 'Customer,Active Customer');
  const domainField = String(storedConfig.domain_field || envConfig.domainField || 'Website');

  const storedSecret = storedConfig.client_secret_encrypted ? decryptSecret(String(storedConfig.client_secret_encrypted)) : '';
  const envSecret = envConfig.clientSecret || '';

  return {
    clientId,
    clientSecretConfigured: Boolean(storedSecret || envSecret),
    redirectUri,
    authBaseUrl,
    apiVersion,
    statusField,
    allowedStatuses,
    domainField,
    configuredSource: hasStored ? 'database' : 'environment',
    updatedAt: stored?.updated_at || null,
  };
}

export async function getSalesforceAdminSecret(): Promise<SalesforceAdminSecret> {
  const envConfig = getEnvSalesforceConfig();
  const stored = await getStoredSalesforceConfig();
  const storedConfig = stored?.config || {};

  const storedSecret = storedConfig.client_secret_encrypted
    ? decryptSecret(String(storedConfig.client_secret_encrypted))
    : '';
  const envSecret = envConfig.clientSecret || '';
  const clientSecret = String(storedSecret || envSecret || '');

  if (!clientSecret) {
    throw new Error('No Salesforce client secret configured');
  }

  return {
    clientSecret,
    source: storedSecret ? 'database' : 'environment',
  };
}

export async function saveSalesforceAdminConfig(input: SalesforceConfigInput, adminId: string): Promise<SalesforceAdminConfig> {
  const stored = await getStoredSalesforceConfig();
  const existingConfig = stored?.config || {};
  const envConfig = getEnvSalesforceConfig();

  const clientId = (input.clientId || existingConfig.client_id || envConfig.clientId || '').trim();
  const redirectUri = (input.redirectUri || existingConfig.redirect_uri || envConfig.redirectUri || '').trim();
  const authBaseUrl = (input.authBaseUrl || existingConfig.auth_base_url || envConfig.authBaseUrl || 'https://login.salesforce.com').trim();
  const apiVersion = (input.apiVersion || existingConfig.api_version || envConfig.apiVersion || 'v59.0').trim();
  const statusField = (input.statusField || existingConfig.status_field || envConfig.statusField || 'Type').trim();
  const allowedStatuses = (input.allowedStatuses || existingConfig.allowed_statuses || envConfig.allowedStatuses || 'Customer,Active Customer').trim();
  const domainField = (input.domainField || existingConfig.domain_field || envConfig.domainField || 'Website').trim();

  const secretInput = (input.clientSecret || '').trim();
  const existingEncrypted = existingConfig.client_secret_encrypted ? String(existingConfig.client_secret_encrypted) : '';
  const envSecret = envConfig.clientSecret || '';

  let nextEncryptedSecret = existingEncrypted;
  if (secretInput) {
    nextEncryptedSecret = encryptSecret(secretInput);
  } else if (!nextEncryptedSecret && envSecret) {
    nextEncryptedSecret = encryptSecret(envSecret);
  }

  if (!clientId || !redirectUri || !nextEncryptedSecret) {
    throw new Error('Salesforce config requires client ID, client secret, and redirect URI');
  }

  const configPayload = {
    client_id: clientId,
    client_secret_encrypted: nextEncryptedSecret,
    redirect_uri: redirectUri,
    auth_base_url: authBaseUrl,
    api_version: apiVersion,
    status_field: statusField,
    allowed_statuses: allowedStatuses,
    domain_field: domainField,
  };

  if (stored?.id) {
    const { error } = await supabase
      .from('integration_settings')
      .update({
        config: configPayload,
        updated_by: adminId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', stored.id);

    if (error) {
      throw new Error(`Failed to update Salesforce config: ${error.message}`);
    }
  } else {
    const { error } = await supabase
      .from('integration_settings')
      .insert({
        provider: 'salesforce',
        config: configPayload,
        created_by: adminId,
        updated_by: adminId,
      });

    if (error) {
      throw new Error(`Failed to save Salesforce config: ${error.message}`);
    }
  }

  return getSalesforceAdminConfig();
}

export async function getSalesforceAuthorizeUrl(
  state: string,
  pkce?: { codeChallenge: string; codeChallengeMethod?: 'S256' | 'plain' }
): Promise<string> {
  const { clientId, redirectUri, authBaseUrl } = await getResolvedSalesforceConfig();
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: 'api refresh_token offline_access',
    prompt: 'consent',
    state,
  });
  if (pkce?.codeChallenge) {
    params.set('code_challenge', pkce.codeChallenge);
    params.set('code_challenge_method', pkce.codeChallengeMethod || 'S256');
  }
  return `${authBaseUrl}/services/oauth2/authorize?${params.toString()}`;
}

async function upsertConnection(data: SalesforceTokenResponse, adminId: string): Promise<SalesforceConnection> {
  // Keep one active connection for now.
  await supabase
    .from('salesforce_connections')
    .update({ is_active: false })
    .eq('is_active', true);

  const { data: connection, error } = await supabase
    .from('salesforce_connections')
    .insert({
      instance_url: data.instance_url,
      access_token: data.access_token,
      refresh_token: data.refresh_token || '',
      token_type: data.token_type || 'Bearer',
      scope: data.scope || null,
      connected_by: adminId,
      is_active: true,
    })
    .select('*')
    .single();

  if (error || !connection) {
    throw new Error(`Failed to save Salesforce connection: ${error?.message}`);
  }

  return connection as SalesforceConnection;
}

export async function exchangeCodeAndStoreConnection(
  code: string,
  adminId: string,
  codeVerifier?: string | null
): Promise<SalesforceConnection> {
  const { clientId, clientSecret, redirectUri, authBaseUrl } = await getResolvedSalesforceConfig();
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
  });
  if (codeVerifier) {
    body.set('code_verifier', codeVerifier);
  }

  const response = await fetch(`${authBaseUrl}/services/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });

  const payload: any = await response.json();
  if (!response.ok) {
    throw new Error(payload?.error_description || payload?.error || 'Salesforce token exchange failed');
  }

  if (!payload.access_token || !payload.instance_url) {
    throw new Error('Salesforce token response missing required fields');
  }

  if (!payload.refresh_token) {
    throw new Error('Salesforce refresh token missing. Ensure Connected App allows refresh_token and prompt=consent was used.');
  }

  return upsertConnection(payload as SalesforceTokenResponse, adminId);
}

export async function getActiveSalesforceConnection(): Promise<SalesforceConnection | null> {
  const { data, error } = await supabase
    .from('salesforce_connections')
    .select('*')
    .eq('is_active', true)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to get Salesforce connection: ${error.message}`);
  }

  return (data as SalesforceConnection | null) || null;
}

async function refreshAccessToken(connection: SalesforceConnection): Promise<SalesforceConnection> {
  const { clientId, clientSecret, authBaseUrl } = await getResolvedSalesforceConfig();
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: connection.refresh_token,
  });

  const response = await fetch(`${authBaseUrl}/services/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });

  const payload: any = await response.json();
  if (!response.ok || !payload.access_token) {
    throw new Error(payload?.error_description || payload?.error || 'Salesforce token refresh failed');
  }

  const { data, error } = await supabase
    .from('salesforce_connections')
    .update({
      access_token: payload.access_token,
      instance_url: payload.instance_url || connection.instance_url,
      token_type: payload.token_type || connection.token_type,
      updated_at: new Date().toISOString(),
    })
    .eq('id', connection.id)
    .select('*')
    .single();

  if (error || !data) {
    throw new Error(`Failed to persist refreshed Salesforce token: ${error?.message}`);
  }

  return data as SalesforceConnection;
}

async function salesforceQuery(connection: SalesforceConnection, soql: string, apiVersion: string): Promise<any[]> {
  const records: any[] = [];
  let nextUrl = `${connection.instance_url}/services/data/${apiVersion}/query?q=${encodeURIComponent(soql)}`;
  let currentConnection = connection;
  let retriedWithRefresh = false;

  while (nextUrl) {
    let response = await fetch(nextUrl, {
      method: 'GET',
      headers: {
        Authorization: `${currentConnection.token_type || 'Bearer'} ${currentConnection.access_token}`,
      },
    });

    if (response.status === 401 && !retriedWithRefresh) {
      currentConnection = await refreshAccessToken(currentConnection);
      response = await fetch(nextUrl, {
        method: 'GET',
        headers: {
          Authorization: `${currentConnection.token_type || 'Bearer'} ${currentConnection.access_token}`,
        },
      });
      retriedWithRefresh = true;
    }

    const payload: any = await response.json();
    if (!response.ok) {
      const msg = Array.isArray(payload) ? payload[0]?.message : payload?.message;
      throw new Error(msg || 'Salesforce query failed');
    }

    if (Array.isArray(payload.records)) {
      records.push(...payload.records);
    }

    nextUrl = payload.nextRecordsUrl ? `${currentConnection.instance_url}${payload.nextRecordsUrl}` : '';
  }

  return records;
}

async function salesforceGetJson(connection: SalesforceConnection, path: string, apiVersion: string): Promise<any> {
  let currentConnection = connection;
  let retriedWithRefresh = false;
  const url = `${currentConnection.instance_url}/services/data/${apiVersion}${path}`;

  while (true) {
    let response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `${currentConnection.token_type || 'Bearer'} ${currentConnection.access_token}`,
      },
    });

    if (response.status === 401 && !retriedWithRefresh) {
      currentConnection = await refreshAccessToken(currentConnection);
      retriedWithRefresh = true;
      continue;
    }

    const payload: any = await response.json();
    if (!response.ok) {
      const msg = Array.isArray(payload) ? payload[0]?.message : payload?.message;
      throw new Error(msg || 'Salesforce request failed');
    }
    return payload;
  }
}

export async function disconnectSalesforceConnection(): Promise<void> {
  await supabase
    .from('salesforce_connections')
    .update({ is_active: false })
    .eq('is_active', true);
}

export async function syncOrganizationsFromSalesforce() {
  const connection = await getActiveSalesforceConnection();
  if (!connection) {
    throw new Error('No active Salesforce connection found');
  }

  const integrationConfig = await getResolvedSalesforceConfig();
  const statusField = validateFieldName(integrationConfig.statusField || 'Type', 'Type');
  const domainField = validateFieldName(integrationConfig.domainField || 'Website', 'Website');
  const allowedStatuses = parseAllowedStatuses(integrationConfig.allowedStatuses || 'Customer,Active Customer');

  const accountSoql = `SELECT Id, Name, ${domainField}, ${statusField} FROM Account`;
  const contactSoql = 'SELECT Id, AccountId, Email FROM Contact WHERE Email != NULL';

  const [accounts, contacts] = await Promise.all([
    salesforceQuery(connection, accountSoql, integrationConfig.apiVersion || 'v59.0'),
    salesforceQuery(connection, contactSoql, integrationConfig.apiVersion || 'v59.0'),
  ]);

  const contactsByAccount = new Map<string, any[]>();
  for (const contact of contacts) {
    const accountId = contact.AccountId;
    if (!accountId) continue;
    const list = contactsByAccount.get(accountId) || [];
    list.push(contact);
    contactsByAccount.set(accountId, list);
  }

  let processedAccounts = 0;
  let updatedOrganizations = 0;
  let blockedOrganizations = 0;
  let skippedDomains = 0;

  for (const account of accounts) {
    processedAccounts += 1;
    const domains = new Set<string>();

    const websiteDomain = normalizeDomainFromWebsite(account[domainField]);
    if (websiteDomain) {
      domains.add(websiteDomain);
    }

    const relatedContacts = contactsByAccount.get(account.Id) || [];
    for (const contact of relatedContacts) {
      const emailDomain = normalizeDomainFromEmail(contact.Email);
      if (emailDomain) {
        domains.add(emailDomain);
      }
    }

    if (domains.size === 0) {
      skippedDomains += 1;
      continue;
    }

    const shouldGrant = isAllowedStatus(account[statusField], allowedStatuses);
    const targetStatus = shouldGrant ? 'whitelisted' : 'no_access';

    for (const domain of domains) {
      const org = await getOrCreateOrganization(domain, account.Name);
      const { error } = await supabase
        .from('organizations')
        .update({
          name: account.Name || domain,
          status: targetStatus,
          is_active: true,
          revoked_at: shouldGrant ? null : new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', org.id);

      if (!error) {
        updatedOrganizations += 1;
        if (!shouldGrant) blockedOrganizations += 1;
      }
    }
  }

  await supabase
    .from('salesforce_connections')
    .update({ last_synced_at: new Date().toISOString() })
    .eq('id', connection.id);

  return {
    processedAccounts,
    matchedContacts: contacts.length,
    updatedOrganizations,
    blockedOrganizations,
    skippedDomains,
    statusField,
    domainField,
    allowedStatuses,
  };
}

export async function getSalesforceAccountFieldMetadata() {
  const connection = await getActiveSalesforceConnection();
  if (!connection) {
    throw new Error('No active Salesforce connection found');
  }

  const integrationConfig = await getResolvedSalesforceConfig();
  const apiVersion = integrationConfig.apiVersion || 'v59.0';
  const describe = await salesforceGetJson(connection, '/sobjects/Account/describe', apiVersion);
  const rawFields = Array.isArray(describe?.fields) ? describe.fields : [];

  const fields: SalesforceAccountFieldMetadata[] = rawFields
    .filter((field: any) => typeof field?.name === 'string')
    .map((field: any) => ({
      name: field.name,
      label: typeof field.label === 'string' ? field.label : field.name,
      type: typeof field.type === 'string' ? field.type : 'string',
      picklistValues: Array.isArray(field.picklistValues)
        ? field.picklistValues
            .filter((p: any) => p?.active !== false && typeof p?.value === 'string')
            .map((p: any) => p.value)
        : [],
    }));

  const statusFieldCandidates = fields.filter((field) =>
    ['picklist', 'string', 'textarea', 'combobox'].includes(field.type)
  );
  const domainFieldCandidates = fields.filter((field) =>
    ['url', 'string', 'textarea', 'email'].includes(field.type)
  );

  return {
    object: 'Account',
    fields,
    statusFieldCandidates,
    domainFieldCandidates,
  };
}
