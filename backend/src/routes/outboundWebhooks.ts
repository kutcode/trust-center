import express from 'express';
import { supabase } from '../server';
import { requireAdmin, AuthRequest } from '../middleware/auth';
import { logActivity } from '../utils/activityLogger';
import { dispatchWebhook } from '../services/webhookDispatcher';
import crypto from 'crypto';

const router = express.Router();

// Get all webhooks
router.get('/', requireAdmin, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('outbound_webhooks')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.json(data);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Create webhook
router.post('/', requireAdmin, async (req: AuthRequest, res) => {
    try {
        const { url, description, event_types } = req.body;

        // Auto-generate secret
        const secret = crypto.randomBytes(32).toString('hex');

        const { data, error } = await supabase
            .from('outbound_webhooks')
            .insert({ url, description, event_types, secret, is_active: true })
            .select()
            .single();

        if (error) throw error;

        await logActivity({
            adminId: req.admin!.id,
            adminEmail: req.admin!.email,
            actionType: 'settings_updated',
            entityType: 'webhook',
            entityId: data.id,
            entityName: url,
            description: `Created webhook: ${url}`,
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'],
        } as any);

        res.status(201).json(data);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Delete webhook
router.delete('/:id', requireAdmin, async (req: AuthRequest, res) => {
    try {
        const { error } = await supabase
            .from('outbound_webhooks')
            .delete()
            .eq('id', req.params.id);

        if (error) throw error;

        await logActivity({
            adminId: req.admin!.id,
            adminEmail: req.admin!.email,
            actionType: 'settings_updated',
            entityType: 'webhook',
            entityId: req.params.id,
            entityName: 'Webhook',
            description: `Deleted webhook ${req.params.id}`,
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'],
        } as any);

        res.json({ message: 'Deleted' });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Test webhook
router.post('/:id/test', requireAdmin, async (req, res) => {
    try {
        const { data: webhook } = await supabase
            .from('outbound_webhooks')
            .select('*')
            .eq('id', req.params.id)
            .single();

        if (!webhook) return res.status(404).json({ error: 'Not found' });

        // Dispatch ping event
        // We call helper directly but for specific URL? 
        // Helper dispatches by filtering DB. We want to force fire this one?
        // Let's just use the logic directly here or make dispatch support ID?
        // NVM, just fire a test event "ping"

        const payload = { event: 'ping', timestamp: new Date().toISOString() };
        const signature = crypto
            .createHmac('sha256', webhook.secret)
            .update(JSON.stringify(payload))
            .digest('hex');

        const response = await fetch(webhook.url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-TrustCenter-Event': 'ping',
                'X-TrustCenter-Signature': signature,
                'User-Agent': 'TrustCenter-Webhook/1.0'
            },
            body: JSON.stringify(payload)
        });

        res.json({
            success: response.ok,
            status: response.status,
            statusText: response.statusText
        });

    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
