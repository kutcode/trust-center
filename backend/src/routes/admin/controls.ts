import express from 'express';
import { supabase } from '../../server';
import { requireAdmin, AuthRequest } from '../../middleware/auth';
import { logActivity } from '../../utils/activityLogger';
import { handleError } from '../../utils/errorHandler';

const router = express.Router();

// ============ CONTROL CATEGORIES ============

// Get all control categories
router.get('/control-categories', requireAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('control_categories')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) throw error;
    res.json(data || []);
  } catch (error: any) {
    handleError(res, error, 'Get control categories error');
  }
});

// Create control category
router.post('/control-categories', requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { name, description, icon } = req.body;

    const { data: existing } = await supabase
      .from('control_categories')
      .select('sort_order')
      .order('sort_order', { ascending: false })
      .limit(1);

    const maxOrder = existing?.[0]?.sort_order || 0;

    const { data, error } = await supabase
      .from('control_categories')
      .insert({ name, description, icon, sort_order: maxOrder + 1 })
      .select()
      .single();

    if (error) throw error;

    await logActivity({
      adminId: req.admin!.id,
      adminEmail: req.admin!.email,
      actionType: 'create',
      entityType: 'control_category',
      entityId: data.id,
      entityName: data.name,
      newValue: data,
      description: `Created control category: ${data.name}`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.status(201).json(data);
  } catch (error: any) {
    handleError(res, error, 'Create control category error');
  }
});

// Reorder control categories (MUST be before /:id route)
router.patch('/control-categories/reorder', requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { orders } = req.body;

    if (!orders || !Array.isArray(orders)) {
      return res.status(400).json({ error: 'orders array is required' });
    }

    for (const item of orders) {
      const { error } = await supabase
        .from('control_categories')
        .update({ sort_order: item.sort_order })
        .eq('id', item.id);

      if (error) throw error;
    }

    await logActivity({
      adminId: req.admin!.id,
      adminEmail: req.admin!.email,
      actionType: 'reorder',
      entityType: 'control_category',
      description: `Reordered ${orders.length} control categories`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.json({ message: 'Categories reordered successfully' });
  } catch (error: any) {
    handleError(res, error, 'Reorder control categories error');
  }
});

// Update control category
router.patch('/control-categories/:id', requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { name, description, icon, sort_order } = req.body;

    const { data: existing } = await supabase.from('control_categories').select('*').eq('id', id).single();

    const { data, error } = await supabase
      .from('control_categories')
      .update({ name, description, icon, sort_order })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    await logActivity({
      adminId: req.admin!.id,
      adminEmail: req.admin!.email,
      actionType: 'update',
      entityType: 'control_category',
      entityId: id,
      entityName: data.name,
      oldValue: existing,
      newValue: data,
      description: `Updated control category: ${data.name}`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.json(data);
  } catch (error: any) {
    handleError(res, error, 'Update control category error');
  }
});

// Delete control category
router.delete('/control-categories/:id', requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const { data: existing } = await supabase.from('control_categories').select('*').eq('id', id).single();

    const { error } = await supabase.from('control_categories').delete().eq('id', id);
    if (error) throw error;

    await logActivity({
      adminId: req.admin!.id,
      adminEmail: req.admin!.email,
      actionType: 'delete',
      entityType: 'control_category',
      entityId: id,
      entityName: existing?.name || 'Unknown',
      oldValue: existing,
      description: `Deleted control category: ${existing?.name || 'Unknown'}`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.json({ message: 'Category deleted' });
  } catch (error: any) {
    handleError(res, error, 'Delete control category error');
  }
});

// ============ CONTROLS ============

// Get all controls
router.get('/controls', requireAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('controls')
      .select('*, control_categories(*)')
      .order('sort_order', { ascending: true });

    if (error) throw error;
    res.json(data || []);
  } catch (error: any) {
    handleError(res, error, 'Get controls error');
  }
});

// Create control
router.post('/controls', requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { title, description, category_id } = req.body;

    const { data: existing } = await supabase
      .from('controls')
      .select('sort_order')
      .eq('category_id', category_id)
      .order('sort_order', { ascending: false })
      .limit(1);

    const maxOrder = existing?.[0]?.sort_order || 0;

    const { data, error } = await supabase
      .from('controls')
      .insert({ title, description, category_id, sort_order: maxOrder + 1 })
      .select()
      .single();

    if (error) throw error;

    await logActivity({
      adminId: req.admin!.id,
      adminEmail: req.admin!.email,
      actionType: 'create',
      entityType: 'control',
      entityId: data.id,
      entityName: data.title,
      newValue: data,
      description: `Created control: ${data.title}`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.status(201).json(data);
  } catch (error: any) {
    handleError(res, error, 'Create control error');
  }
});

// Reorder controls (MUST be before /:id route)
router.patch('/controls/reorder', requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { orders } = req.body;

    if (!orders || !Array.isArray(orders)) {
      return res.status(400).json({ error: 'orders array is required' });
    }

    for (const item of orders) {
      const { error } = await supabase
        .from('controls')
        .update({ sort_order: item.sort_order })
        .eq('id', item.id);

      if (error) throw error;
    }

    await logActivity({
      adminId: req.admin!.id,
      adminEmail: req.admin!.email,
      actionType: 'reorder',
      entityType: 'control',
      description: `Reordered ${orders.length} controls`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.json({ message: 'Controls reordered successfully' });
  } catch (error: any) {
    handleError(res, error, 'Reorder controls error');
  }
});

// Update control
router.patch('/controls/:id', requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { title, description, category_id, sort_order } = req.body;

    const { data: existing } = await supabase.from('controls').select('*').eq('id', id).single();

    const { data, error } = await supabase
      .from('controls')
      .update({ title, description, category_id, sort_order })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    await logActivity({
      adminId: req.admin!.id,
      adminEmail: req.admin!.email,
      actionType: 'update',
      entityType: 'control',
      entityId: id,
      entityName: data.title,
      oldValue: existing,
      newValue: data,
      description: `Updated control: ${data.title}`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.json(data);
  } catch (error: any) {
    handleError(res, error, 'Update control error');
  }
});

// Delete control
router.delete('/controls/:id', requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const { data: existing } = await supabase.from('controls').select('*').eq('id', id).single();

    const { error } = await supabase.from('controls').delete().eq('id', id);
    if (error) throw error;

    await logActivity({
      adminId: req.admin!.id,
      adminEmail: req.admin!.email,
      actionType: 'delete',
      entityType: 'control',
      entityId: id,
      entityName: existing?.title || 'Unknown',
      oldValue: existing,
      description: `Deleted control: ${existing?.title || 'Unknown'}`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.json({ message: 'Control deleted' });
  } catch (error: any) {
    handleError(res, error, 'Delete control error');
  }
});

export default router;
