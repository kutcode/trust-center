import express from 'express';
import { supabase } from '../server';
import { requireAdmin, AuthRequest } from '../middleware/auth';
import { logActivity } from '../utils/activityLogger';

const router = express.Router();

// Get all active certifications (public)
router.get('/', async (req, res) => {
  try {
    const includeInactive = req.query.include_inactive === 'true';

    let query = supabase
      .from('certifications')
      .select('*')
      .order('display_order', { ascending: true });

    if (!includeInactive) {
      query = query.eq('status', 'active');
    }

    const { data, error } = await query;

    if (error) throw error;

    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create certification (admin only)
router.post('/', requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { data, error } = await supabase
      .from('certifications')
      .insert(req.body)
      .select()
      .single();

    if (error) throw error;

    // Log activity
    await logActivity({
      adminId: req.admin!.id,
      adminEmail: req.admin!.email,
      actionType: 'create',
      entityType: 'certification',
      entityId: data.id,
      entityName: data.name,
      newValue: { name: data.name, issuer: data.issuer },
      description: `Created certification: ${data.name}`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.status(201).json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Reorder certifications (admin only) - MUST be before /:id route
router.patch('/reorder', requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { items } = req.body; // Array of { id, display_order }

    if (!Array.isArray(items)) {
      return res.status(400).json({ error: 'Invalid items format' });
    }

    // Process updates in transaction-like manner (sequential)
    for (const item of items) {
      await supabase
        .from('certifications')
        .update({ display_order: item.display_order })
        .eq('id', item.id);
    }

    res.json({ message: 'Reordered successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update certification (admin only)
router.patch('/:id', requireAdmin, async (req: AuthRequest, res) => {
  try {
    // Get old data for logging
    const { data: oldData } = await supabase
      .from('certifications')
      .select('name, issuer, status')
      .eq('id', req.params.id)
      .single();

    const { data, error } = await supabase
      .from('certifications')
      .update(req.body)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;

    // Log activity (only if meaningful changes)
    if (req.body.name || req.body.issuer || req.body.status) {
      await logActivity({
        adminId: req.admin!.id,
        adminEmail: req.admin!.email,
        actionType: 'update',
        entityType: 'certification',
        entityId: req.params.id,
        entityName: data.name,
        oldValue: oldData,
        newValue: { name: data.name, issuer: data.issuer, status: data.status },
        description: `Updated certification: ${data.name}`,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });
    }

    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Delete certification (admin only)
router.delete('/:id', requireAdmin, async (req: AuthRequest, res) => {
  try {
    // Get certification name before deletion
    const { data: cert } = await supabase
      .from('certifications')
      .select('name')
      .eq('id', req.params.id)
      .single();

    const { error } = await supabase
      .from('certifications')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;

    // Log activity
    await logActivity({
      adminId: req.admin!.id,
      adminEmail: req.admin!.email,
      actionType: 'delete',
      entityType: 'certification',
      entityId: req.params.id,
      entityName: cert?.name || 'Unknown',
      oldValue: { name: cert?.name },
      description: `Deleted certification: ${cert?.name || req.params.id}`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.json({ message: 'Certification deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
