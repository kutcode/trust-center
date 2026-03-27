import express from 'express';
import { supabase } from '../../server';
import { dispatchWebhook } from '../../services/webhookDispatcher';
import { requireAdmin, AuthRequest } from '../../middleware/auth';
import { generateMagicLinkToken, getMagicLinkExpiration } from '../../utils/magicLink';
import { sendMagicLinkEmail, sendRejectionEmail } from '../../utils/email';
import { logActivity } from '../../utils/activityLogger';
import { handleError } from '../../utils/errorHandler';

const router = express.Router();

// Get all document requests (admin only)
router.get('/', requireAdmin, async (req, res) => {
  try {
    const { status, organization_id } = req.query;

    // First get document requests (without joining documents - no FK relationship)
    let query = supabase
      .from('document_requests')
      .select('*, organizations(id, name, email_domain)')
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    if (organization_id) {
      query = query.eq('organization_id', organization_id);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    // Batch-fetch all referenced documents in a single query
    const allDocIds = [...new Set((data || []).flatMap(r => r.document_ids || []))];
    let docMap = new Map<string, { id: string; title: string }>();
    if (allDocIds.length > 0) {
      const { data: allDocs } = await supabase
        .from('documents')
        .select('id, title')
        .in('id', allDocIds);
      docMap = new Map((allDocs || []).map(d => [d.id, d]));
    }

    const requestsWithDocs = (data || []).map(request => ({
      ...request,
      documents: (request.document_ids || [])
        .map((id: string) => docMap.get(id))
        .filter(Boolean),
    }));

    res.json(requestsWithDocs);
  } catch (error: any) {
    handleError(res, error, 'Document requests route error');
  }
});

// Get request details with history (admin only)
router.get('/:id', requireAdmin, async (req, res) => {
  try {
    const { data: request, error } = await supabase
      .from('document_requests')
      .select('*, organizations(id, name, email_domain)')
      .eq('id', req.params.id)
      .single();

    if (error) throw error;

    // Fetch document details
    let documents: { id: string; title: string }[] = [];
    if (request.document_ids && request.document_ids.length > 0) {
      const { data: docs } = await supabase
        .from('documents')
        .select('id, title')
        .in('id', request.document_ids);
      documents = docs || [];
    }

    // Get request history from same email
    const { data: history } = await supabase
      .from('document_requests')
      .select('id, status, created_at, document_ids')
      .eq('requester_email', request.requester_email)
      .neq('id', request.id)
      .order('created_at', { ascending: false })
      .limit(10);

    res.json({
      ...request,
      documents,
      history: history || [],
    });
  } catch (error: any) {
    handleError(res, error, 'Get request details error');
  }
});

// Approve document request (admin only)
router.patch('/:id/approve', requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { admin_notes, expiration_days } = req.body;

    // Get request
    const { data: request, error: requestError } = await supabase
      .from('document_requests')
      .select('*, organizations(*)')
      .eq('id', id)
      .single();

    if (requestError || !request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    // Generate magic link
    const token = generateMagicLinkToken();
    const expiration = getMagicLinkExpiration();

    // Calculate access expiration if specified
    let accessExpiresAt = null;
    if (expiration_days && expiration_days > 0) {
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + expiration_days);
      accessExpiresAt = expirationDate.toISOString();
    }

    // Update request
    const { data: updatedRequest, error: updateError } = await supabase
      .from('document_requests')
      .update({
        status: 'approved',
        magic_link_token: token,
        magic_link_expires_at: expiration.toISOString(),
        reviewed_by: req.admin!.id,
        reviewed_at: new Date().toISOString(),
        admin_notes: admin_notes || null,
        access_expires_at: accessExpiresAt,
        expiration_days: expiration_days || null,
      })
      .eq('id', id)
      .select()
      .single();


    if (updateError) throw updateError;

    // If organization exists, add documents to approved list
    if (request.organization_id && request.organizations) {
      // Check if organization has access (only block no_access)
      const org = request.organizations as any;
      if (org.status === 'no_access') {
        return res.status(403).json({
          error: 'Cannot approve request. Organization has been blocked (No Access).',
          organization_status: org.status
        });
      }

      const currentApproved = org.approved_document_ids || [];
      const newApproved = [...new Set([...currentApproved, ...request.document_ids])];

      // Set status to 'conditional' if this is the first approval (status not yet set)
      const updateData: any = {
        approved_document_ids: newApproved,
        last_approved_at: new Date().toISOString(),
        first_approved_at: org.first_approved_at || new Date().toISOString(),
      };

      // Restore archived orgs or set initial status
      if (!org.status || org.status === 'no_access' || org.status === 'archived' || !org.is_active) {
        updateData.status = 'conditional';
        updateData.is_active = true;
        updateData.revoked_at = null;
      }

      await supabase
        .from('organizations')
        .update(updateData)
        .eq('id', request.organization_id);

      // Create audit records
      for (const docId of request.document_ids) {
        await supabase
          .from('organization_document_approvals')
          .insert({
            organization_id: request.organization_id,
            document_id: docId,
            approved_by: req.admin!.id,
            request_id: id,
          });
      }
    }

    // Get full document details including file paths
    const { data: documents } = await supabase
      .from('documents')
      .select('id, title, file_url, file_name, file_type')
      .in('id', request.document_ids);

    // Prepare document data with file paths and IDs for email
    const documentsForEmail = (documents || []).map(doc => ({
      id: doc.id,
      title: doc.title,
      filePath: doc.file_url || undefined,
      fileName: doc.file_name || undefined,
      fileType: doc.file_type || undefined,
    }));

    // Send magic link email with attachments (non-blocking - don't fail request if email fails)
    const magicLinkUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/access/${token}`;
    let emailSent = false;
    let emailError = null;

    try {
      await sendMagicLinkEmail({
        requesterName: request.requester_name,
        requesterEmail: request.requester_email,
        documents: documentsForEmail,
        magicLinkToken: token,
        magicLinkUrl,
        expirationDate: expiration.toLocaleDateString(),
      });
      emailSent = true;
    } catch (emailErr: any) {
      emailError = emailErr.message;
      console.error(`Failed to send email to ${request.requester_email}:`, emailErr);
    }

    // Log the approval
    const docTitles = (documents || []).map(d => d.title).join(', ');
    await logActivity({
      adminId: req.admin!.id,
      adminEmail: req.admin!.email,
      actionType: 'approval',
      entityType: 'request',
      entityId: id,
      entityName: `Request from ${request.requester_name}`,
      oldValue: { status: 'pending' },
      newValue: { status: 'approved' },
      description: `Approved document request for: ${docTitles}`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    // Dispatch webhook
    dispatchWebhook('request.approved', updatedRequest);

    res.json({
      ...updatedRequest,
      emailSent,
      emailError: emailError || undefined,
    });
  } catch (error: any) {
    handleError(res, error, 'Approve request error');
  }
});

// Deny document request (admin only)
router.patch('/:id/deny', requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { admin_notes, reason } = req.body;

    const { data: request, error } = await supabase
      .from('document_requests')
      .update({
        status: 'denied',
        reviewed_by: req.admin!.id,
        reviewed_at: new Date().toISOString(),
        admin_notes: admin_notes || null,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Send rejection email
    await sendRejectionEmail(request.requester_email, request.requester_name, reason);

    // Log the denial
    await logActivity({
      adminId: req.admin!.id,
      adminEmail: req.admin!.email,
      actionType: 'denial',
      entityType: 'request',
      entityId: id,
      entityName: `Request from ${request.requester_name}`,
      oldValue: { status: 'pending' },
      newValue: { status: 'denied' },
      description: `Denied document request${reason ? `: ${reason}` : ''}`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    // Dispatch webhook
    dispatchWebhook('request.denied', { ...request, status: 'denied', admin_notes: admin_notes });

    res.json(request);
  } catch (error: any) {
    handleError(res, error, 'Deny request error');
  }
});

// Batch approve requests (admin only)
router.post('/batch-approve', requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { request_ids } = req.body;

    if (!Array.isArray(request_ids) || request_ids.length === 0) {
      return res.status(400).json({ error: 'request_ids array is required' });
    }

    const results = [];

    for (const requestId of request_ids) {
      const { data: request } = await supabase
        .from('document_requests')
        .select('*, organizations(*)')
        .eq('id', requestId)
        .single();

      if (request && request.status === 'pending') {
        const token = generateMagicLinkToken();
        const expiration = getMagicLinkExpiration();

        await supabase
          .from('document_requests')
          .update({
            status: 'approved',
            magic_link_token: token,
            magic_link_expires_at: expiration.toISOString(),
            reviewed_by: req.admin!.id,
            reviewed_at: new Date().toISOString(),
          })
          .eq('id', requestId);

        // Update organization approved documents
        if (request.organization_id) {
          const { data: org } = await supabase
            .from('organizations')
            .select('approved_document_ids')
            .eq('id', request.organization_id)
            .single();

          if (org) {
            const newApproved = [...new Set([...org.approved_document_ids, ...request.document_ids])];
            await supabase
              .from('organizations')
              .update({ approved_document_ids: newApproved })
              .eq('id', request.organization_id);
          }
        }

        results.push({ id: requestId, status: 'approved' });
      }
    }

    // Log bulk action
    await logActivity({
      adminId: req.admin!.id,
      adminEmail: req.admin!.email,
      actionType: 'bulk_approval',
      entityType: 'request',
      entityId: request_ids.join(','),
      entityName: `${results.length} requests`,
      description: `Bulk approved ${results.length} document requests`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    for (const r of results) {
      dispatchWebhook('request.approved', { id: r.id, status: 'approved' });
    }

    res.json({ success: true, results });
  } catch (error: any) {
    handleError(res, error, 'Batch approve error');
  }
});

// Batch deny requests (admin only)
router.post('/batch-deny', requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { request_ids, reason } = req.body;

    if (!Array.isArray(request_ids) || request_ids.length === 0) {
      return res.status(400).json({ error: 'request_ids array is required' });
    }

    const results = [];

    for (const requestId of request_ids) {
      const { data: request } = await supabase
        .from('document_requests')
        .select('requester_name, requester_email, status')
        .eq('id', requestId)
        .single();

      if (request && request.status === 'pending') {
        await supabase
          .from('document_requests')
          .update({
            status: 'denied',
            reviewed_by: req.admin!.id,
            reviewed_at: new Date().toISOString(),
            admin_notes: reason || null,
          })
          .eq('id', requestId);

        // Send rejection email
        try {
          await sendRejectionEmail(request.requester_email, request.requester_name, reason);
        } catch (emailErr) {
          console.error(`Failed to send rejection email to ${request.requester_email}`);
        }

        results.push({ id: requestId, status: 'denied' });
      }
    }

    // Log bulk action
    await logActivity({
      adminId: req.admin!.id,
      adminEmail: req.admin!.email,
      actionType: 'bulk_denial',
      entityType: 'request',
      entityId: request_ids.join(','),
      entityName: `${results.length} requests`,
      description: `Bulk denied ${results.length} document requests${reason ? `: ${reason}` : ''}`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    for (const r of results) {
      dispatchWebhook('request.denied', { id: r.id, status: 'denied' });
    }

    res.json({ success: true, results });
  } catch (error: any) {
    handleError(res, error, 'Batch deny error');
  }
});

export default router;
