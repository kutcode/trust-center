'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { apiRequestWithAuth } from '@/lib/api';
import toast from 'react-hot-toast';

interface SalesforceStatusResponse {
  connected: boolean;
  connection: {
    id: string;
    instance_url: string;
    connected_by?: string;
    last_synced_at?: string | null;
    salesforce_user_id?: string | null;
    salesforce_username?: string | null;
    salesforce_display_name?: string | null;
    salesforce_org_id?: string | null;
    salesforce_org_name?: string | null;
    salesforce_identity_url?: string | null;
  } | null;
}

interface SalesforceSyncResponse {
  success: boolean;
  processedAccounts: number;
  matchedContacts: number;
  contactsQueried?: number;
  contactsMatchedAccounts?: number;
  updatedOrganizations: number;
  blockedOrganizations: number;
  skippedDomains: number;
  statusField: string;
  domainField: string;
  allowedStatuses: string[];
}

interface SalesforceSyncAuditItem {
  id: string;
  salesforce_account_id: string;
  account_name: string | null;
  status_value: string | null;
  decision: 'whitelisted' | 'no_access' | 'skipped';
  website_domain: string | null;
  domains: string[];
  related_contact_count: number;
  matched_contact_emails: string[];
  organizations_updated: number;
  note: string | null;
}

interface SalesforceSyncAuditRun {
  id: string;
  success: boolean;
  error_message: string | null;
  processed_accounts: number;
  contacts_queried: number;
  contacts_matched_accounts: number;
  updated_organizations: number;
  blocked_organizations: number;
  skipped_domains: number;
  status_field: string;
  domain_field: string;
  allowed_statuses: string[];
  started_at: string;
  completed_at: string | null;
  created_at: string;
  items: SalesforceSyncAuditItem[];
}

