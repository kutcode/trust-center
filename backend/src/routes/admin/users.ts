import express from 'express';
import { supabase } from '../../server';
import { requireAdmin, AuthRequest } from '../../middleware/auth';
import { logActivity } from '../../utils/activityLogger';
import { handleError } from '../../utils/errorHandler';

const router = express.Router();

// Get all users (admin only)
router.get('/', requireAdmin, async (req, res) => {
  try {
    const { createClient } = require('@supabase/supabase-js');
    const adminSupabase = createClient(
      process.env.SUPABASE_URL || 'http://supabase-kong:8000',
      process.env.SUPABASE_SERVICE_KEY || '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { data: { users: authUsers }, error: authError } = await adminSupabase.auth.admin.listUsers();
    if (authError) throw authError;

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
    handleError(res, error, 'Get users error');
  }
});

// Create user (admin only)
router.post('/', requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { email, password, full_name, is_admin, admin_role } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const { createClient } = require('@supabase/supabase-js');
    const adminSupabase = createClient(
      process.env.SUPABASE_URL || 'http://supabase-kong:8000',
      process.env.SUPABASE_SERVICE_KEY || '',
      { auth: { autoRefreshToken: false, persistSession: false } }
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
    handleError(res, error, 'Create user error');
  }
});

// Update user (admin only)
router.patch('/:id', requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { email, full_name, is_admin, admin_role, password } = req.body;

    if (is_admin !== undefined) {
      if (is_admin) {
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
        const { error: adminError } = await supabase
          .from('admin_users')
          .delete()
          .eq('id', id);

        if (adminError) throw adminError;
      }
    } else if (full_name || admin_role) {
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

    if (password) {
      const { createClient } = require('@supabase/supabase-js');
      const adminSupabase = createClient(
        process.env.SUPABASE_URL || 'http://supabase-kong:8000',
        process.env.SUPABASE_SERVICE_KEY || '',
        { auth: { autoRefreshToken: false, persistSession: false } }
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
    handleError(res, error, 'Update user error');
  }
});

// Delete user (admin only)
router.delete('/:id', requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const { data: userInfo } = await supabase
      .from('admin_users')
      .select('email, full_name')
      .eq('id', id)
      .single();

    await supabase.from('admin_users').delete().eq('id', id);

    const { error } = await supabase.from('auth.users').delete().eq('id', id);
    if (error) throw error;

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
    handleError(res, error, 'Delete user error');
  }
});

export default router;
