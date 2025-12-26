import express from 'express';
import { supabase } from '../server';
import { requireAdmin, AuthRequest } from '../middleware/auth';
import { logActivity } from '../utils/activityLogger';

const router = express.Router();

// Get all active subprocessors (public)
router.get('/', async (req, res) => {
    try {
        const includeInactive = req.query.include_inactive === 'true';

        let query = supabase
            .from('subprocessors')
            .select('*')
            .order('display_order', { ascending: true });

        if (!includeInactive) {
            query = query.eq('is_active', true);
        }

        const { data, error } = await query;

        if (error) throw error;

        res.json(data);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Create subprocessor (admin only)
router.post('/', requireAdmin, async (req: AuthRequest, res) => {
    try {
        const { data, error } = await supabase
            .from('subprocessors')
            .insert(req.body)
            .select()
            .single();

        if (error) throw error;

        await logActivity({
            adminId: req.admin!.id,
            adminEmail: req.admin!.email,
            actionType: 'create',
            entityType: 'subprocessor',
            entityId: data.id,
            entityName: data.name,
            newValue: { name: data.name, purpose: data.purpose },
            description: `Added subprocessor: ${data.name}`,
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'],
        });

        res.status(201).json(data);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Update subprocessor (admin only)
router.patch('/:id', requireAdmin, async (req: AuthRequest, res) => {
    try {
        const { data: oldData } = await supabase
            .from('subprocessors')
            .select('name, purpose')
            .eq('id', req.params.id)
            .single();

        const { data, error } = await supabase
            .from('subprocessors')
            .update(req.body)
            .eq('id', req.params.id)
            .select()
            .single();

        if (error) throw error;

        if (req.body.name || req.body.purpose || req.body.is_active !== undefined) {
            await logActivity({
                adminId: req.admin!.id,
                adminEmail: req.admin!.email,
                actionType: 'update',
                entityType: 'subprocessor',
                entityId: req.params.id,
                entityName: data.name,
                oldValue: oldData,
                newValue: { name: data.name, purpose: data.purpose, is_active: data.is_active },
                description: `Updated subprocessor: ${data.name}`,
                ipAddress: req.ip,
                userAgent: req.headers['user-agent'],
            });
        }

        res.json(data);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Delete subprocessor (admin only)
router.delete('/:id', requireAdmin, async (req: AuthRequest, res) => {
    try {
        const { data: sub } = await supabase
            .from('subprocessors')
            .select('name')
            .eq('id', req.params.id)
            .single();

        const { error } = await supabase
            .from('subprocessors')
            .delete()
            .eq('id', req.params.id);

        if (error) throw error;

        await logActivity({
            adminId: req.admin!.id,
            adminEmail: req.admin!.email,
            actionType: 'delete',
            entityType: 'subprocessor',
            entityId: req.params.id,
            entityName: sub?.name || 'Unknown',
            oldValue: { name: sub?.name },
            description: `Removed subprocessor: ${sub?.name || req.params.id}`,
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'],
        });

        res.json({ message: 'Subprocessor deleted successfully' });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Subscribe to updates (public)
router.post('/subscribe', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email || !email.includes('@')) {
            return res.status(400).json({ error: 'Valid email is required' });
        }

        const { data, error } = await supabase
            .from('subprocessor_subscriptions')
            .insert({ email: email.toLowerCase() })
            .select()
            .single();

        if (error) {
            if (error.code === '23505') {
                return res.json({ message: 'Already subscribed' });
            }
            throw error;
        }

        res.status(201).json({ message: 'Subscribed successfully' });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
