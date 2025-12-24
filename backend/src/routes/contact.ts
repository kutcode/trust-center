import express from 'express';
import { supabase } from '../server';

const router = express.Router();

// Submit contact form (public)
router.post('/', async (req, res) => {
  try {
    const { name, email, organization, subject, message } = req.body;

    if (!name || !email || !subject || !message) {
      return res.status(400).json({ error: 'Name, email, subject, and message are required' });
    }

    const { data, error } = await supabase
      .from('contact_submissions')
      .insert({
        name,
        email,
        organization: organization || null,
        subject,
        message,
        status: 'new',
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ success: true, message: 'Contact form submitted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

