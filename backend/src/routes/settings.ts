import express from 'express';
import { supabase } from '../server';

const router = express.Router();

// Get public trust center settings
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('trust_center_settings')
      .select('*')
      .limit(1)
      .single();

    if (error) {
      // Return default settings if none exist
      return res.json({
        company_name: 'Trust Center',
        hero_title: 'Security & Compliance',
        hero_subtitle: 'Your trusted partner for security and compliance documentation',
        primary_color: '#007bff',
        secondary_color: '#6c757d',
      });
    }

    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

