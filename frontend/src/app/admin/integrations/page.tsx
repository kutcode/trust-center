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
  } | null;
}

interface SalesforceSyncResponse {
  success: boolean;
  processedAccounts: number;
  matchedContacts: number;
  updatedOrganizations: number;
  blockedOrganizations: number;
  skippedDomains: number;
  statusField: string;
  domainField: string;
  allowedStatuses: string[];
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
        await Promise.all([
          fetchStatus(session.access_token),
          fetchConfig(session.access_token),
        ]);
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
      await fetchStatus(token);
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
      setLastSyncResult(null);
      await fetchStatus(token);
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

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Salesforce Credentials</h2>
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
              <input
                type="text"
                value={configForm.statusField}
                onChange={(e) => handleConfigFieldChange('statusField', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Domain Field</label>
              <input
                type="text"
                value={configForm.domainField}
                onChange={(e) => handleConfigFieldChange('domainField', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Allowed Statuses</label>
              <input
                type="text"
                value={configForm.allowedStatuses}
                onChange={(e) => handleConfigFieldChange('allowedStatuses', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                placeholder="Customer,Active Customer"
              />
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
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Salesforce</h2>
            <p className="text-sm text-gray-600 mt-1">
              Uses OAuth 2.0 Connected App. Syncs Account/Contact data to update organization access.
            </p>
            <div className="mt-4 space-y-1 text-sm text-gray-700">
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
      </div>

      {lastSyncResult && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-base font-semibold text-gray-900 mb-3">Last Sync Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="p-3 rounded border border-gray-200 bg-gray-50">
              <p className="text-gray-500">Accounts Processed</p>
              <p className="text-xl font-semibold text-gray-900">{lastSyncResult.processedAccounts}</p>
            </div>
            <div className="p-3 rounded border border-gray-200 bg-gray-50">
              <p className="text-gray-500">Contacts Scanned</p>
              <p className="text-xl font-semibold text-gray-900">{lastSyncResult.matchedContacts}</p>
            </div>
            <div className="p-3 rounded border border-gray-200 bg-gray-50">
              <p className="text-gray-500">Organizations Updated</p>
              <p className="text-xl font-semibold text-gray-900">{lastSyncResult.updatedOrganizations}</p>
            </div>
            <div className="p-3 rounded border border-gray-200 bg-gray-50">
              <p className="text-gray-500">Organizations Blocked</p>
              <p className="text-xl font-semibold text-gray-900">{lastSyncResult.blockedOrganizations}</p>
            </div>
            <div className="p-3 rounded border border-gray-200 bg-gray-50">
              <p className="text-gray-500">Accounts Skipped (No Domain)</p>
              <p className="text-xl font-semibold text-gray-900">{lastSyncResult.skippedDomains}</p>
            </div>
            <div className="p-3 rounded border border-gray-200 bg-gray-50">
              <p className="text-gray-500">Status Field</p>
              <p className="text-base font-semibold text-gray-900">{lastSyncResult.statusField}</p>
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
    </div>
  );
}
