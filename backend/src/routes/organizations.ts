import express from 'express';
import { supabase } from '../server';
import { requireAdmin } from '../middleware/auth';

const router = express.Router();

// Get all organizations (admin only) - filter out soft-deleted
router.get('/', requireAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get organization by ID (admin only)
router.get('/:id', requireAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error) throw error;

    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update organization (admin only)
router.patch('/:id', requireAdmin, async (req, res) => {
  try {
    const { status, ...otherFields } = req.body;
    const updateData: any = { ...otherFields };

    // If status is being changed, handle revoked_at
    if (status) {
      if (!['whitelisted', 'conditional', 'no_access'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status. Must be whitelisted, conditional, or no_access' });
      }

      updateData.status = status;

      // Set revoked_at when status changes to no_access
      if (status === 'no_access') {
        updateData.revoked_at = new Date().toISOString();
      } else if (status !== 'no_access') {
        // Clear revoked_at when status changes away from no_access
        updateData.revoked_at = null;
      }
    }

    const { data, error } = await supabase
      .from('organizations')
      .update(updateData)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;

    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Change organization status (admin only)
router.patch('/:id/status', requireAdmin, async (req, res) => {
  try {
    const { status } = req.body;

    if (!status || !['whitelisted', 'conditional', 'no_access'].includes(status)) {
      return res.status(400).json({ error: 'Status is required and must be whitelisted, conditional, or no_access' });
    }

    const updateData: any = {
      status,
    };

    // Set revoked_at when status changes to no_access
    if (status === 'no_access') {
      updateData.revoked_at = new Date().toISOString();
    } else {
      // Clear revoked_at when status changes away from no_access
      updateData.revoked_at = null;
    }

    const { data, error } = await supabase
      .from('organizations')
      .update(updateData)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;

    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Soft-delete organization (admin only)
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('organizations')
      .update({
        is_active: false,
        status: 'no_access',
        revoked_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json({ 
      message: 'Organization revoked successfully. Future access blocked.',
      organization: data 
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

