import express from 'express';
import { createClient } from '@supabase/supabase-js';
import { supabase } from '../server';
import { requireAdmin, AuthRequest } from '../middleware/auth';
import { upload } from '../middleware/upload';
import { AppError } from '../middleware/errorHandler';
import fs from 'fs';
import path from 'path';

// Local file storage configuration
const UPLOADS_DIR = process.env.UPLOADS_DIR || '/app/uploads';

// Ensure uploads directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

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
      // Serve from local storage
      const filePath = path.join(UPLOADS_DIR, document.file_url);
      
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'File not found on server' });
      }

      res.setHeader('Content-Disposition', `attachment; filename="${document.file_name}"`);
      res.setHeader('Content-Type', document.file_type || 'application/octet-stream');
      
      return res.sendFile(filePath);
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

    // Use local file storage instead of Supabase Storage (more reliable for self-hosted)
    const fileExt = req.file.originalname.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const folderName = category_id ? `category-${category_id.substring(0, 8)}` : 'uncategorized';
    const filePath = `${folderName}/${fileName}`;
    const fullPath = path.join(UPLOADS_DIR, filePath);

    console.log('Saving file to:', fullPath);
    console.log('File size:', req.file.size, 'bytes');
    console.log('File type:', req.file.mimetype);

    // Ensure directory exists
    const dirPath = path.dirname(fullPath);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }

    // Write file to local storage
    fs.writeFileSync(fullPath, req.file.buffer);
    console.log('File saved successfully:', filePath);

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

    if (document && document.file_url) {
      // Delete file from local storage
      const filePath = path.join(UPLOADS_DIR, document.file_url);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log('Deleted file:', filePath);
      }
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

