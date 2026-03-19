import express from 'express';
import { supabase } from '../../server';
import { requireAdmin, AuthRequest } from '../../middleware/auth';
import { logActivity } from '../../utils/activityLogger';
import { handleError } from '../../utils/errorHandler';

const router = express.Router();

// Get all tickets (contact submissions)
router.get('/', requireAdmin, async (req, res) => {
  try {
    const { status, priority } = req.query;

    let query = supabase
      .from('contact_submissions')
      .select('*')
      .order('created_at', { ascending: false });

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    if (priority && priority !== 'all') {
      query = query.eq('priority', priority);
    }

    const { data, error } = await query;
    if (error) throw error;

    let ticketsWithCounts = data || [];

    try {
      ticketsWithCounts = await Promise.all(
        (data || []).map(async (ticket) => {
          const { count } = await supabase
            .from('ticket_messages')
            .select('*', { count: 'exact', head: true })
            .eq('ticket_id', ticket.id);

          return { ...ticket, message_count: count || 0 };
        })
      );
    } catch (msgError) {
      ticketsWithCounts = (data || []).map(ticket => ({ ...ticket, message_count: 0 }));
    }

    res.json(ticketsWithCounts);
  } catch (error: any) {
    handleError(res, error, 'Get tickets error');
  }
});

// Get single ticket with messages
router.get('/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const { data: ticket, error: ticketError } = await supabase
      .from('contact_submissions')
      .select('*')
      .eq('id', id)
      .single();

    if (ticketError) throw ticketError;

    const { data: messages, error: messagesError } = await supabase
      .from('ticket_messages')
      .select(`*, sender:sender_id(id, email, full_name)`)
      .eq('ticket_id', id)
      .order('created_at', { ascending: true });

    if (messagesError) throw messagesError;

    res.json({ ...ticket, messages: messages || [] });
  } catch (error: any) {
    handleError(res, error, 'Get ticket error');
  }
});

// Add message to ticket (sends email to user)
router.post('/:id/messages', requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const { data: ticket, error: ticketError } = await supabase
      .from('contact_submissions')
      .select('*')
      .eq('id', id)
      .single();

    if (ticketError || !ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    const { data: admin } = await supabase
      .from('admin_users')
      .select('full_name, email')
      .eq('id', req.admin!.id)
      .single();

    const { data: newMessage, error: insertError } = await supabase
      .from('ticket_messages')
      .insert({
        ticket_id: id,
        sender_type: 'admin',
        sender_id: req.admin!.id,
        sender_name: admin?.full_name || admin?.email || 'Support',
        message: message.trim(),
      })
      .select()
      .single();

    if (insertError) throw insertError;

    if (ticket.status === 'new') {
      await supabase
        .from('contact_submissions')
        .update({ status: 'in_progress', assigned_to: req.admin!.id })
        .eq('id', id);
    }

    // Send email notification to user
    try {
      const { sendEmail } = require('../../services/emailService');
      await sendEmail({
        to: ticket.email,
        from: process.env.SMTP_FROM || 'noreply@trustcenter.com',
        subject: `Re: ${ticket.subject} [#${id}]`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .message { background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0; }
              .footer { margin-top: 30px; font-size: 12px; color: #666; }
            </style>
          </head>
          <body>
            <div class="container">
              <h2>Response to Your Inquiry</h2>
              <p>Hi ${ticket.name},</p>
              <p>We've responded to your inquiry regarding: <strong>${ticket.subject}</strong></p>
              <div class="message">
                ${message.trim().replace(/\n/g, '<br>')}
              </div>
              <p>If you have any further questions, please reply to this ticket or submit a new contact form.</p>
              <div class="footer">
                <p><small>This is an automated response from our support team.</small></p>
              </div>
            </div>
          </body>
          </html>
        `,
      });
    } catch (emailError: any) {
      console.error('Failed to send ticket reply email:', emailError.message);
    }

    res.json(newMessage);
  } catch (error: any) {
    handleError(res, error, 'Add ticket message error');
  }
});

// Update ticket status
router.patch('/:id/status', requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['new', 'in_progress', 'resolved'].includes(status)) {
      return res.status(400).json({ error: 'Valid status is required (new, in_progress, resolved)' });
    }

    const updateData: any = { status };
    if (status === 'in_progress') {
      updateData.assigned_to = req.admin!.id;
    }

    const { data, error } = await supabase
      .from('contact_submissions')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    await logActivity({
      adminId: req.admin!.id,
      adminEmail: req.admin!.email,
      actionType: 'status_change',
      entityType: 'ticket',
      entityId: id,
      entityName: data.subject,
      newValue: { status },
      description: `Changed ticket status to: ${status}`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.json(data);
  } catch (error: any) {
    handleError(res, error, 'Update ticket status error');
  }
});

// Update ticket priority
router.patch('/:id/priority', requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { priority } = req.body;

    if (!priority || !['low', 'normal', 'high', 'critical'].includes(priority)) {
      return res.status(400).json({ error: 'Valid priority is required (low, normal, high, critical)' });
    }

    const { data, error } = await supabase
      .from('contact_submissions')
      .update({ priority })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    await logActivity({
      adminId: req.admin!.id,
      adminEmail: req.admin!.email,
      actionType: 'priority_change',
      entityType: 'ticket',
      entityId: id,
      entityName: data.subject,
      newValue: { priority },
      description: `Changed ticket priority to: ${priority}`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.json(data);
  } catch (error: any) {
    handleError(res, error, 'Update ticket priority error');
  }
});

export default router;
