import express from 'express';
import { requireAdmin, AuthRequest } from '../middleware/auth';
import {
  consumeSalesforcePkceVerifier,
  createSalesforcePkceChallenge,
  disconnectSalesforceConnection,
  exchangeCodeAndStoreConnection,
  generateOAuthState,
  getActiveSalesforceConnection,
  getSalesforceAdminConfig,
  getSalesforceAdminSecret,
  getSalesforceAccountFieldMetadata,
  getSalesforceAuthorizeUrl,
  getRecentSalesforceSyncAudit,
  refreshActiveSalesforceConnectionIdentity,
  saveSalesforceAdminConfig,
  syncOrganizationsFromSalesforce,
  validateOAuthState,
} from '../services/salesforceService';

const router = express.Router();

router.get('/status', requireAdmin, async (req: AuthRequest, res) => {
  try {
    let connection = await getActiveSalesforceConnection();
    if (connection && !connection.salesforce_username && !connection.salesforce_org_id) {
      connection = await refreshActiveSalesforceConnectionIdentity();
    }
    res.json({
      connected: !!connection,
      connection: connection
        ? {
          id: connection.id,
          instance_url: connection.instance_url,
          connected_by: connection.connected_by,
          last_synced_at: connection.last_synced_at || null,
          salesforce_user_id: connection.salesforce_user_id || null,
          salesforce_username: connection.salesforce_username || null,
          salesforce_display_name: connection.salesforce_display_name || null,
          salesforce_org_id: connection.salesforce_org_id || null,
          salesforce_org_name: connection.salesforce_org_name || null,
          salesforce_identity_url: connection.salesforce_identity_url || null,
        }
        : null,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/connect-url', requireAdmin, async (req: AuthRequest, res) => {
  try {
    const state = generateOAuthState(req.admin!.id);
    const pkce = createSalesforcePkceChallenge(state);
    const authorizeUrl = await getSalesforceAuthorizeUrl(state, pkce);
    res.json({ authorizeUrl, state });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/config', requireAdmin, async (req: AuthRequest, res) => {
  try {
    const config = await getSalesforceAdminConfig();
    res.json(config);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/config/secret', requireAdmin, async (req: AuthRequest, res) => {
  try {
    const secret = await getSalesforceAdminSecret();
    res.json(secret);
  } catch (error: any) {
    res.status(404).json({ error: error.message });
  }
});

router.get('/metadata', requireAdmin, async (_req: AuthRequest, res) => {
  try {
    const metadata = await getSalesforceAccountFieldMetadata();
    res.json(metadata);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/audit', requireAdmin, async (req: AuthRequest, res) => {
  try {
    const limit = Number(req.query.limit || 5);
    const runs = await getRecentSalesforceSyncAudit(limit);
    res.json({ runs });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/config', requireAdmin, async (req: AuthRequest, res) => {
  try {
    const saved = await saveSalesforceAdminConfig({
      clientId: req.body?.clientId || '',
      clientSecret: req.body?.clientSecret || '',
      redirectUri: req.body?.redirectUri || '',
      authBaseUrl: req.body?.authBaseUrl || '',
      apiVersion: req.body?.apiVersion || '',
      statusField: req.body?.statusField || '',
      allowedStatuses: req.body?.allowedStatuses || '',
      domainField: req.body?.domainField || '',
    }, req.admin!.id);
    res.json(saved);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/callback', async (req, res) => {
  const frontendBase = process.env.FRONTEND_URL || 'http://localhost:3000';
  const redirectToIntegrations = (status: 'connected' | 'error', message?: string) => {
    const params = new URLSearchParams({ salesforce: status });
    if (message) params.set('message', message.slice(0, 200));
    return `${frontendBase}/admin/integrations?${params.toString()}`;
  };

  try {
    const code = String(req.query.code || '');
    const state = String(req.query.state || '');

    if (!code || !state) {
      return res.redirect(redirectToIntegrations('error', 'Missing code or state'));
    }

    const validation = validateOAuthState(state);
    if (!validation.valid || !validation.adminId) {
      return res.redirect(redirectToIntegrations('error', 'Invalid or expired OAuth state'));
    }

    const codeVerifier = consumeSalesforcePkceVerifier(state);
    await exchangeCodeAndStoreConnection(code, validation.adminId, codeVerifier);
    return res.redirect(redirectToIntegrations('connected'));
  } catch (error: any) {
    return res.redirect(redirectToIntegrations('error', error.message || 'Salesforce connection failed'));
  }
});

router.post('/sync', requireAdmin, async (req: AuthRequest, res) => {
  try {
    const result = await syncOrganizationsFromSalesforce();
    res.json({ success: true, ...result });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/disconnect', requireAdmin, async (req: AuthRequest, res) => {
  try {
    await disconnectSalesforceConnection();
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
