/**
 * Webhooks Router
 * Handles inbound webhooks from external services (SendGrid, etc.)
 * These endpoints don't require authentication - they use their own verification methods
 */

import express, { Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import multer from 'multer';

const router = express.Router();

// Initialize Supabase client
const supabase = createClient(
    process.env.SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_KEY || ''
);

// Multer middleware for parsing multipart form data (SendGrid sends form data)
const upload = multer();

/**
 * Extract ticket ID from email subject
 * Format: "Re: Subject Text [#ticket-uuid]"
 */
function extractTicketId(subject: string): string | null {
    const match = subject.match(/\[#([a-f0-9-]{36})\]/i);
    return match ? match[1] : null;
}

/**
 * Extract plain text message from email body
 * Strips quoted text and signatures
 */
function extractMessageBody(text: string, html?: string): string {
    // Try plain text first
    let message = text || '';

    // If no plain text, extract from HTML
    if (!message && html) {
        // Simple HTML to text conversion
        message = html
            .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
            .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
            .replace(/<[^>]+>/g, '\n')
            .replace(/&nbsp;/g, ' ')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/\n\s*\n/g, '\n\n')
            .trim();
    }

    // Remove quoted text (lines starting with > or On ... wrote:)
    const lines = message.split('\n');
    const cleanLines: string[] = [];
    let hitQuote = false;

    for (const line of lines) {
        // Stop at quoted text markers
        if (line.match(/^>/) || line.match(/^On .+ wrote:$/i) || line.match(/^-{3,}/) || line.match(/^_{3,}/)) {
            hitQuote = true;
            break;
        }
        // Stop at common signature markers
        if (line.match(/^--\s*$/) || line.match(/^Sent from my/i) || line.match(/^Get Outlook/i)) {
            break;
        }
        cleanLines.push(line);
    }

    return cleanLines.join('\n').trim();
}

/**
 * POST /api/webhooks/inbound-email
 * Receives parsed emails from SendGrid Inbound Parse
 * 
 * SendGrid sends multipart form data with these fields:
 * - from: Sender email
 * - to: Recipient email
 * - subject: Email subject
 * - text: Plain text body
 * - html: HTML body
 * - envelope: JSON with sender/recipient info
 */
router.post('/inbound-email', upload.none(), async (req: Request, res: Response) => {
    try {
        console.log('[Inbound Email] Received webhook');

        const { from, subject, text, html, envelope } = req.body;

        if (!from || !subject) {
            console.log('[Inbound Email] Missing required fields');
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Extract ticket ID from subject
        const ticketId = extractTicketId(subject);

        if (!ticketId) {
            console.log(`[Inbound Email] No ticket ID found in subject: ${subject}`);
            // Still return 200 to prevent SendGrid from retrying
            return res.status(200).json({ message: 'No ticket ID found, email ignored' });
        }

        console.log(`[Inbound Email] Processing reply for ticket: ${ticketId}`);

        // Verify ticket exists
        const { data: ticket, error: ticketError } = await supabase
            .from('contact_submissions')
            .select('*')
            .eq('id', ticketId)
            .single();

        if (ticketError || !ticket) {
            console.log(`[Inbound Email] Ticket not found: ${ticketId}`);
            return res.status(200).json({ message: 'Ticket not found, email ignored' });
        }

        // Extract sender name from "from" field (format: "Name <email@domain.com>")
        let senderName = ticket.name;
        let senderEmail = from;
        const nameMatch = from.match(/^"?([^"<]+)"?\s*<(.+)>$/);
        if (nameMatch) {
            senderName = nameMatch[1].trim();
            senderEmail = nameMatch[2].trim();
        }

        // Extract clean message body
        const messageBody = extractMessageBody(text, html);

        if (!messageBody) {
            console.log('[Inbound Email] Empty message body');
            return res.status(200).json({ message: 'Empty message, email ignored' });
        }

        // Save message to database
        const { data: newMessage, error: insertError } = await supabase
            .from('ticket_messages')
            .insert({
                ticket_id: ticketId,
                sender_type: 'user',
                sender_id: null,
                sender_name: senderName,
                message: messageBody,
            })
            .select()
            .single();

        if (insertError) {
            console.error('[Inbound Email] Failed to save message:', insertError);
            throw insertError;
        }

        console.log(`[Inbound Email] Message saved for ticket ${ticketId}`);

        // Update ticket status to in_progress if it was resolved (user replied)
        if (ticket.status === 'resolved') {
            await supabase
                .from('contact_submissions')
                .update({ status: 'in_progress' })
                .eq('id', ticketId);

            console.log(`[Inbound Email] Ticket ${ticketId} status updated to in_progress`);
        }

        // Return success
        res.status(200).json({
            success: true,
            ticketId,
            messageId: newMessage.id
        });

    } catch (error: any) {
        console.error('[Inbound Email] Error processing webhook:', error);
        // Return 200 to prevent SendGrid from retrying (we log the error anyway)
        res.status(200).json({ error: 'Internal error, logged' });
    }
});

export default router;
