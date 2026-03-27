import express from 'express';
import { supabase } from '../server';
import { emailRateLimit } from '../middleware/rateLimit';
import { validateEmailAddress } from '../utils/emailValidation';
import { notifyAdminsOfNewTicket } from '../utils/adminNotifications';

const router = express.Router();

// Submit contact form (public)
router.post('/', emailRateLimit, async (req, res) => {
  try {
    const { name, email, organization, subject, message } = req.body;

    if (!name || !email || !subject || !message) {
      return res.status(400).json({ error: 'Name, email, subject, and message are required' });
    }

    const trimmedName = String(name).trim();
    const trimmedEmail = String(email).trim().toLowerCase();
    const trimmedOrganization = organization ? String(organization).trim() : null;
    const trimmedSubject = String(subject).trim();
    const trimmedMessage = String(message).trim();

    if (trimmedName.length < 2 || trimmedName.length > 120) {
      return res.status(400).json({ error: 'Name must be between 2 and 120 characters' });
    }

    if (!validateEmailAddress(trimmedEmail)) {
      return res.status(400).json({ error: 'Invalid email address' });
    }

    if (trimmedOrganization && trimmedOrganization.length > 120) {
      return res.status(400).json({ error: 'Organization must be 120 characters or less' });
    }

    if (trimmedSubject.length < 3 || trimmedSubject.length > 200) {
      return res.status(400).json({ error: 'Subject must be between 3 and 200 characters' });
    }

    if (trimmedMessage.length < 10 || trimmedMessage.length > 5000) {
      return res.status(400).json({ error: 'Message must be between 10 and 5000 characters' });
    }

    const { data, error } = await supabase
      .from('contact_submissions')
      .insert({
        name: trimmedName,
        email: trimmedEmail,
        organization: trimmedOrganization,
        subject: trimmedSubject,
        message: trimmedMessage,
        status: 'new',
      })
      .select()
      .single();

    if (error) throw error;

    // Notify admins of new support ticket (if tickets enabled)
    notifyAdminsOfNewTicket({
      name: trimmedName,
      email: trimmedEmail,
      organization: trimmedOrganization,
      subject: trimmedSubject,
    }).catch(err => console.error('Failed to send ticket notification:', err));

    res.status(201).json({ success: true, message: 'Contact form submitted successfully' });
  } catch (error: any) {
    console.error('Route error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
