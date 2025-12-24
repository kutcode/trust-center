import express from 'express';
import { supabase } from '../server';
import { requireAdmin, AuthRequest } from '../middleware/auth';
import { upload } from '../middleware/upload';
import { AppError } from '../middleware/errorHandler';

const router = express.Router();

// Get all published documents (public)
router.get('/', async (req, res) => {
  try {
    const { category_id, access_level } = req.query;

    let query = supabase
      .from('documents')
      .select('*, document_categories(*)')
      .eq('status', 'published')
      .eq('is_current_version', true)
      .order('created_at', { ascending: false });

    if (category_id) {
      query = query.eq('category_id', category_id);
    }

    if (access_level) {
      query = query.eq('access_level', access_level);
    }

    const { data, error } = await query;

    if (error) throw error;

    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get document by ID (public)
router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('documents')
      .select('*, document_categories(*)')
      .eq('id', req.params.id)
      .eq('status', 'published')
      .single();

    if (error) throw error;
    if (!data) {
      return res.status(404).json({ error: 'Document not found' });
    }

    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Download public document
router.get('/:id/download', async (req, res) => {
  try {
    const { data: document, error } = await supabase
      .from('documents')
      .select('*')
      .eq('id', req.params.id)
      .eq('status', 'published')
      .single();

    if (error || !document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Public documents can be downloaded directly
    if (document.access_level === 'public') {
      // Generate signed URL from Supabase Storage
      const { data: signedUrl, error: urlError } = await supabase
        .storage
        .from('compliance-documents')
        .createSignedUrl(document.file_url, 3600); // 1 hour expiry

      if (urlError) throw urlError;

      return res.redirect(signedUrl.signedUrl);
    }

    // Restricted documents require magic link validation (handled in access route)
    return res.status(403).json({ error: 'Access denied. Please use your magic link.' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Upload new document (admin only)
router.post('/', requireAdmin, upload.single('file'), async (req: AuthRequest, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { title, description, category_id, access_level, version, replaces_document_id } = req.body;

    if (!title || !access_level) {
      return res.status(400).json({ error: 'Title and access_level are required' });
    }

    // Upload file to Supabase Storage
    const fileExt = req.file.originalname.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `${category_id || 'uncategorized'}/${fileName}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('compliance-documents')
      .upload(filePath, req.file.buffer, {
        contentType: req.file.mimetype,
      });

    if (uploadError) throw uploadError;

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('compliance-documents')
      .getPublicUrl(filePath);

    // If replacing a document, mark old one as archived
    if (replaces_document_id) {
      await supabase
        .from('documents')
        .update({
          is_current_version: false,
          status: 'archived',
          archived_at: new Date().toISOString(),
        })
        .eq('id', replaces_document_id);
    }

    // Create document record
    const { data: document, error: docError } = await supabase
      .from('documents')
      .insert({
        title,
        description,
        category_id: category_id || null,
        access_level,
        file_url: filePath,
        file_name: req.file.originalname,
        file_size: req.file.size,
        file_type: req.file.mimetype,
        version: version || null,
        version_number: replaces_document_id ? 2 : 1,
        is_current_version: true,
        replaces_document_id: replaces_document_id || null,
        status: 'published',
        published_at: new Date().toISOString(),
        uploaded_by: req.admin!.id,
      })
      .select()
      .single();

    if (docError) throw docError;

    res.status(201).json(document);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update document (admin only)
router.patch('/:id', requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { data, error } = await supabase
      .from('documents')
      .update({
        ...req.body,
        updated_at: new Date().toISOString(),
      })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;

    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Delete document (admin only)
router.delete('/:id', requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { data: document } = await supabase
      .from('documents')
      .select('file_url')
      .eq('id', req.params.id)
      .single();

    if (document) {
      // Delete file from storage
      await supabase.storage
        .from('compliance-documents')
        .remove([document.file_url]);
    }

    const { error } = await supabase
      .from('documents')
      .update({ status: 'archived', archived_at: new Date().toISOString() })
      .eq('id', req.params.id);

    if (error) throw error;

    res.json({ message: 'Document archived successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get version history (admin only)
router.get('/:id/versions', requireAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .or(`id.eq.${req.params.id},replaces_document_id.eq.${req.params.id}`)
      .order('version_number', { ascending: false });

    if (error) throw error;

    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

