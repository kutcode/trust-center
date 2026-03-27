import { supabase } from '../server';
import { sendEmail } from '../services/emailService';

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

async function getNotificationRecipients(): Promise<string[]> {
  const { data: settings } = await supabase
    .from('trust_center_settings')
    .select('notify_on_new_request, notification_emails, support_email')
    .limit(1)
    .single();

  if (!settings?.notify_on_new_request) return [];

  const recipients =
    settings.notification_emails && settings.notification_emails.length > 0
      ? settings.notification_emails
      : settings.support_email
        ? [settings.support_email]
        : [];

  return recipients;
}

export async function notifyAdminsOfNewRequest(request: {
  requester_name: string;
  requester_email: string;
  requester_company: string;
  document_count: number;
}): Promise<void> {
  const recipients = await getNotificationRecipients();
  if (recipients.length === 0) return;

  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #1a56db;">New Document Request</h2>
        <p>A new document request has been submitted and requires your review.</p>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr>
            <td style="padding: 8px 12px; font-weight: bold; border-bottom: 1px solid #eee;">Name</td>
            <td style="padding: 8px 12px; border-bottom: 1px solid #eee;">${escapeHtml(request.requester_name)}</td>
          </tr>
          <tr>
            <td style="padding: 8px 12px; font-weight: bold; border-bottom: 1px solid #eee;">Email</td>
            <td style="padding: 8px 12px; border-bottom: 1px solid #eee;">${escapeHtml(request.requester_email)}</td>
          </tr>
          <tr>
            <td style="padding: 8px 12px; font-weight: bold; border-bottom: 1px solid #eee;">Company</td>
            <td style="padding: 8px 12px; border-bottom: 1px solid #eee;">${escapeHtml(request.requester_company)}</td>
          </tr>
          <tr>
            <td style="padding: 8px 12px; font-weight: bold; border-bottom: 1px solid #eee;">Documents</td>
            <td style="padding: 8px 12px; border-bottom: 1px solid #eee;">${request.document_count} document(s)</td>
          </tr>
        </table>
        <a href="${frontendUrl}/admin/requests" style="display: inline-block; padding: 12px 24px; background-color: #1a56db; color: #fff; text-decoration: none; border-radius: 4px;">
          Review Request
        </a>
        <p style="margin-top: 30px; font-size: 12px; color: #666;">
          This is an automated notification from your Trust Center.
        </p>
      </div>
    </body>
    </html>
  `;

  const from = process.env.SMTP_FROM || 'noreply@trustcenter.com';

  for (const to of recipients) {
    try {
      await sendEmail({
        to,
        from,
        subject: `New document request from ${request.requester_name}`,
        html,
      });
      console.log(`Admin notification sent to ${to}`);
    } catch (err) {
      console.error(`Failed to send admin notification to ${to}:`, err);
    }
  }
}

export async function notifyAdminsOfNewTicket(ticket: {
  name: string;
  email: string;
  organization?: string | null;
  subject: string;
}): Promise<void> {
  // Check if support tickets are enabled
  const { data: settings } = await supabase
    .from('trust_center_settings')
    .select('support_tickets_enabled, notify_on_new_request, notification_emails, support_email')
    .limit(1)
    .single();

  if (!settings?.support_tickets_enabled || !settings?.notify_on_new_request) return;

  const recipients =
    settings.notification_emails && settings.notification_emails.length > 0
      ? settings.notification_emails
      : settings.support_email
        ? [settings.support_email]
        : [];

  if (recipients.length === 0) return;

  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #1a56db;">New Support Ticket</h2>
        <p>A new support ticket has been submitted.</p>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr>
            <td style="padding: 8px 12px; font-weight: bold; border-bottom: 1px solid #eee;">Subject</td>
            <td style="padding: 8px 12px; border-bottom: 1px solid #eee;">${escapeHtml(ticket.subject)}</td>
          </tr>
          <tr>
            <td style="padding: 8px 12px; font-weight: bold; border-bottom: 1px solid #eee;">From</td>
            <td style="padding: 8px 12px; border-bottom: 1px solid #eee;">${escapeHtml(ticket.name)} (${escapeHtml(ticket.email)})</td>
          </tr>
          ${ticket.organization ? `
          <tr>
            <td style="padding: 8px 12px; font-weight: bold; border-bottom: 1px solid #eee;">Organization</td>
            <td style="padding: 8px 12px; border-bottom: 1px solid #eee;">${escapeHtml(ticket.organization)}</td>
          </tr>
          ` : ''}
        </table>
        <a href="${frontendUrl}/admin/tickets" style="display: inline-block; padding: 12px 24px; background-color: #1a56db; color: #fff; text-decoration: none; border-radius: 4px;">
          View Ticket
        </a>
        <p style="margin-top: 30px; font-size: 12px; color: #666;">
          This is an automated notification from your Trust Center.
        </p>
      </div>
    </body>
    </html>
  `;

  const from = process.env.SMTP_FROM || 'noreply@trustcenter.com';

  for (const to of recipients) {
    try {
      await sendEmail({
        to,
        from,
        subject: `New support ticket: ${ticket.subject}`,
        html,
      });
      console.log(`Ticket notification sent to ${to}`);
    } catch (err) {
      console.error(`Failed to send ticket notification to ${to}:`, err);
    }
  }
}
