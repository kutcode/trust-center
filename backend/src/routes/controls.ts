import express from 'express';
import { supabase } from '../server';

const router = express.Router();

// Get all control categories (public)
router.get('/control-categories', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('control_categories')
            .select('*')
            .order('sort_order', { ascending: true });

        if (error) throw error;
        res.json(data || []);
    } catch (error: any) {
        console.error('Get control categories error:', error);
        console.error('Route error:', error);
    res.status(500).json({ error: 'Internal server error' });
    }
});

// Get all controls (public)
router.get('/controls', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('controls')
            .select('*, control_categories(*), control_framework_mappings(*, frameworks(*))')
            .order('sort_order', { ascending: true });

        if (error) throw error;
        res.json(data || []);
    } catch (error: any) {
        console.error('Get controls error:', error);
        console.error('Route error:', error);
    res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
