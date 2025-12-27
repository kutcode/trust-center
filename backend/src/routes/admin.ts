import express from 'express';
import { supabase } from '../server';
import { requireAdmin, AuthRequest } from '../middleware/auth';
import { generateMagicLinkToken, getMagicLinkExpiration } from '../utils/magicLink';
import { sendMagicLinkEmail, sendRejectionEmail } from '../utils/email';
import { logActivity } from '../utils/activityLogger';

const router = express.Router();

// Get dashboard statistics (admin only)
router.get('/stats', requireAdmin, async (req, res) => {
  try {
    // Get pending requests count
    const { count: pendingCount } = await supabase
      .from('document_requests')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    // Get total organizations count (active only)
    const { count: totalOrgsCount } = await supabase
      .from('organizations')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    // Get organizations with approved documents
    const { data: orgs } = await supabase
      .from('organizations')
      .select('approved_document_ids, status')
      .eq('is_active', true);

    const approvedOrgsCount = orgs?.filter(org =>
      org.approved_document_ids && org.approved_document_ids.length > 0
    ).length || 0;

    // Get organization status counts
    const whitelistedCount = orgs?.filter(org => org.status === 'whitelisted').length || 0;
    const conditionalCount = orgs?.filter(org => org.status === 'conditional').length || 0;
    const noAccessCount = orgs?.filter(org => org.status === 'no_access').length || 0;

    // Get total published documents count
    const { count: totalDocsCount } = await supabase
      .from('documents')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'published')
      .eq('is_current_version', true);

    // Get open tickets count (new or in_progress)
    const { count: openTicketsCount } = await supabase
      .from('contact_submissions')
      .select('*', { count: 'exact', head: true })
      .in('status', ['new', 'in_progress']);

    res.json({
      pendingRequests: pendingCount || 0,
      totalOrganizations: totalOrgsCount || 0,
      openTickets: openTicketsCount || 0,
      totalDocuments: totalDocsCount || 0,
      organizationsByStatus: {
        whitelisted: whitelistedCount,
        conditional: conditionalCount,
        noAccess: noAccessCount,
      },
    });
  } catch (error: any) {
    console.error('Stats endpoint error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all document requests (admin only)
router.get('/document-requests', requireAdmin, async (req, res) => {
  try {
    const { status, organization_id } = req.query;

    console.log('Fetching document requests...');

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

    console.log('Document requests query result:', { count: data?.length, error: error?.message });

    if (error) {
      console.error('Document requests error:', error);
      throw error;
    }

    // Fetch document details for each request separately
    const requestsWithDocs = await Promise.all(
      (data || []).map(async (request) => {
        let documents: { id: string; title: string }[] = [];

        if (request.document_ids && request.document_ids.length > 0) {
          const { data: docs } = await supabase
            .from('documents')
            .select('id, title')
            .in('id', request.document_ids);
          documents = docs || [];
        }

        return { ...request, documents };
      })
    );

    console.log('Returning', requestsWithDocs.length, 'requests');
    res.json(requestsWithDocs);
  } catch (error: any) {
    console.error('Document requests route error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get request details with history (admin only)
router.get('/document-requests/:id', requireAdmin, async (req, res) => {
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
    res.status(500).json({ error: error.message });
  }
});

// Approve document request (admin only)
router.patch('/document-requests/:id/approve', requireAdmin, async (req: AuthRequest, res) => {
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
      // Check if organization has access (not blocked)
      const org = request.organizations as any;
      if (org.status === 'no_access' || !org.is_active) {
        return res.status(403).json({
          error: 'Cannot approve request. Organization access has been revoked.',
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

      // Set status to conditional if not already set (first approval)
      if (!org.status || org.status === 'no_access') {
        updateData.status = 'conditional';
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

    // Prepare document data with file paths for email attachments
    const documentsForEmail = (documents || []).map(doc => ({
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
        magicLinkUrl,
        expirationDate: expiration.toLocaleDateString(),
      });
      emailSent = true;
      console.log(`Email with attachments sent successfully to ${request.requester_email}`);
    } catch (emailErr: any) {
      emailError = emailErr.message;
      console.error(`Failed to send email to ${request.requester_email}:`, emailErr);
      // Continue - don't fail the request if email fails
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

    res.json({
      ...updatedRequest,
      emailSent,
      emailError: emailError || undefined,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Deny document request (admin only)
router.patch('/document-requests/:id/deny', requireAdmin, async (req: AuthRequest, res) => {
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

    res.json(request);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Batch approve requests (admin only)
router.post('/document-requests/batch-approve', requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { request_ids } = req.body;

    if (!Array.isArray(request_ids) || request_ids.length === 0) {
      return res.status(400).json({ error: 'request_ids array is required' });
    }

    const results = [];

    for (const requestId of request_ids) {
      // Approve each request (reuse approve logic)
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

    res.json({ success: true, results });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Batch deny requests (admin only)
router.post('/document-requests/batch-deny', requireAdmin, async (req: AuthRequest, res) => {
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

    res.json({ success: true, results });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get trust center settings (admin only)
router.get('/settings', requireAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('trust_center_settings')
      .select('*')
      .limit(1)
      .single();

    if (error) throw error;

    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update trust center settings (admin only)
router.patch('/settings', requireAdmin, async (req: AuthRequest, res) => {
  try {
    // Get existing settings or create new
    const { data: existing } = await supabase
      .from('trust_center_settings')
      .select('id')
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

    // Log settings update
    await logActivity({
      adminId: req.admin!.id,
      adminEmail: req.admin!.email,
      actionType: 'update',
      entityType: 'settings',
      entityId: data.id,
      entityName: 'Trust Center Settings',
      newValue: req.body,
      description: 'Updated trust center settings',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// User Management Routes

// Get all users (admin only)
router.get('/users', requireAdmin, async (req, res) => {
  try {
    // Use Supabase Auth Admin API to list users
    const { createClient } = require('@supabase/supabase-js');
    const adminSupabase = createClient(
      process.env.SUPABASE_URL || 'http://supabase-kong:8000',
      process.env.SUPABASE_SERVICE_KEY || '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const { data: { users: authUsers }, error: authError } = await adminSupabase.auth.admin.listUsers();

    if (authError) throw authError;

    // Get admin status for each user
    const { data: adminUsers } = await supabase
      .from('admin_users')
      .select('id, role, full_name');

    const adminMap = new Map(adminUsers?.map(au => [au.id, au]) || []);

    interface AuthUser {
      id: string;
      email: string;
      created_at: string;
      email_confirmed_at: string | null;
      user_metadata?: { full_name?: string };
    }

    const usersWithAdminStatus = authUsers?.map((user: AuthUser) => ({
      id: user.id,
      email: user.email,
      created_at: user.created_at,
      email_confirmed_at: user.email_confirmed_at,
      is_admin: adminMap.has(user.id),
      admin_role: adminMap.get(user.id)?.role || null,
      full_name: adminMap.get(user.id)?.full_name || user.user_metadata?.full_name || null,
    })) || [];

    res.json(usersWithAdminStatus);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create user (admin only)
router.post('/users', requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { email, password, full_name, is_admin, admin_role } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Use Supabase Auth Admin API to create user
    const { createClient } = require('@supabase/supabase-js');
    const adminSupabase = createClient(
      process.env.SUPABASE_URL || 'http://supabase-kong:8000',
      process.env.SUPABASE_SERVICE_KEY || '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const { data: authData, error: authError } = await adminSupabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: full_name || '' },
    });

    if (authError) {
      return res.status(400).json({ error: authError.message });
    }

    const userId = authData.user.id;

    // If admin user, add to admin_users table
    if (is_admin) {
      const { error: adminError } = await supabase
        .from('admin_users')
        .insert({
          id: userId,
          email,
          full_name: full_name || 'Admin User',
          role: admin_role || 'admin',
        });

      if (adminError) {
        // Try update if insert fails (user might already be admin)
        await supabase
          .from('admin_users')
          .upsert({
            id: userId,
            email,
            full_name: full_name || 'Admin User',
            role: admin_role || 'admin',
          });
      }
    }

    // Log user creation
    await logActivity({
      adminId: req.admin!.id,
      adminEmail: req.admin!.email,
      actionType: 'create',
      entityType: 'user',
      entityId: userId,
      entityName: email,
      newValue: { email, is_admin, full_name },
      description: `Created user: ${email}${is_admin ? ' (admin)' : ''}`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.json({
      success: true,
      user_id: userId,
      message: 'User created successfully',
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update user (admin only)
router.patch('/users/:id', requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { email, full_name, is_admin, admin_role, password } = req.body;

    // Update admin_users if admin status changed
    if (is_admin !== undefined) {
      if (is_admin) {
        // Add to admin_users
        const { error: adminError } = await supabase
          .from('admin_users')
          .upsert({
            id,
            email: email || undefined,
            full_name: full_name || undefined,
            role: admin_role || 'admin',
            updated_at: new Date().toISOString(),
          });

        if (adminError) throw adminError;
      } else {
        // Remove from admin_users
        const { error: adminError } = await supabase
          .from('admin_users')
          .delete()
          .eq('id', id);

        if (adminError) throw adminError;
      }
    } else if (full_name || admin_role) {
      // Update admin user info
      const { error: adminError } = await supabase
        .from('admin_users')
        .update({
          full_name: full_name || undefined,
          role: admin_role || undefined,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (adminError && adminError.code !== 'PGRST116') throw adminError;
    }

    // Update password if provided
    if (password) {
      const { createClient } = require('@supabase/supabase-js');
      const adminSupabase = createClient(
        process.env.SUPABASE_URL || 'http://supabase-kong:8000',
        process.env.SUPABASE_SERVICE_KEY || '',
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false,
          },
        }
      );

      const { error: passwordError } = await adminSupabase.auth.admin.updateUserById(id, {
        password,
      });

      if (passwordError) {
        console.warn('Password update failed:', passwordError.message);
        return res.status(500).json({ error: `Failed to update password: ${passwordError.message}` });
      }
    }

    res.json({ success: true, message: 'User updated successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Delete user (admin only)
router.delete('/users/:id', requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    // Get user info before deletion for logging
    const { data: userInfo } = await supabase
      .from('admin_users')
      .select('email, full_name')
      .eq('id', id)
      .single();

    // Delete from admin_users first (due to foreign key)
    await supabase.from('admin_users').delete().eq('id', id);

    // Delete from auth.users (cascade should handle identities)
    const { error } = await supabase.from('auth.users').delete().eq('id', id);

    if (error) throw error;

    // Log user deletion
    await logActivity({
      adminId: req.admin!.id,
      adminEmail: req.admin!.email,
      actionType: 'delete',
      entityType: 'user',
      entityId: id,
      entityName: userInfo?.email || 'Unknown user',
      oldValue: { email: userInfo?.email, full_name: userInfo?.full_name },
      description: `Deleted user: ${userInfo?.email || id}`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Change organization status (admin only)
router.patch('/organizations/:id/status', requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['whitelisted', 'conditional', 'no_access'].includes(status)) {
      return res.status(400).json({ error: 'Status is required and must be whitelisted, conditional, or no_access' });
    }

    // Get current org data for logging
    const { data: oldOrg } = await supabase
      .from('organizations')
      .select('name, status')
      .eq('id', id)
      .single();

    const updateData: any = {
      status,
    };

    // Set revoked_at when status changes to no_access
    if (status === 'no_access') {
      updateData.revoked_at = new Date().toISOString();
    } else {
      // Clear revoked_at when status changes away from no_access
      updateData.revoked_at = null;
    }

    const { data, error } = await supabase
      .from('organizations')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Log the activity
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
    res.status(500).json({ error: error.message });
  }
});

// Soft-delete organization (admin only)
router.delete('/organizations/:id', requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('organizations')
      .update({
        is_active: false,
        status: 'no_access',
        revoked_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Log organization removal
    await logActivity({
      adminId: req.admin!.id,
      adminEmail: req.admin!.email,
      actionType: 'delete',
      entityType: 'organization',
      entityId: id,
      entityName: data.name,
      oldValue: { is_active: true },
      newValue: { is_active: false, status: 'no_access' },
      description: `Removed organization: ${data.name}`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.json({
      message: 'Organization revoked successfully. Future access blocked.',
      organization: data
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Restore archived organization (admin only)
router.patch('/organizations/:id/restore', requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('organizations')
      .update({
        is_active: true,
        status: 'conditional',
        revoked_at: null,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Log organization restore
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

    res.json({
      message: 'Organization restored successfully.',
      organization: data
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// =====================
// TICKET MANAGEMENT ROUTES
// =====================

// Get all tickets (contact submissions)
router.get('/tickets', requireAdmin, async (req, res) => {
  try {
    const { status, priority } = req.query;

    // Simple query without relationship join to avoid schema cache issues
    let query = supabase
      .from('contact_submissions')
      .select('*')
      .order('created_at', { ascending: false });

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    if (priority && priority !== 'all') {
      query = query.eq('priority', priority);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Get message counts for each ticket (skip if ticket_messages table doesn't exist yet)
    let ticketsWithCounts = data || [];

    try {
      ticketsWithCounts = await Promise.all(
        (data || []).map(async (ticket) => {
          const { count } = await supabase
            .from('ticket_messages')
            .select('*', { count: 'exact', head: true })
            .eq('ticket_id', ticket.id);

          return {
            ...ticket,
            message_count: count || 0,
          };
        })
      );
    } catch (msgError) {
      // ticket_messages table may not exist, just return tickets with 0 count
      console.log('Note: ticket_messages query failed, returning 0 counts');
      ticketsWithCounts = (data || []).map(ticket => ({ ...ticket, message_count: 0 }));
    }

    res.json(ticketsWithCounts);
  } catch (error: any) {
    console.error('Get tickets error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get single ticket with messages
router.get('/tickets/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Get ticket details (simple query without relationship join)
    const { data: ticket, error: ticketError } = await supabase
      .from('contact_submissions')
      .select('*')
      .eq('id', id)
      .single();

    if (ticketError) throw ticketError;

    // Get messages
    const { data: messages, error: messagesError } = await supabase
      .from('ticket_messages')
      .select(`
        *,
        sender:sender_id(id, email, full_name)
      `)
      .eq('ticket_id', id)
      .order('created_at', { ascending: true });

    if (messagesError) throw messagesError;

    res.json({
      ...ticket,
      messages: messages || [],
    });
  } catch (error: any) {
    console.error('Get ticket error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Add message to ticket (sends email to user)
router.post('/tickets/:id/messages', requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Get ticket info
    const { data: ticket, error: ticketError } = await supabase
      .from('contact_submissions')
      .select('*')
      .eq('id', id)
      .single();

    if (ticketError || !ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    // Get admin info
    const { data: admin } = await supabase
      .from('admin_users')
      .select('full_name, email')
      .eq('id', req.admin!.id)
      .single();

    // Insert message
    const { data: newMessage, error: insertError } = await supabase
      .from('ticket_messages')
      .insert({
        ticket_id: id,
        sender_type: 'admin',
        sender_id: req.admin!.id,
        sender_name: admin?.full_name || admin?.email || 'Support',
        message: message.trim(),
      })
      .select()
      .single();

    if (insertError) throw insertError;

    // Update ticket status to in_progress if it was new
    if (ticket.status === 'new') {
      await supabase
        .from('contact_submissions')
        .update({ status: 'in_progress', assigned_to: req.admin!.id })
        .eq('id', id);
    }

    // Send email notification to user
    try {
      const { sendEmail } = require('../services/emailService');
      await sendEmail({
        to: ticket.email,
        from: process.env.SMTP_FROM || 'noreply@trustcenter.com',
        subject: `Re: ${ticket.subject} [#${id}]`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .message { background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0; }
              .footer { margin-top: 30px; font-size: 12px; color: #666; }
            </style>
          </head>
          <body>
            <div class="container">
              <h2>Response to Your Inquiry</h2>
              <p>Hi ${ticket.name},</p>
              <p>We've responded to your inquiry regarding: <strong>${ticket.subject}</strong></p>
              <div class="message">
                ${message.trim().replace(/\n/g, '<br>')}
              </div>
              <p>If you have any further questions, please reply to this ticket or submit a new contact form.</p>
              <div class="footer">
                <p><small>This is an automated response from our support team.</small></p>
              </div>
            </div>
          </body>
          </html>
        `,
      });
      console.log(`Ticket reply email sent to ${ticket.email}`);
    } catch (emailError: any) {
      console.error('Failed to send ticket reply email:', emailError.message);
      // Don't fail the request if email fails
    }

    res.json(newMessage);
  } catch (error: any) {
    console.error('Add ticket message error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update ticket status
router.patch('/tickets/:id/status', requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['new', 'in_progress', 'resolved'].includes(status)) {
      return res.status(400).json({ error: 'Valid status is required (new, in_progress, resolved)' });
    }

    const updateData: any = { status };

    // Auto-assign to admin who changes status
    if (status === 'in_progress') {
      updateData.assigned_to = req.admin!.id;
    }

    const { data, error } = await supabase
      .from('contact_submissions')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Log ticket status change
    await logActivity({
      adminId: req.admin!.id,
      adminEmail: req.admin!.email,
      actionType: 'status_change',
      entityType: 'ticket',
      entityId: id,
      entityName: data.subject,
      newValue: { status },
      description: `Changed ticket status to: ${status}`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.json(data);
  } catch (error: any) {
    console.error('Update ticket status error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update ticket priority
router.patch('/tickets/:id/priority', requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { priority } = req.body;

    if (!priority || !['low', 'normal', 'high', 'critical'].includes(priority)) {
      return res.status(400).json({ error: 'Valid priority is required (low, normal, high, critical)' });
    }

    const { data, error } = await supabase
      .from('contact_submissions')
      .update({ priority })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Log priority change
    await logActivity({
      adminId: req.admin!.id,
      adminEmail: req.admin!.email,
      actionType: 'priority_change',
      entityType: 'ticket',
      entityId: id,
      entityName: data.subject,
      newValue: { priority },
      description: `Changed ticket priority to: ${priority}`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.json(data);
  } catch (error: any) {
    console.error('Update ticket priority error:', error);
    res.status(500).json({ error: error.message });
  }
});

// =====================
// ACTIVITY LOGS ROUTES
// =====================

// Get activity logs with date filter
router.get('/activity-logs', requireAdmin, async (req, res) => {
  try {
    const { date, entity_type, action_type, limit = 100 } = req.query;

    let query = supabase
      .from('activity_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(Number(limit));

    // Filter by date (YYYY-MM-DD format)
    if (date) {
      const startOfDay = `${date}T00:00:00.000Z`;
      const endOfDay = `${date}T23:59:59.999Z`;
      query = query.gte('created_at', startOfDay).lte('created_at', endOfDay);
    }

    if (entity_type) {
      query = query.eq('entity_type', entity_type);
    }

    if (action_type) {
      query = query.eq('action_type', action_type);
    }

    const { data, error } = await query;

    if (error) throw error;

    res.json(data || []);
  } catch (error: any) {
    console.error('Get activity logs error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get activity log stats for a date range
router.get('/activity-logs/stats', requireAdmin, async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - Number(days));

    const { data, error } = await supabase
      .from('activity_logs')
      .select('created_at, action_type, entity_type')
      .gte('created_at', daysAgo.toISOString());

    if (error) throw error;

    // Group by date
    const byDate: Record<string, number> = {};
    const byAction: Record<string, number> = {};
    const byEntity: Record<string, number> = {};

    (data || []).forEach(log => {
      const date = new Date(log.created_at).toISOString().split('T')[0];
      byDate[date] = (byDate[date] || 0) + 1;
      byAction[log.action_type] = (byAction[log.action_type] || 0) + 1;
      byEntity[log.entity_type] = (byEntity[log.entity_type] || 0) + 1;
    });

    res.json({
      totalLogs: data?.length || 0,
      byDate,
      byAction,
      byEntity,
    });
  } catch (error: any) {
    console.error('Get activity log stats error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;

