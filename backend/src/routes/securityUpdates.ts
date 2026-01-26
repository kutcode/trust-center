import express from 'express';
import { supabase } from '../server';
import { requireAdmin, AuthRequest } from '../middleware/auth';
import { logActivity } from '../utils/activityLogger';

const router = express.Router();

// Get security updates (public or admin)
// Use ?include_unpublished=true for admin to see all updates
router.get('/', async (req, res) => {
  try {
    const includeUnpublished = req.query.include_unpublished === 'true';

    let query = supabase
      .from('security_updates')
      .select('*');

    if (!includeUnpublished) {
      // Public view: only published updates
      query = query
        .not('published_at', 'is', null)
        .lte('published_at', new Date().toISOString());
    }

    // Order by published_at for public, created_at for admin
    const { data, error } = await query.order(
      includeUnpublished ? 'created_at' : 'published_at',
      { ascending: false }
    );

    if (error) throw error;

    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create security update (admin only)
router.post('/', requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { data, error } = await supabase
      .from('security_updates')
      .insert({
        ...req.body,
        published_at: req.body.published_at || new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    // Log security update creation
    await logActivity({
      adminId: req.admin!.id,
      adminEmail: req.admin!.email,
      actionType: 'create',
      entityType: 'security_update',
      entityId: data.id,
      entityName: data.title,
      newValue: data,
      description: `Created security update: ${data.title}`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.status(201).json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update security update (admin only)
router.patch('/:id', requireAdmin, async (req: AuthRequest, res) => {
  try {
    // Get existing data for comparison
    const { data: existing } = await supabase
      .from('security_updates')
      .select('*')
      .eq('id', req.params.id)
      .single();

    const { data, error } = await supabase
      .from('security_updates')
      .update(req.body)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;

    // Log security update edit
    await logActivity({
      adminId: req.admin!.id,
      adminEmail: req.admin!.email,
      actionType: 'update',
      entityType: 'security_update',
      entityId: data.id,
      entityName: data.title,
      oldValue: existing,
      newValue: data,
      description: `Updated security update: ${data.title}`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Delete security update (admin only)
router.delete('/:id', requireAdmin, async (req: AuthRequest, res) => {
  try {
    // Get existing data for logging
    const { data: existing } = await supabase
      .from('security_updates')
      .select('*')
      .eq('id', req.params.id)
      .single();

    const { error } = await supabase
      .from('security_updates')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;

    // Log security update deletion
    await logActivity({
      adminId: req.admin!.id,
      adminEmail: req.admin!.email,
      actionType: 'delete',
      entityType: 'security_update',
      entityId: req.params.id,
      entityName: existing?.title || 'Unknown',
      oldValue: existing,
      description: `Deleted security update: ${existing?.title || 'Unknown'}`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.json({ message: 'Security update deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
