import express from 'express';
import { supabase } from '../../server';
import { requireAdmin, AuthRequest } from '../../middleware/auth';
import { logActivity } from '../../utils/activityLogger';
import { handleError } from '../../utils/errorHandler';

const router = express.Router();

// Bulk organization actions
router.post('/bulk', requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { ids, action } = req.body || {};
    const orgIds = Array.isArray(ids)
      ? Array.from(new Set(ids.map((id) => String(id).trim()).filter(Boolean)))
      : [];

    if (orgIds.length === 0) {
      return res.status(400).json({ error: 'At least one organization id is required' });
    }

    if (!['archive', 'restore', 'permanent_delete'].includes(action)) {
      return res.status(400).json({ error: 'Invalid bulk action. Must be archive, restore, or permanent_delete' });
    }

    const { data: existingOrgs, error: existingError } = await supabase
      .from('organizations')
      .select('id, name, is_active, status')
      .in('id', orgIds);

    if (existingError) throw existingError;

    const organizations = existingOrgs || [];
    if (organizations.length === 0) {
      return res.status(404).json({ error: 'No organizations found for the provided ids' });
    }

    let affectedCount = 0;

    if (action === 'archive') {
      const archiveIds = organizations.filter((org: any) => org.is_active !== false).map((org: any) => org.id);
      if (archiveIds.length > 0) {
        const { error } = await supabase
          .from('organizations')
          .update({ is_active: false, status: 'conditional', revoked_at: new Date().toISOString() })
          .in('id', archiveIds);
        if (error) throw error;
      }
      affectedCount = archiveIds.length;
    }

    if (action === 'restore') {
      const restoreIds = organizations.filter((org: any) => org.is_active === false).map((org: any) => org.id);
      if (restoreIds.length > 0) {
        const { error } = await supabase
          .from('organizations')
          .update({ is_active: true, status: 'conditional', revoked_at: null })
          .in('id', restoreIds);
        if (error) throw error;
      }
      affectedCount = restoreIds.length;
    }

    if (action === 'permanent_delete') {
      const deleteCandidates = organizations.filter((org: any) => org.is_active === false);
      const deleteIds = deleteCandidates.map((org: any) => org.id);
      if (deleteIds.length > 0) {
        const { error } = await supabase.from('organizations').delete().in('id', deleteIds);
        if (error) throw error;
      }
      affectedCount = deleteIds.length;
    }

    await logActivity({
      adminId: req.admin!.id,
      adminEmail: req.admin!.email,
      actionType: action === 'permanent_delete' ? 'delete' : action,
      entityType: 'organization',
      entityId: undefined,
      entityName: `${affectedCount} organizations`,
      oldValue: { ids: orgIds, action },
      newValue: { affectedCount },
      description: `Bulk organization action "${action}" applied to ${affectedCount} organization(s)`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.json({ success: true, action, requestedCount: orgIds.length, foundCount: organizations.length, affectedCount });
  } catch (error: any) {
    handleError(res, error, 'Bulk organization action error');
  }
});

// Change organization status
router.patch('/:id/status', requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['whitelisted', 'conditional', 'no_access', 'archived'].includes(status)) {
      return res.status(400).json({ error: 'Status is required and must be whitelisted, conditional, no_access, or archived' });
    }

    const { data: oldOrg } = await supabase.from('organizations').select('name, status').eq('id', id).single();

    const updateData: any = { status };
    if (status === 'no_access' || status === 'archived') {
      updateData.revoked_at = new Date().toISOString();
      updateData.is_active = false;
    } else {
      updateData.revoked_at = null;
      updateData.is_active = true;
    }

    const { data, error } = await supabase.from('organizations').update(updateData).eq('id', id).select().single();
    if (error) throw error;

    await logActivity({
      adminId: req.admin!.id,
      adminEmail: req.admin!.email,
      actionType: 'status_change',
      entityType: 'organization',
      entityId: id,
      entityName: oldOrg?.name || data.name,
      oldValue: { status: oldOrg?.status },
      newValue: { status },
      description: `Changed organization status from "${oldOrg?.status}" to "${status}"`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.json(data);
  } catch (error: any) {
    handleError(res, error, 'Change organization status error');
  }
});

// Permanently delete an archived organization
router.delete('/:id/permanent', requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const { data: org, error: fetchError } = await supabase.from('organizations').select('*').eq('id', id).single();
    if (fetchError) throw fetchError;
    if (!org) return res.status(404).json({ error: 'Organization not found' });
    if (org.is_active !== false) {
      return res.status(400).json({ error: 'Only archived organizations can be permanently deleted' });
    }

    const { error } = await supabase.from('organizations').delete().eq('id', id);
    if (error) throw error;

    await logActivity({
      adminId: req.admin!.id,
      adminEmail: req.admin!.email,
      actionType: 'delete',
      entityType: 'organization',
      entityId: id,
      entityName: org.name,
      oldValue: { is_active: false, status: org.status, email_domain: org.email_domain },
      newValue: null,
      description: `Permanently deleted archived organization: ${org.name}`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.json({ success: true, message: 'Organization permanently deleted' });
  } catch (error: any) {
    handleError(res, error, 'Permanent delete organization error');
  }
});

// Soft-delete organization
router.delete('/:id', requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('organizations')
      .update({ is_active: false, status: 'conditional', revoked_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    await logActivity({
      adminId: req.admin!.id,
      adminEmail: req.admin!.email,
      actionType: 'delete',
      entityType: 'organization',
      entityId: id,
      entityName: data.name,
      oldValue: { is_active: true },
      newValue: { is_active: false, status: 'conditional' },
      description: `Archived organization: ${data.name} (pending review)`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.json({ message: 'Organization archived successfully. Can be restored later.', organization: data });
  } catch (error: any) {
    handleError(res, error, 'Delete organization error');
  }
});

// Restore archived organization
router.patch('/:id/restore', requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('organizations')
      .update({ is_active: true, status: 'conditional', revoked_at: null })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    await logActivity({
      adminId: req.admin!.id,
      adminEmail: req.admin!.email,
      actionType: 'restore',
      entityType: 'organization',
      entityId: id,
      entityName: data.name,
      oldValue: { is_active: false, status: 'no_access' },
      newValue: { is_active: true, status: 'conditional' },
      description: `Restored organization: ${data.name}`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.json({ message: 'Organization restored successfully.', organization: data });
  } catch (error: any) {
    handleError(res, error, 'Restore organization error');
  }
});

export default router;
