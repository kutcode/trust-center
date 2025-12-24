import express from 'express';
import { supabase } from '../server';
import { requireAdmin } from '../middleware/auth';

const router = express.Router();

// Get all active certifications (public)
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('certifications')
      .select('*')
      .eq('status', 'active')
      .order('display_order', { ascending: true });

    if (error) throw error;

    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create certification (admin only)
router.post('/', requireAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('certifications')
      .insert(req.body)
      .select()
      .single();

    if (error) throw error;

    res.status(201).json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update certification (admin only)
router.patch('/:id', requireAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('certifications')
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

// Delete certification (admin only)
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const { error } = await supabase
      .from('certifications')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;

    res.json({ message: 'Certification deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

