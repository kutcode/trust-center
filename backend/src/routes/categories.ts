import express from 'express';
import { supabase } from '../server';
import { requireAdmin, AuthRequest } from '../middleware/auth';
import { logActivity } from '../utils/activityLogger';

const router = express.Router();

// Get all categories (public)
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('document_categories')
      .select('*')
      .order('display_order', { ascending: true });

    if (error) throw error;

    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create category (admin only)
router.post('/', requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { data, error } = await supabase
      .from('document_categories')
      .insert(req.body)
      .select()
      .single();

    if (error) throw error;

    // Log category creation
    await logActivity({
      adminId: req.admin!.id,
      adminEmail: req.admin!.email,
      actionType: 'create',
      entityType: 'category',
      entityId: data.id,
      entityName: data.name,
      newValue: { name: data.name, description: data.description },
      description: `Created category: ${data.name}`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.status(201).json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update category (admin only)
router.patch('/:id', requireAdmin, async (req: AuthRequest, res) => {
  try {
    // Get old data for logging
    const { data: oldData } = await supabase
      .from('document_categories')
      .select('name, description')
      .eq('id', req.params.id)
      .single();

    const { data, error } = await supabase
      .from('document_categories')
      .update(req.body)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;

    // Only log if name or description changed (not just display_order)
    if (req.body.name || req.body.description) {
      await logActivity({
        adminId: req.admin!.id,
        adminEmail: req.admin!.email,
        actionType: 'update',
        entityType: 'category',
        entityId: req.params.id,
        entityName: data.name,
        oldValue: oldData,
        newValue: { name: data.name, description: data.description },
        description: `Updated category: ${data.name}`,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });
    }

    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Delete category (admin only)
router.delete('/:id', requireAdmin, async (req: AuthRequest, res) => {
  try {
    // Get category name before deletion for logging
    const { data: category } = await supabase
      .from('document_categories')
      .select('name')
      .eq('id', req.params.id)
      .single();

    const { error } = await supabase
      .from('document_categories')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;

    // Log category deletion
    await logActivity({
      adminId: req.admin!.id,
      adminEmail: req.admin!.email,
      actionType: 'delete',
      entityType: 'category',
      entityId: req.params.id,
      entityName: category?.name || 'Unknown',
      oldValue: { name: category?.name },
      description: `Deleted category: ${category?.name || req.params.id}`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.json({ message: 'Category deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
