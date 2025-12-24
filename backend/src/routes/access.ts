import express from 'express';
import { supabase } from '../server';

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
      .select('document_ids, status, magic_link_expires_at')
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
      .select('file_url')
      .eq('id', document_id)
      .single();

    if (docError || !document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Generate signed URL
    const { data: signedUrl, error: urlError } = await supabase
      .storage
      .from('compliance-documents')
      .createSignedUrl(document.file_url, 3600); // 1 hour expiry

    if (urlError) throw urlError;

    res.redirect(signedUrl.signedUrl);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