interface SalesforceConfigResponse {
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

interface SalesforceConfigForm {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  authBaseUrl: string;
  apiVersion: string;
  statusField: string;
  allowedStatuses: string;
  domainField: string;
}

interface SalesforceSecretResponse {
  clientSecret: string;
  source: 'database' | 'environment';
}

interface SalesforceAccountFieldMetadata {
  name: string;
  label: string;
  type: string;
  picklistValues: string[];
}

interface SalesforceMetadataResponse {
  object: 'Account';
  fields: SalesforceAccountFieldMetadata[];
  statusFieldCandidates: SalesforceAccountFieldMetadata[];
  domainFieldCandidates: SalesforceAccountFieldMetadata[];
}

const LAST_SYNC_STORAGE_KEY = 'salesforce_last_sync_summary_v1';

export default function IntegrationsAdminPage() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [status, setStatus] = useState<SalesforceStatusResponse | null>(null);
  const [config, setConfig] = useState<SalesforceConfigResponse | null>(null);
  const [configForm, setConfigForm] = useState<SalesforceConfigForm>({
    clientId: '',
    clientSecret: '',
    redirectUri: 'http://localhost:4000/api/admin/integrations/salesforce/callback',
    authBaseUrl: 'https://login.salesforce.com',
    apiVersion: 'v59.0',
    statusField: 'Type',
    allowedStatuses: 'Customer,Active Customer',
    domainField: 'Website',
  });
  const [busyAction, setBusyAction] = useState<'connect' | 'sync' | 'disconnect' | null>(null);
  const [lastSyncResult, setLastSyncResult] = useState<SalesforceSyncResponse | null>(null);
  const [savingConfig, setSavingConfig] = useState(false);
  const [clientSecretVisible, setClientSecretVisible] = useState(false);
  const [clientSecretLoaded, setClientSecretLoaded] = useState(false);
  const [clientSecretLoading, setClientSecretLoading] = useState(false);
  const [metadata, setMetadata] = useState<SalesforceMetadataResponse | null>(null);
  const [metadataLoading, setMetadataLoading] = useState(false);
  const [statusFieldCustomInput, setStatusFieldCustomInput] = useState('');
  const [allowedStatusCustomInput, setAllowedStatusCustomInput] = useState('');
  const [salesforceExpanded, setSalesforceExpanded] = useState(true);
  const [auditRuns, setAuditRuns] = useState<SalesforceSyncAuditRun[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [expandedAuditRunId, setExpandedAuditRunId] = useState<string | null>(null);

  const callbackStatus = searchParams.get('salesforce');
  const callbackMessage = searchParams.get('message');

  useEffect(() => {
    if (callbackStatus === 'connected') {
      toast.success('Salesforce connected successfully');
    } else if (callbackStatus === 'error') {
      toast.error(callbackMessage || 'Salesforce connection failed');
    }
  }, [callbackStatus, callbackMessage]);

  const fetchStatus = async (authToken: string) => {
    const data = await apiRequestWithAuth<SalesforceStatusResponse>(
      '/api/admin/integrations/salesforce/status',
      authToken
    );
    setStatus(data);
    return data;
  };

  const fetchConfig = async (authToken: string) => {
    const data = await apiRequestWithAuth<SalesforceConfigResponse>(
      '/api/admin/integrations/salesforce/config',
      authToken
    );
    setConfig(data);
    setConfigForm({
      clientId: data.clientId || '',
      clientSecret: '',
      redirectUri: data.redirectUri || 'http://localhost:4000/api/admin/integrations/salesforce/callback',
      authBaseUrl: data.authBaseUrl || 'https://login.salesforce.com',
      apiVersion: data.apiVersion || 'v59.0',
      statusField: data.statusField || 'Type',
      allowedStatuses: data.allowedStatuses || 'Customer,Active Customer',
      domainField: data.domainField || 'Website',
    });
    setClientSecretLoaded(false);
    setClientSecretVisible(false);
  };

  const fetchSecretValue = async (authToken: string) => {
    if (clientSecretLoaded || !config?.clientSecretConfigured) return;
    setClientSecretLoading(true);
    try {
      const data = await apiRequestWithAuth<SalesforceSecretResponse>(
        '/api/admin/integrations/salesforce/config/secret',
        authToken
      );
      setConfigForm((prev) => ({ ...prev, clientSecret: data.clientSecret || '' }));
      setClientSecretLoaded(true);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load Salesforce client secret');
    } finally {
      setClientSecretLoading(false);
    }
  };

  const fetchMetadata = async (authToken: string) => {
    setMetadataLoading(true);
    try {
      const data = await apiRequestWithAuth<SalesforceMetadataResponse>(
        '/api/admin/integrations/salesforce/metadata',
        authToken
      );
      setMetadata(data);
    } catch (error: any) {
      setMetadata(null);
      toast.error(error.message || 'Failed to load Salesforce field metadata');
    } finally {
      setMetadataLoading(false);
    }
  };

  const fetchAuditRuns = async (authToken: string) => {
    setAuditLoading(true);
    try {
      const data = await apiRequestWithAuth<{ runs: SalesforceSyncAuditRun[] }>(
        '/api/admin/integrations/salesforce/audit?limit=5',
        authToken
      );
      setAuditRuns(Array.isArray(data.runs) ? data.runs : []);
      setExpandedAuditRunId((prev) => prev && data.runs?.some((r) => r.id === prev) ? prev : (data.runs?.[0]?.id || null));
    } catch (error: any) {
      setAuditRuns([]);
      toast.error(error.message || 'Failed to load Salesforce sync audit');
    } finally {
      setAuditLoading(false);
    }
  };

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(LAST_SYNC_STORAGE_KEY);
      if (stored) {
        setLastSyncResult(JSON.parse(stored));
      }
    } catch {
      // ignore invalid local cache
    }
  }, []);

  useEffect(() => {
    async function init() {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setLoading(false);
        return;
      }
      setToken(session.access_token);
      try {
        const [statusData] = await Promise.all([
          fetchStatus(session.access_token),
          fetchConfig(session.access_token),
        ]);
        if (statusData.connected) {
          await Promise.all([
            fetchMetadata(session.access_token),
            fetchAuditRuns(session.access_token),
          ]);
        }
      } catch (error: any) {
        toast.error(error.message || 'Failed to load integration status');
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  const handleConnect = async () => {
    if (!token) return;
    setBusyAction('connect');
    try {
      const data = await apiRequestWithAuth<{ authorizeUrl: string }>(
        '/api/admin/integrations/salesforce/connect-url',
        token
      );
      window.location.href = data.authorizeUrl;
    } catch (error: any) {
      toast.error(error.message || 'Failed to start Salesforce OAuth');
      setBusyAction(null);
    }
  };

  const handleSync = async () => {
    if (!token) return;
    setBusyAction('sync');
    try {
      const data = await apiRequestWithAuth<SalesforceSyncResponse>(
        '/api/admin/integrations/salesforce/sync',
        token,
        { method: 'POST' }
      );
      setLastSyncResult(data);
      window.localStorage.setItem(LAST_SYNC_STORAGE_KEY, JSON.stringify(data));
      await Promise.all([fetchStatus(token), fetchAuditRuns(token)]);
      toast.success('Salesforce sync completed');
    } catch (error: any) {
      toast.error(error.message || 'Salesforce sync failed');
    } finally {
      setBusyAction(null);
    }
  };

  const handleDisconnect = async () => {
    if (!token) return;
    setBusyAction('disconnect');
    try {
      await apiRequestWithAuth<{ success: boolean }>(
        '/api/admin/integrations/salesforce/disconnect',
        token,
        { method: 'POST' }
      );
      await fetchStatus(token);
      setAuditRuns([]);
      toast.success('Salesforce disconnected');
    } catch (error: any) {
      toast.error(error.message || 'Failed to disconnect Salesforce');
    } finally {
      setBusyAction(null);
    }
  };

  const handleConfigFieldChange = (field: keyof SalesforceConfigForm, value: string) => {
    setConfigForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setSavingConfig(true);
    try {
      const saved = await apiRequestWithAuth<SalesforceConfigResponse>(
        '/api/admin/integrations/salesforce/config',
        token,
        {
          method: 'PUT',
          body: JSON.stringify(configForm),
        }
      );
      setConfig(saved);
      setConfigForm((prev) => ({ ...prev, clientSecret: prev.clientSecret }));
      setClientSecretLoaded(Boolean(configForm.clientSecret));
      setClientSecretVisible(false);
      toast.success('Salesforce settings saved');
      if (status?.connected) {
        await Promise.all([fetchMetadata(token), fetchAuditRuns(token)]);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to save Salesforce settings');
    } finally {
      setSavingConfig(false);
    }
  };

  const lastSyncedLabel = useMemo(() => {
    const value = status?.connection?.last_synced_at;
    if (!value) return 'Never';
    try {
      return new Date(value).toLocaleString();
    } catch {
      return value;
    }
  }, [status]);

  const parsedAllowedStatuses = useMemo(
    () => configForm.allowedStatuses.split(',').map((s) => s.trim()).filter(Boolean),
    [configForm.allowedStatuses]
  );

  const selectedStatusFieldMeta = useMemo(
    () => metadata?.fields.find((f) => f.name === configForm.statusField) || null,
    [metadata, configForm.statusField]
  );

  const suggestedAllowedStatuses = useMemo(
    () => (selectedStatusFieldMeta?.picklistValues || []).filter(Boolean),
    [selectedStatusFieldMeta]
  );

  const updateAllowedStatuses = (nextValues: string[]) => {
    const normalized = Array.from(new Set(nextValues.map((v) => v.trim()).filter(Boolean)));
    handleConfigFieldChange('allowedStatuses', normalized.join(', '));
  };

  const toggleAllowedStatusValue = (value: string) => {
    const exists = parsedAllowedStatuses.some((s) => s.toLowerCase() === value.toLowerCase());
    if (exists) {
      updateAllowedStatuses(parsedAllowedStatuses.filter((s) => s.toLowerCase() !== value.toLowerCase()));
    } else {
      updateAllowedStatuses([...parsedAllowedStatuses, value]);
    }
  };

  const contactsQueriedCount = lastSyncResult?.contactsQueried ?? lastSyncResult?.matchedContacts ?? 0;
  const contactsMatchedAccountsCount = lastSyncResult?.contactsMatchedAccounts ?? 0;

  const formatDateTime = (value?: string | null) => {
    if (!value) return 'Unknown';
    try {
      return new Date(value).toLocaleString();
    } catch {
      return value;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Integrations</h1>
        <p className="text-gray-500 text-sm mt-1">
          Connect external systems and sync customer access rules into Trust Center.
        </p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <button
          type="button"
          onClick={() => setSalesforceExpanded((v) => !v)}
          className="w-full p-6 flex items-start justify-between gap-4 text-left hover:bg-gray-50"
          aria-expanded={salesforceExpanded}
          aria-controls="salesforce-integration-panel"
        >
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Salesforce</h2>
            <p className="text-sm text-gray-600 mt-1">
              OAuth 2.0 connection, customer status sync, and debug/audit visibility.
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
              <span className={`inline-flex items-center px-2 py-1 rounded-full ${status?.connected ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-700'}`}>
                {status?.connected ? 'Connected' : 'Not Connected'}
              </span>
              <span className="text-gray-500">Last Sync: {lastSyncedLabel}</span>
              {status?.connection?.salesforce_username && (
                <span className="text-gray-500">User: {status.connection.salesforce_username}</span>
              )}
              {status?.connection?.salesforce_org_name && (
                <span className="text-gray-500">Org: {status.connection.salesforce_org_name}</span>
              )}
            </div>
          </div>
          <span className="text-gray-500 text-xl leading-none">{salesforceExpanded ? '−' : '+'}</span>
        </button>

        {salesforceExpanded && (
          <div id="salesforce-integration-panel" className="border-t border-gray-200 p-6 space-y-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-base font-semibold text-gray-900 mb-2">Salesforce Credentials</h3>
              <p className="text-sm text-gray-600 mb-4">
                Configure Salesforce once here. Credentials are stored server-side and used for OAuth + sync.
              </p>
              <form onSubmit={handleSaveConfig} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Client ID</label>
              <input
                type="text"
                value={configForm.clientId}
                onChange={(e) => handleConfigFieldChange('clientId', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                placeholder="Salesforce Connected App Consumer Key"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Client Secret {config?.clientSecretConfigured ? '(Saved)' : '(Required)'}
              </label>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type={clientSecretVisible ? 'text' : 'password'}
                    value={configForm.clientSecret}
                    onChange={(e) => handleConfigFieldChange('clientSecret', e.target.value)}
                    onFocus={async () => {
                      if (token && config?.clientSecretConfigured && !clientSecretLoaded) {
                        await fetchSecretValue(token);
                      }
                      setClientSecretVisible(true);
                    }}
                    onBlur={() => setClientSecretVisible(false)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    placeholder={config?.clientSecretConfigured ? 'Click to reveal or edit saved secret' : 'Salesforce Connected App Consumer Secret'}
                  />
                  {config?.clientSecretConfigured && (
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={async () => {
                        if (!token) return;
                        if (!clientSecretLoaded) {
                          await fetchSecretValue(token);
                        }
                        setClientSecretVisible((v) => !v);
                      }}
                      disabled={clientSecretLoading}
                      className="px-3 py-2 rounded-lg border border-gray-300 text-sm bg-white hover:bg-gray-50 disabled:opacity-60"
                    >
                      {clientSecretLoading ? '...' : clientSecretVisible ? 'Hide' : 'Show'}
                    </button>
                  )}
                  {configForm.clientSecret && (
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(configForm.clientSecret);
                          toast.success('Client secret copied');
                        } catch {
                          toast.error('Failed to copy');
                        }
                      }}
                      className="px-3 py-2 rounded-lg border border-gray-300 text-sm bg-white hover:bg-gray-50"
                    >
                      Copy
                    </button>
                  )}
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      setClientSecretVisible(true);
                      setClientSecretLoaded(true);
                      handleConfigFieldChange('clientSecret', '');
                    }}
                    className="px-3 py-2 rounded-lg border border-gray-300 text-sm bg-white hover:bg-gray-50"
                  >
                    Clear
                  </button>
                </div>
                {config?.clientSecretConfigured && !configForm.clientSecret && (
                  <p className="text-xs text-gray-500">
                    Secret is stored. Click `Show` or focus the field to reveal it, or paste a new one to replace it.
                  </p>
                )}
                {config?.clientSecretConfigured && configForm.clientSecret && (
                    <button
                      type="button"
                      onClick={() => {
                        setClientSecretVisible(false);
                      }}
                      className="text-xs text-gray-600 hover:text-gray-900"
                    >
                      Click away from the field to mask the secret again
                    </button>
                )}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Redirect URI</label>
              <input
                type="text"
                value={configForm.redirectUri}
                onChange={(e) => handleConfigFieldChange('redirectUri', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Auth Base URL</label>
              <input
                type="text"
                value={configForm.authBaseUrl}
                onChange={(e) => handleConfigFieldChange('authBaseUrl', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">API Version</label>
              <input
                type="text"
                value={configForm.apiVersion}
                onChange={(e) => handleConfigFieldChange('apiVersion', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status Field</label>
              <div className="space-y-2">
                <select
                  value={configForm.statusField}
                  onChange={(e) => handleConfigFieldChange('statusField', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
                  disabled={metadataLoading}
                >
                  {metadata?.statusFieldCandidates?.length ? (
                    <>
                      {metadata.statusFieldCandidates.map((field) => (
                        <option key={field.name} value={field.name}>
                          {field.label} ({field.name})
                        </option>
                      ))}
                      {!metadata.statusFieldCandidates.some((f) => f.name === configForm.statusField) && (
                        <option value={configForm.statusField}>{configForm.statusField} (custom)</option>
                      )}
                    </>
                  ) : (
                    <option value={configForm.statusField}>{configForm.statusField || 'Type'}</option>
                  )}
                </select>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={statusFieldCustomInput}
                    onChange={(e) => setStatusFieldCustomInput(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    placeholder="Add custom field API name (e.g. Customer_Status__c)"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const next = statusFieldCustomInput.trim();
                      if (!next) return;
                      handleConfigFieldChange('statusField', next);
                      setStatusFieldCustomInput('');
                    }}
                    className="px-3 py-2 rounded-lg border border-gray-300 text-sm bg-white hover:bg-gray-50"
                  >
                    Use
                  </button>
                </div>
                <p className="text-xs text-gray-500">
                  {metadataLoading
                    ? 'Loading Account fields from Salesforce...'
                    : metadata
                      ? 'Pick from Account fields or enter a custom API field name.'
                      : 'Connect Salesforce to load Account field options.'}
                </p>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Domain Field</label>
              <select
                value={configForm.domainField}
                onChange={(e) => handleConfigFieldChange('domainField', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
                disabled={metadataLoading}
              >
                {metadata?.domainFieldCandidates?.length ? (
                  <>
                    {metadata.domainFieldCandidates.map((field) => (
                      <option key={field.name} value={field.name}>
                        {field.label} ({field.name})
                      </option>
                    ))}
                    {!metadata.domainFieldCandidates.some((f) => f.name === configForm.domainField) && (
                      <option value={configForm.domainField}>{configForm.domainField} (custom)</option>
                    )}
                  </>
                ) : (
                  <option value={configForm.domainField}>{configForm.domainField || 'Website'}</option>
                )}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Allowed Statuses</label>
              <div className="space-y-3">
                {suggestedAllowedStatuses.length > 0 ? (
                  <div className="border border-gray-200 rounded-lg p-3 max-h-40 overflow-auto space-y-2">
                    {suggestedAllowedStatuses.map((value) => {
                      const checked = parsedAllowedStatuses.some((s) => s.toLowerCase() === value.toLowerCase());
                      return (
                        <label key={value} className="flex items-center gap-2 text-sm text-gray-700">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleAllowedStatusValue(value)}
                            className="rounded border-gray-300 text-blue-600"
                          />
                          <span>{value}</span>
                        </label>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-gray-500">
                    No picklist options detected for the selected status field. Add values manually below.
                  </p>
                )}

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={allowedStatusCustomInput}
                    onChange={(e) => setAllowedStatusCustomInput(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    placeholder="Add a status value (e.g. Customer - Direct)"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const next = allowedStatusCustomInput.trim();
                      if (!next) return;
                      updateAllowedStatuses([...parsedAllowedStatuses, next]);
                      setAllowedStatusCustomInput('');
                    }}
                    className="px-3 py-2 rounded-lg border border-gray-300 text-sm bg-white hover:bg-gray-50"
                  >
                    Add
                  </button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {parsedAllowedStatuses.map((statusValue) => (
                    <span
                      key={statusValue}
                      className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-medium"
                    >
                      {statusValue}
                      <button
                        type="button"
                        onClick={() => updateAllowedStatuses(parsedAllowedStatuses.filter((s) => s !== statusValue))}
                        className="text-blue-600 hover:text-blue-800"
                        aria-label={`Remove ${statusValue}`}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  {parsedAllowedStatuses.length === 0 && (
                    <span className="text-xs text-gray-500">No allowed statuses selected</span>
                  )}
                </div>

                <p className="text-xs text-gray-500">
                  Matching is exact text match (case-insensitive). Example: <code>Customer - Direct</code>
                </p>
              </div>
            </div>
          </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-500">
                    Source: {config?.configuredSource || 'environment'}{config?.updatedAt ? ` • Updated ${new Date(config.updatedAt).toLocaleString()}` : ''}
                  </p>
                  <button
                    type="submit"
                    disabled={savingConfig}
                    className="px-4 py-2.5 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 disabled:bg-gray-400 transition-colors"
                  >
                    {savingConfig ? 'Saving...' : 'Save Salesforce Settings'}
                  </button>
                </div>
              </form>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-start justify-between gap-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-base font-semibold text-gray-900">Connection</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Uses OAuth 2.0 Connected App. Syncs Account/Contact data to update organization access.
                    </p>
                  </div>
                  <div className="space-y-1 text-sm text-gray-700">
                    <p>
                      Status:{' '}
                      <span className={status?.connected ? 'text-emerald-700 font-medium' : 'text-gray-800 font-medium'}>
                        {status?.connected ? 'Connected' : 'Not Connected'}
                      </span>
                    </p>
                    <p>Last Sync: <span className="font-medium">{lastSyncedLabel}</span></p>
                    {status?.connection?.instance_url && (
                      <p className="break-all">
                        Instance URL: <span className="font-mono text-xs">{status.connection.instance_url}</span>
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-2 min-w-[180px]">
                  {!status?.connected ? (
                    <button
                      onClick={handleConnect}
                      disabled={busyAction !== null}
                      className="px-4 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
                    >
                      {busyAction === 'connect' ? 'Redirecting...' : 'Connect Salesforce'}
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={handleSync}
                        disabled={busyAction !== null}
                        className="px-4 py-2.5 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 disabled:bg-gray-400 transition-colors"
                      >
                        {busyAction === 'sync' ? 'Syncing...' : 'Sync Now'}
                      </button>
                      <button
                        onClick={handleDisconnect}
                        disabled={busyAction !== null}
                        className="px-4 py-2.5 bg-white text-red-700 border border-red-300 rounded-lg font-medium hover:bg-red-50 disabled:opacity-60 transition-colors"
                      >
                        {busyAction === 'disconnect' ? 'Disconnecting...' : 'Disconnect'}
                      </button>
                    </>
                  )}
                </div>
              </div>

              {status?.connected && (
                <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="p-4 rounded-lg border border-gray-200 bg-gray-50">
                    <p className="text-xs uppercase tracking-wide text-gray-500 mb-2">Connected Salesforce User</p>
                    <p className="font-medium text-gray-900">{status.connection?.salesforce_display_name || 'Unknown user'}</p>
                    <p className="text-gray-600 break-all">{status.connection?.salesforce_username || 'Username unavailable'}</p>
                    {status.connection?.salesforce_user_id && (
                      <p className="text-xs text-gray-500 mt-1 break-all">User ID: {status.connection.salesforce_user_id}</p>
                    )}
                  </div>
                  <div className="p-4 rounded-lg border border-gray-200 bg-gray-50">
                    <p className="text-xs uppercase tracking-wide text-gray-500 mb-2">Connected Salesforce Org</p>
                    <p className="font-medium text-gray-900">{status.connection?.salesforce_org_name || 'Org name unavailable'}</p>
                    <p className="text-gray-600 break-all">{status.connection?.salesforce_org_id || 'Org ID unavailable'}</p>
                    {status.connection?.salesforce_identity_url && (
                      <p className="text-xs text-gray-500 mt-1 break-all">Identity URL: {status.connection.salesforce_identity_url}</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {lastSyncResult && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-base font-semibold text-gray-900 mb-3">Last Sync Summary</h3>
          <p className="text-xs text-gray-500 mb-4">
            This summary is cached in your browser so it remains visible after leaving the page.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="p-3 rounded border border-gray-200 bg-gray-50">
              <p className="text-gray-500">Accounts Processed</p>
              <p className="text-xl font-semibold text-gray-900">{lastSyncResult.processedAccounts}</p>
              <p className="text-xs text-gray-500 mt-1">Number of Salesforce Account records queried.</p>
            </div>
            <div className="p-3 rounded border border-gray-200 bg-gray-50">
              <p className="text-gray-500">Contacts Queried (Org-wide)</p>
              <p className="text-xl font-semibold text-gray-900">{contactsQueriedCount}</p>
              <p className="text-xs text-gray-500 mt-1">All Contacts returned from Salesforce Contact object with non-null email.</p>
            </div>
            <div className="p-3 rounded border border-gray-200 bg-gray-50">
              <p className="text-gray-500">Contacts Matched to Accounts</p>
              <p className="text-xl font-semibold text-gray-900">{contactsMatchedAccountsCount}</p>
              <p className="text-xs text-gray-500 mt-1">Contacts linked by AccountId to the processed Accounts in this sync.</p>
            </div>
            <div className="p-3 rounded border border-gray-200 bg-gray-50">
              <p className="text-gray-500">Organizations Updated</p>
              <p className="text-xl font-semibold text-gray-900">{lastSyncResult.updatedOrganizations}</p>
              <p className="text-xs text-gray-500 mt-1">Domain-level updates. One Account can update multiple orgs (website + contact email domains).</p>
            </div>
            <div className="p-3 rounded border border-gray-200 bg-gray-50">
              <p className="text-gray-500">Organizations Blocked</p>
              <p className="text-xl font-semibold text-gray-900">{lastSyncResult.blockedOrganizations}</p>
              <p className="text-xs text-gray-500 mt-1">Updated orgs set to <code>no_access</code> because Account status was not allowed.</p>
            </div>
            <div className="p-3 rounded border border-gray-200 bg-gray-50">
              <p className="text-gray-500">Accounts Skipped (No Domain)</p>
              <p className="text-xl font-semibold text-gray-900">{lastSyncResult.skippedDomains}</p>
              <p className="text-xs text-gray-500 mt-1">Accounts where no usable website/contact domain could be derived.</p>
            </div>
            <div className="p-3 rounded border border-gray-200 bg-gray-50">
              <p className="text-gray-500">Status Field</p>
              <p className="text-base font-semibold text-gray-900">{lastSyncResult.statusField}</p>
              <p className="text-xs text-gray-500 mt-1">Salesforce Account field used to decide access.</p>
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-600">
            <p>
              Domain field: <span className="font-medium text-gray-800">{lastSyncResult.domainField}</span>
            </p>
            <p>
              Allowed statuses:{' '}
              <span className="font-medium text-gray-800">
                {lastSyncResult.allowedStatuses.join(', ') || 'None'}
              </span>
            </p>
          </div>
              </div>
            )}

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between gap-4 mb-3">
                <div>
                  <h3 className="text-base font-semibold text-gray-900">Salesforce Sync Audit</h3>
                  <p className="text-sm text-gray-600">
                    Shows recent sync runs and per-account decisions/domains used to update Trust Center organizations.
                  </p>
                </div>
                {status?.connected && token && (
                  <button
                    type="button"
                    onClick={() => fetchAuditRuns(token)}
                    disabled={auditLoading}
                    className="px-3 py-2 rounded-lg border border-gray-300 text-sm bg-white hover:bg-gray-50 disabled:opacity-60"
                  >
                    {auditLoading ? 'Refreshing...' : 'Refresh Audit'}
                  </button>
                )}
              </div>

              {!status?.connected ? (
                <p className="text-sm text-gray-500">Connect Salesforce to view sync audit history.</p>
              ) : auditLoading && auditRuns.length === 0 ? (
                <p className="text-sm text-gray-500">Loading sync audit...</p>
              ) : auditRuns.length === 0 ? (
                <p className="text-sm text-gray-500">No sync runs recorded yet. Run Sync Now to generate audit history.</p>
              ) : (
                <div className="space-y-3">
                  {auditRuns.map((run) => {
                    const isOpen = expandedAuditRunId === run.id;
                    return (
                      <div key={run.id} className="border border-gray-200 rounded-lg overflow-hidden">
                        <button
                          type="button"
                          onClick={() => setExpandedAuditRunId((prev) => prev === run.id ? null : run.id)}
                          className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 text-left flex items-center justify-between gap-4"
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${run.success ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                {run.success ? 'Success' : 'Failed'}
                              </span>
                              <span className="text-sm font-medium text-gray-900">{formatDateTime(run.completed_at || run.created_at)}</span>
                            </div>
                            <p className="text-xs text-gray-600 mt-1">
                              Accounts: {run.processed_accounts} • Contacts queried: {run.contacts_queried} • Contacts matched: {run.contacts_matched_accounts} • Orgs updated: {run.updated_organizations}
                            </p>
                          </div>
                          <span className="text-gray-500">{isOpen ? 'Hide' : 'Show'}</span>
                        </button>

                        {isOpen && (
                          <div className="p-4 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                              <div className="p-3 border border-gray-200 rounded bg-white">
                                <p><span className="text-gray-500">Started:</span> {formatDateTime(run.started_at)}</p>
                                <p><span className="text-gray-500">Completed:</span> {formatDateTime(run.completed_at)}</p>
                                <p><span className="text-gray-500">Status Field:</span> {run.status_field}</p>
                                <p><span className="text-gray-500">Domain Field:</span> {run.domain_field}</p>
                              </div>
                              <div className="p-3 border border-gray-200 rounded bg-white">
                                <p><span className="text-gray-500">Blocked Orgs:</span> {run.blocked_organizations}</p>
                                <p><span className="text-gray-500">Skipped Accounts:</span> {run.skipped_domains}</p>
                                <p className="break-words"><span className="text-gray-500">Allowed Statuses:</span> {run.allowed_statuses?.join(', ') || 'None'}</p>
                                {run.error_message && <p className="text-red-700"><span className="text-red-600">Error:</span> {run.error_message}</p>}
                              </div>
                            </div>

                            <div className="overflow-x-auto">
                              <table className="min-w-full text-sm">
                                <thead>
                                  <tr className="border-b border-gray-200 text-left text-gray-500">
                                    <th className="py-2 pr-4 font-medium">Account</th>
                                    <th className="py-2 pr-4 font-medium">Status</th>
                                    <th className="py-2 pr-4 font-medium">Decision</th>
                                    <th className="py-2 pr-4 font-medium">Domains</th>
                                    <th className="py-2 pr-4 font-medium">Contacts</th>
                                    <th className="py-2 pr-0 font-medium">Notes</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {(run.items || []).map((item) => (
                                    <tr key={item.id} className="border-b border-gray-100 align-top">
                                      <td className="py-2 pr-4">
                                        <div className="font-medium text-gray-900">{item.account_name || '(Unnamed Account)'}</div>
                                        <div className="text-xs text-gray-500 break-all">{item.salesforce_account_id}</div>
                                      </td>
                                      <td className="py-2 pr-4 text-gray-700">{item.status_value || '—'}</td>
                                      <td className="py-2 pr-4">
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${item.decision === 'whitelisted' ? 'bg-emerald-100 text-emerald-700' : item.decision === 'no_access' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                                          {item.decision}
                                        </span>
                                        <div className="text-xs text-gray-500 mt-1">Updated: {item.organizations_updated}</div>
                                      </td>
                                      <td className="py-2 pr-4">
                                        <div className="flex flex-wrap gap-1">
                                          {(item.domains || []).length ? (item.domains || []).map((domain) => (
                                            <span key={domain} className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-xs">{domain}</span>
                                          )) : <span className="text-gray-400 text-xs">No domains</span>}
                                        </div>
                                        {item.website_domain && <div className="text-xs text-gray-500 mt-1">Website: {item.website_domain}</div>}
                                      </td>
                                      <td className="py-2 pr-4">
                                        <div className="text-gray-700">{item.related_contact_count}</div>
                                        {(item.matched_contact_emails || []).length > 0 && (
                                          <details className="mt-1">
                                            <summary className="cursor-pointer text-xs text-blue-600">Show emails</summary>
                                            <div className="mt-1 text-xs text-gray-600 space-y-1 max-w-xs break-all">
                                              {item.matched_contact_emails.map((email) => (
                                                <div key={email}>{email}</div>
                                              ))}
                                            </div>
                                          </details>
                                        )}
                                      </td>
                                      <td className="py-2 pr-0 text-xs text-gray-600">{item.note || '—'}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
