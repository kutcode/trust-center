import express from 'express';
import { supabase } from '../server';

const router = express.Router();
const DEFAULT_NDA_URL = '/nda-sample.html';

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
        nda_url: DEFAULT_NDA_URL,
      });
    }

    res.json({
      ...data,
      nda_url: data?.nda_url || DEFAULT_NDA_URL,
    });
  } catch (error: any) {
    console.error('Route error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
