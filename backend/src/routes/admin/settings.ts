import express from 'express';
import { supabase } from '../../server';
import { requireAdmin, AuthRequest } from '../../middleware/auth';
import { logActivity } from '../../utils/activityLogger';
import { handleError } from '../../utils/errorHandler';

const router = express.Router();
const DEFAULT_NDA_URL = '/nda-sample.html';

// Get trust center settings (admin only)
router.get('/', requireAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('trust_center_settings')
      .select('*')
      .limit(1)
      .single();

    if (error) throw error;

    res.json({
      ...data,
      nda_url: data?.nda_url || DEFAULT_NDA_URL,
    });
  } catch (error: any) {
    handleError(res, error, 'Get settings error');
  }
});

// Update trust center settings (admin only)
router.patch('/', requireAdmin, async (req: AuthRequest, res) => {
  try {
    // Get existing settings for comparison
    const { data: existing } = await supabase
      .from('trust_center_settings')
      .select('*')
      .limit(1)
      .single();

    let data;
    if (existing) {
      const { data: updated, error } = await supabase
        .from('trust_center_settings')
        .update({
          ...req.body,
          updated_by: req.admin!.id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) throw error;
      data = updated;
    } else {
      const { data: created, error } = await supabase
        .from('trust_center_settings')
        .insert({
          ...req.body,
          updated_by: req.admin!.id,
        })
        .select()
        .single();

      if (error) throw error;
      data = created;
    }

    // Categorize what changed for better logging
    const changedFields = Object.keys(req.body);
    const changeCategories: string[] = [];

    const logoFields = ['logo_url', 'favicon_url', 'logo'];
    if (changedFields.some(f => logoFields.includes(f))) {
      changeCategories.push('logo/icon');
    }

    if (changedFields.includes('nda_url') || changedFields.includes('nda_document_url')) {
      changeCategories.push('NDA URL');
    }

    const brandingFields = ['primary_color', 'secondary_color', 'company_name', 'font_family'];
    if (changedFields.some(f => brandingFields.includes(f))) {
      changeCategories.push('branding');
    }

    const contentFields = ['hero_title', 'hero_subtitle', 'footer_text', 'footer_links'];
    if (changedFields.some(f => contentFields.includes(f))) {
      changeCategories.push('content');
    }

    const toggleFields = ['show_certifications', 'show_documents', 'show_security_updates', 'show_controls', 'light_mode', 'dark_mode'];
    if (changedFields.some(f => toggleFields.includes(f))) {
      changeCategories.push('visibility settings');
    }

    let actionType = 'settings_update';
    if (changeCategories.includes('logo/icon')) {
      actionType = 'settings_logo_changed';
    } else if (changeCategories.includes('NDA URL')) {
      actionType = 'settings_nda_changed';
    }

    const description = changeCategories.length > 0
      ? `Updated settings: ${changeCategories.join(', ')}`
      : `Updated settings: ${changedFields.join(', ')}`;

    await logActivity({
      adminId: req.admin!.id,
      adminEmail: req.admin!.email,
      actionType: actionType,
      entityType: 'settings',
      entityId: data.id,
      entityName: 'Trust Center Settings',
      oldValue: existing,
      newValue: data,
      description: description,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.json(data);
  } catch (error: any) {
    handleError(res, error, 'Update settings error');
  }
});

export default router;
