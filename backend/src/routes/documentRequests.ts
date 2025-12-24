import express from 'express';
import { supabase } from '../server';
import { requireAdmin, AuthRequest } from '../middleware/auth';
import { extractEmailDomain, isPersonalEmailDomain, getOrCreateOrganization } from '../utils/organization';
import { generateMagicLinkToken, getMagicLinkExpiration } from '../utils/magicLink';
import { sendMagicLinkEmail, sendRejectionEmail } from '../utils/email';
import { AppError } from '../middleware/errorHandler';

const router = express.Router();

// Submit document request (public, no auth)
router.post('/', async (req, res) => {
  try {
    const { name, email, company, document_ids, reason } = req.body;

    if (!name || !email || !company || !document_ids || !Array.isArray(document_ids) || document_ids.length === 0) {
      return res.status(400).json({ error: 'Name, email, company, and at least one document are required' });
    }

    // Extract email domain
    const emailDomain = extractEmailDomain(email);
    if (!emailDomain) {
      return res.status(400).json({ error: 'Invalid email address' });
    }

    // Get or create organization
    let organizationId: string | null = null;
    if (!isPersonalEmailDomain(emailDomain)) {
      const org = await getOrCreateOrganization(emailDomain, company);
      organizationId = org.id;
    }

    // Check organization's approved documents
    let approvedDocs: string[] = [];
    let pendingDocs: string[] = [];

    if (organizationId) {
      const { data: org } = await supabase
        .from('organizations')
        .select('approved_document_ids')
        .eq('id', organizationId)
        .single();

      if (org) {
        approvedDocs = document_ids.filter((docId: string) => 
          org.approved_document_ids.includes(docId)
        );
        pendingDocs = document_ids.filter((docId: string) => 
          !org.approved_document_ids.includes(docId)
        );
      } else {
        pendingDocs = document_ids;
      }
    } else {
      pendingDocs = document_ids;
    }

    // Handle auto-approved documents
    if (approvedDocs.length > 0) {
      const token = generateMagicLinkToken();
      const expiration = getMagicLinkExpiration();

      const { data: approvedRequest, error: approvedError } = await supabase
        .from('document_requests')
        .insert({
          requester_name: name,
          requester_email: email,
          requester_company: company,
          organization_id: organizationId,
          document_ids: approvedDocs,
          request_reason: reason,
          status: 'auto_approved',
          magic_link_token: token,
          magic_link_expires_at: expiration.toISOString(),
          auto_approved: true,
        })
        .select()
        .single();

      if (!approvedError && approvedRequest) {
        // Get document titles
        const { data: documents } = await supabase
          .from('documents')
          .select('title')
          .in('id', approvedDocs);

        // Send magic link email
        const magicLinkUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/access/${token}`;
        await sendMagicLinkEmail({
          requesterName: name,
          requesterEmail: email,
          documents: documents || [],
          magicLinkUrl,
          expirationDate: expiration.toLocaleDateString(),
        });
      }
    }

    // Handle pending documents
    if (pendingDocs.length > 0) {
      const { data: pendingRequest, error: pendingError } = await supabase
        .from('document_requests')
        .insert({
          requester_name: name,
          requester_email: email,
          requester_company: company,
          organization_id: organizationId,
          document_ids: pendingDocs,
          request_reason: reason,
          status: 'pending',
        })
        .select()
        .single();

      if (pendingError) throw pendingError;
    }

    res.json({
      success: true,
      auto_approved: approvedDocs.length > 0,
      message: approvedDocs.length > 0
        ? `Access granted for ${approvedDocs.length} document(s). Check your email for the access link.`
        : 'Your request has been submitted and is under review.',
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get request history by email (admin only)
router.get('/history/:email', requireAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('document_requests')
      .select('*, documents(*)')
      .eq('requester_email', req.params.email)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

