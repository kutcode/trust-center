import express from 'express';
import { supabase } from '../server';
import fs from 'fs';
import path from 'path';

const UPLOADS_DIR = process.env.UPLOADS_DIR || '/app/uploads';

const router = express.Router();

// Validate magic link and show access page
router.get('/:token', async (req, res) => {
  try {
    const { token } = req.params;

    const { data: request, error } = await supabase
      .from('document_requests')
      .select('*, documents(*)')
      .eq('magic_link_token', token)
      .single();

    if (error || !request) {
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
        documents: request.documents,
      },
    });
  } catch (error: any) {
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

    // NDA is always required for all document access
    const { data: acceptance } = await supabase
      .from('nda_acceptances')
      .select('id')
      .eq('email', request.requester_email)
      .single();

    if (!acceptance) {
      return res.status(403).json({
        error: 'NDA_REQUIRED',
        message: 'You must accept the Non-Disclosure Agreement before accessing this document.'
      });
    }

    // Serve from local storage (consistent with documents.ts)
    // Adjust path if file_url is relative
    const filePath = path.join(UPLOADS_DIR, document.file_url);

    if (!fs.existsSync(filePath)) {
      console.error(`File not found at ${filePath}`);
      return res.status(404).json({ error: 'File not found on server' });
    }

    res.setHeader('Content-Disposition', `attachment; filename="${document.file_name}"`);
    res.setHeader('Content-Type', document.file_type || 'application/octet-stream');

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

