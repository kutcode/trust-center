import express from 'express';
import { supabase } from '../server';
import { dispatchWebhook } from '../services/webhookDispatcher';
import { requireAdmin, AuthRequest } from '../middleware/auth';
import { extractEmailDomain, isPersonalEmailDomain, getOrCreateOrganization, checkOrganizationAccess, canAutoApproveDocument } from '../utils/organization';
import { generateMagicLinkToken, getMagicLinkExpiration } from '../utils/magicLink';
import { sendMagicLinkEmail, sendRejectionEmail } from '../utils/email';
import { AppError } from '../middleware/errorHandler';
import { logActivity } from '../utils/activityLogger';

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

    // Check organization access status
    let approvedDocs: string[] = [];
    let pendingDocs: string[] = [];

    if (organizationId) {
      const accessCheck = await checkOrganizationAccess(organizationId);

      // Block if organization has no access
      if (!accessCheck.hasAccess) {
        return res.status(403).json({
          error: 'Access denied. Your organization does not have permission to request documents.',
          status: accessCheck.status
        });
      }

      // Whitelisted organizations: auto-approve ALL documents (including future ones)
      if (accessCheck.autoApproveAll) {
        approvedDocs = document_ids;
        pendingDocs = [];
      } else {
        // Conditional organizations: only approve documents in approved_document_ids
        for (const docId of document_ids) {
          const canApprove = await canAutoApproveDocument(organizationId, docId);
          if (canApprove) {
            approvedDocs.push(docId);
          } else {
            pendingDocs.push(docId);
          }
        }
      }
    } else {
      // Personal email domains: all documents pending
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
        // Dispatch webhook for auto-approved request
        dispatchWebhook('request.created', approvedRequest);

        // Log auto-approval
        const docTitles = (await supabase
          .from('documents')
          .select('title')
          .in('id', approvedDocs)
        ).data?.map(d => d.title).join(', ') || 'documents';

        await logActivity({
          adminId: 'system',
          adminEmail: 'system@auto-approve',
          actionType: 'request_auto_approved',
          entityType: 'request',
          entityId: approvedRequest.id,
          entityName: `Request from ${name}`,
          description: `Auto-approved document request for ${email}: ${docTitles}`,
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
        });

        // Get full document details including file paths
        const { data: documents } = await supabase
          .from('documents')
          .select('id, title, file_url, file_name, file_type')
          .in('id', approvedDocs);

        // Prepare document data with file paths and IDs for email
        const documentsForEmail = (documents || []).map(doc => ({
          id: doc.id,
          title: doc.title,
          filePath: doc.file_url || undefined,
          fileName: doc.file_name || undefined,
          fileType: doc.file_type || undefined,
        }));

        // Send magic link email with attachments
        const magicLinkUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/access/${token}`;
        try {
          await sendMagicLinkEmail({
            requesterName: name,
            requesterEmail: email,
            documents: documentsForEmail,
            magicLinkToken: token,
            magicLinkUrl,
            expirationDate: expiration.toLocaleDateString(),
          });
          console.log(`Auto-approval email with attachments sent to ${email}`);
        } catch (emailErr: any) {
          console.error(`Failed to send auto-approval email to ${email}:`, emailErr);
          // Continue - don't fail the request if email fails
        }
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

      // Dispatch webhook for pending request
      dispatchWebhook('request.created', pendingRequest);
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

