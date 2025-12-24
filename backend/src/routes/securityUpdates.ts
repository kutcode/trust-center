import express from 'express';
import { supabase } from '../server';
import { requireAdmin } from '../middleware/auth';

const router = express.Router();

// Get all published security updates (public)
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('security_updates')
      .select('*')
      .not('published_at', 'is', null)
      .lte('published_at', new Date().toISOString())
      .order('published_at', { ascending: false });

    if (error) throw error;

    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create security update (admin only)
router.post('/', requireAdmin, async (req, res) => {
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

    res.status(201).json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update security update (admin only)
router.patch('/:id', requireAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('security_updates')
      .update(req.body)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;

    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Delete security update (admin only)
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const { error } = await supabase
      .from('security_updates')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;

    res.json({ message: 'Security update deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

