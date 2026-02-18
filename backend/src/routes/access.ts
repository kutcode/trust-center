import express from 'express';
import { supabase } from '../server';
import fs from 'fs';
import path from 'path';
import { logActivity } from '../utils/activityLogger';

const UPLOADS_DIR = process.env.UPLOADS_DIR || '/app/uploads';

const router = express.Router();

// Validate magic link and show access page
router.get('/:token', async (req, res) => {
  try {
    const { token } = req.params;

    // First fetch the document request
    const { data: request, error } = await supabase
      .from('document_requests')
      .select('*')
      .eq('magic_link_token', token)
      .single();

    if (error || !request) {
      console.error('Magic link lookup failed:', error?.message || 'No request found');
      return res.status(404).json({ error: 'Invalid or expired link' });
    }

    // Check expiration
    if (request.magic_link_expires_at && new Date(request.magic_link_expires_at) < new Date()) {
      return res.status(403).json({ error: 'This link has expired' });
    }

    // Check status
    if (!['approved', 'auto_approved'].includes(request.status)) {
      return res.status(403).json({ error: 'Access not approved' });
    }

    // Fetch the documents separately using the document_ids array
    let documents: any[] = [];
    if (request.document_ids && request.document_ids.length > 0) {
      const { data: docs, error: docsError } = await supabase
        .from('documents')
        .select('id, title, description, file_name, file_type, file_size, access_level')
        .in('id', request.document_ids);

      if (!docsError && docs) {
        documents = docs;
      }
    }

    // Track access
    if (!request.magic_link_used_at) {
      await supabase
        .from('document_requests')
        .update({ magic_link_used_at: new Date().toISOString() })
        .eq('id', request.id);
    }

    res.json({
      request: {
        id: request.id,
        requester_name: request.requester_name,
        documents: documents,
      },
    });
  } catch (error: any) {
    console.error('Access route error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Download document via magic link
router.get('/:token/download/:document_id', async (req, res) => {
  try {
    const { token, document_id } = req.params;

    // Validate token and check document access
    const { data: request, error } = await supabase
      .from('document_requests')
      .select('document_ids, status, magic_link_expires_at, requester_email')
      .eq('magic_link_token', token)
      .single();

    if (error || !request) {
      return res.status(404).json({ error: 'Invalid or expired link' });
    }

    if (request.magic_link_expires_at && new Date(request.magic_link_expires_at) < new Date()) {
      return res.status(403).json({ error: 'This link has expired' });
    }

    if (!['approved', 'auto_approved'].includes(request.status)) {
      return res.status(403).json({ error: 'Access not approved' });
    }

    if (!request.document_ids.includes(document_id)) {
      return res.status(403).json({ error: 'Document not included in this request' });
    }

    // Get document
    const { data: document, error: docError } = await supabase
      .from('documents')
      .select('file_url, file_name, file_type, requires_nda')
      .eq('id', document_id)
      .single();

    if (docError || !document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // NDA check skipped for magic link downloads — users already
    // agreed to NDA terms when submitting the document request form

    // Serve from local storage (consistent with documents.ts)
    // Adjust path if file_url is relative
    const filePath = path.join(UPLOADS_DIR, document.file_url);

    if (!fs.existsSync(filePath)) {
      // In demo mode, generate a placeholder file since Railway's filesystem is ephemeral
      if (process.env.DEMO_MODE === 'true') {
        console.log(`[DEMO] File not found at ${filePath}, serving placeholder for ${document.file_name}`);

        const placeholderContent = `
=== DEMO DOCUMENT ===
Title: ${document.file_name}
Type: ${document.file_type || 'application/octet-stream'}

This is a placeholder document from the Trust Center demo.
The original file is not available in the demo environment.

In a production deployment, the actual document would be 
downloaded here after admin approval.

Thank you for testing the Trust Center!
===========================
`;
        res.setHeader('Content-Disposition', `attachment; filename="${document.file_name}"`);
        res.setHeader('Content-Type', 'text/plain');
        return res.send(placeholderContent);
      }

      console.error(`File not found at ${filePath}`);
      return res.status(404).json({ error: 'File not found on server' });
    }

    res.setHeader('Content-Disposition', `attachment; filename="${document.file_name}"`);
    res.setHeader('Content-Type', document.file_type || 'application/octet-stream');

    // Log document download
    await logActivity({
      adminId: 'public',
      adminEmail: request.requester_email,
      actionType: 'document_download',
      entityType: 'document',
      entityId: document_id,
      entityName: document.file_name,
      description: `Document downloaded by ${request.requester_email}: ${document.file_name}`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return res.sendFile(filePath);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Accept NDA via magic link token
router.post('/:token/accept-nda', async (req, res) => {
  try {
    const { token } = req.params;
    const userAgent = req.headers['user-agent'];
    const ip = req.ip;

    // Validate token
    const { data: request, error } = await supabase
      .from('document_requests')
      .select('requester_email, organization_id, status, magic_link_expires_at')
      .eq('magic_link_token', token)
      .single();

    if (error || !request) {
      return res.status(404).json({ error: 'Invalid or expired link' });
    }

    if (request.magic_link_expires_at && new Date(request.magic_link_expires_at) < new Date()) {
      return res.status(403).json({ error: 'This link has expired' });
    }

    // Insert acceptance
    const { error: insertError } = await supabase
      .from('nda_acceptances')
      .insert({
        email: request.requester_email,
        organization_id: request.organization_id,
        ip_address: ip,
        user_agent: userAgent
      });

    if (insertError) throw insertError;

    res.json({ message: 'NDA Accepted successfully' });

  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

