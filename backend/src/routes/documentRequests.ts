import express from 'express';
import { supabase } from '../server';
import { dispatchWebhook } from '../services/webhookDispatcher';
import { requireAdmin, AuthRequest } from '../middleware/auth';
import { extractEmailDomain, isPersonalEmailDomain, getOrCreateOrganization, checkOrganizationAccess, canAutoApproveDocument } from '../utils/organization';
import { generateMagicLinkToken, getMagicLinkExpiration } from '../utils/magicLink';
import { sendMagicLinkEmail, sendRejectionEmail } from '../utils/email';
import { AppError } from '../middleware/errorHandler';
import { logActivity } from '../utils/activityLogger';
import { emailRateLimit } from '../middleware/rateLimit';
import { validateEmailAddress } from '../utils/emailValidation';
import { notifyAdminsOfNewRequest } from '../utils/adminNotifications';

const router = express.Router();

// Submit document request (public, no auth)
router.post('/', emailRateLimit, async (req, res) => {
  try {
    const { name, email, company, document_ids, reason } = req.body;

    if (!name || !email || !company || !document_ids || !Array.isArray(document_ids) || document_ids.length === 0) {
      return res.status(400).json({ error: 'Name, email, company, and at least one document are required' });
    }

    const trimmedName = String(name).trim();
    const trimmedEmail = String(email).trim().toLowerCase();
    const trimmedCompany = String(company).trim();
    const trimmedReason = reason ? String(reason).trim() : null;

    if (trimmedName.length < 2 || trimmedName.length > 120) {
      return res.status(400).json({ error: 'Name must be between 2 and 120 characters' });
    }

    if (!validateEmailAddress(trimmedEmail)) {
      return res.status(400).json({ error: 'Invalid email address' });
    }

    if (trimmedCompany.length < 2 || trimmedCompany.length > 120) {
      return res.status(400).json({ error: 'Company must be between 2 and 120 characters' });
    }

    if (trimmedReason && trimmedReason.length > 2000) {
      return res.status(400).json({ error: 'Reason must be 2000 characters or less' });
    }

    if (document_ids.length > 20) {
      return res.status(400).json({ error: 'A maximum of 20 documents can be requested at once' });
    }

    const normalizedDocumentIds = Array.from(
      new Set(
        document_ids
          .filter((id: unknown) => typeof id === 'string')
          .map((id: string) => id.trim())
          .filter((id: string) => id.length > 0)
      )
    );

    if (normalizedDocumentIds.length === 0) {
      return res.status(400).json({ error: 'At least one valid document ID is required' });
    }

    // Extract email domain
    const emailDomain = extractEmailDomain(trimmedEmail);
    if (!emailDomain) {
      return res.status(400).json({ error: 'Invalid email address' });
    }

    // Get or create organization
    let organizationId: string | null = null;
    if (!isPersonalEmailDomain(emailDomain)) {
      const org = await getOrCreateOrganization(emailDomain, trimmedCompany);
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
        approvedDocs = normalizedDocumentIds;
        pendingDocs = [];
      } else if (accessCheck.isArchived) {
        // Archived orgs: all docs go to pending, even previously approved ones
        pendingDocs = normalizedDocumentIds;
      } else {
        // Conditional organizations: only approve documents in approved_document_ids
        for (const docId of normalizedDocumentIds) {
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
      pendingDocs = normalizedDocumentIds;
    }

    // Handle auto-approved documents
    if (approvedDocs.length > 0) {
      const token = generateMagicLinkToken();
      const expiration = getMagicLinkExpiration();

      const { data: approvedRequest, error: approvedError } = await supabase
        .from('document_requests')
        .insert({
          requester_name: trimmedName,
          requester_email: trimmedEmail,
          requester_company: trimmedCompany,
          organization_id: organizationId,
          document_ids: approvedDocs,
          request_reason: trimmedReason,
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
          entityName: `Request from ${trimmedName}`,
          description: `Auto-approved document request for ${trimmedEmail}: ${docTitles}`,
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
            requesterName: trimmedName,
            requesterEmail: trimmedEmail,
            documents: documentsForEmail,
            magicLinkToken: token,
            magicLinkUrl,
            expirationDate: expiration.toLocaleDateString(),
          });
          console.log(`Auto-approval email with attachments sent to ${trimmedEmail}`);
        } catch (emailErr: any) {
          console.error(`Failed to send auto-approval email to ${trimmedEmail}:`, emailErr);
          // Continue - don't fail the request if email fails
        }
      }
    }

    // Handle pending documents
    if (pendingDocs.length > 0) {
      const { data: pendingRequest, error: pendingError } = await supabase
        .from('document_requests')
        .insert({
          requester_name: trimmedName,
          requester_email: trimmedEmail,
          requester_company: trimmedCompany,
          organization_id: organizationId,
          document_ids: pendingDocs,
          request_reason: trimmedReason,
          status: 'pending',
        })
        .select()
        .single();

      if (pendingError) throw pendingError;

      // Dispatch webhook for pending request
      dispatchWebhook('request.created', pendingRequest);

      // Notify admins of new pending request
      notifyAdminsOfNewRequest({
        requester_name: trimmedName,
        requester_email: trimmedEmail,
        requester_company: trimmedCompany,
        document_count: pendingDocs.length,
      }).catch(err => console.error('Failed to send admin notification:', err));
    }

    res.json({
      success: true,
      auto_approved: approvedDocs.length > 0,
      message: approvedDocs.length > 0
        ? `Access granted for ${approvedDocs.length} document(s). Check your email for the access link.`
        : 'Your request has been submitted and is under review.',
    });
  } catch (error: any) {
    console.error('Route error:', error);
    res.status(500).json({ error: 'Internal server error' });
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
    console.error('Route error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
