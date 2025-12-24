import express from 'express';
import { supabase } from '../server';
import { requireAdmin, AuthRequest } from '../middleware/auth';
import { generateMagicLinkToken, getMagicLinkExpiration } from '../utils/magicLink';
import { sendMagicLinkEmail, sendRejectionEmail } from '../utils/email';

const router = express.Router();

// Get all document requests (admin only)
router.get('/document-requests', requireAdmin, async (req, res) => {
  try {
    const { status, organization_id } = req.query;

    let query = supabase
      .from('document_requests')
      .select('*, organizations(*), documents(*)')
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    if (organization_id) {
      query = query.eq('organization_id', organization_id);
    }

    const { data, error } = await query;

    if (error) throw error;

    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get request details with history (admin only)
router.get('/document-requests/:id', requireAdmin, async (req, res) => {
  try {
    const { data: request, error } = await supabase
      .from('document_requests')
      .select('*, organizations(*), documents(*)')
      .eq('id', req.params.id)
      .single();

    if (error) throw error;

    // Get request history from same email
    const { data: history } = await supabase
      .from('document_requests')
      .select('id, status, created_at, document_ids, documents(title)')
      .eq('requester_email', request.requester_email)
      .neq('id', request.id)
      .order('created_at', { ascending: false })
      .limit(10);

    res.json({
      ...request,
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
    const { admin_notes } = req.body;

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
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) throw updateError;

    // If organization exists, add documents to approved list
    if (request.organization_id && request.organizations) {
      const currentApproved = request.organizations.approved_document_ids || [];
      const newApproved = [...new Set([...currentApproved, ...request.document_ids])];

      await supabase
        .from('organizations')
        .update({
          approved_document_ids: newApproved,
          last_approved_at: new Date().toISOString(),
          first_approved_at: request.organizations.first_approved_at || new Date().toISOString(),
        })
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

    // Get document titles
    const { data: documents } = await supabase
      .from('documents')
      .select('title')
      .in('id', request.document_ids);

    // Send magic link email
    const magicLinkUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/access/${token}`;
    await sendMagicLinkEmail({
      requesterName: request.requester_name,
      requesterEmail: request.requester_email,
      documents: documents || [],
      magicLinkUrl,
      expirationDate: expiration.toLocaleDateString(),
    });

    res.json(updatedRequest);
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

    const usersWithAdminStatus = authUsers?.map((user: any) => ({
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

    // Delete from admin_users first (due to foreign key)
    await supabase.from('admin_users').delete().eq('id', id);

    // Delete from auth.users (cascade should handle identities)
    const { error } = await supabase.from('auth.users').delete().eq('id', id);

    if (error) throw error;

    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

