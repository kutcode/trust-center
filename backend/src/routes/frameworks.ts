import express from 'express';
import { supabase } from '../server';

const router = express.Router();

// Get all frameworks (public)
router.get('/frameworks', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('frameworks')
            .select('*')
            .order('sort_order', { ascending: true });

        if (error) throw error;
        res.json(data || []);
    } catch (error: any) {
        console.error('Get frameworks error:', error);
        console.error('Route error:', error);
    res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
