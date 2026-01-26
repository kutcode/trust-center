import express from 'express';
import { createClient } from '@supabase/supabase-js';
import { supabase } from '../server';
import { requireAdmin, AuthRequest } from '../middleware/auth';
import { logActivity } from '../utils/activityLogger';

const router = express.Router();

// Admin signup (for initial setup)
router.post('/signup', async (req, res) => {
  try {
    const { email, password, full_name } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Create user through Supabase Auth using admin API
    // We need to use the service role key for admin operations
    const adminSupabase = createClient(
      process.env.SUPABASE_URL || 'http://supabase-kong:8000',
      process.env.SUPABASE_SERVICE_KEY || process.env.ANON_KEY || '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const { data, error } = await adminSupabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: full_name || 'Admin User' },
    });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    // Add to admin_users table
    const { error: adminError } = await supabase
      .from('admin_users')
      .insert({
        id: data.user.id,
        email: data.user.email!,
        full_name: full_name || 'Admin User',
        role: 'admin',
      });

    if (adminError) {
      // If admin_users insert fails, try update (in case user already exists)
      await supabase
        .from('admin_users')
        .upsert({
          id: data.user.id,
          email: data.user.email!,
          full_name: full_name || 'Admin User',
          role: 'admin',
        });
    }

    res.json({
      user: {
        id: data.user.id,
        email: data.user.email,
      },
      message: 'Admin user created successfully',
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Admin login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Create a fresh client for auth (to avoid session state issues)
    const authClient = createClient(
      process.env.SUPABASE_URL || 'http://supabase-kong:8000',
      process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_KEY || '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const { data, error } = await authClient.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      // Log failed login attempt
      await logActivity({
        adminId: 'system',
        adminEmail: email,
        actionType: 'login_failed',
        entityType: 'auth',
        description: `Failed login attempt for email: ${email}`,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });
      return res.status(401).json({ error: error.message });
    }

    // Use service role client (which bypasses RLS) to check admin status
    const serviceClient = createClient(
      process.env.SUPABASE_URL || 'http://supabase-kong:8000',
      process.env.SUPABASE_SERVICE_KEY || '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const { data: adminUser } = await serviceClient
      .from('admin_users')
      .select('id, email, full_name, role')
      .eq('id', data.user.id)
      .single();

    if (!adminUser) {
      // Log failed admin access attempt (user exists but not admin)
      await logActivity({
        adminId: data.user.id,
        adminEmail: email,
        actionType: 'login_failed',
        entityType: 'auth',
        description: `Login attempt denied - not an admin user: ${email}`,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });
      return res.status(403).json({ error: 'Access denied: Admin account required' });
    }

    // Log successful admin login
    await logActivity({
      adminId: adminUser.id,
      adminEmail: adminUser.email,
      actionType: 'login',
      entityType: 'auth',
      description: `Admin logged in: ${adminUser.email}`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.json({
      user: adminUser,
      session: data.session,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Admin logout
router.post('/logout', requireAdmin, async (req: AuthRequest, res) => {
  try {
    // Log logout
    await logActivity({
      adminId: req.admin!.id,
      adminEmail: req.admin!.email,
      actionType: 'logout',
      entityType: 'auth',
      description: `Admin logged out: ${req.admin!.email}`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    await supabase.auth.signOut();
    res.json({ message: 'Logged out successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Admin auto-logout (triggered by frontend inactivity timeout)
router.post('/logout/auto', requireAdmin, async (req: AuthRequest, res) => {
  try {
    // Log auto-logout
    await logActivity({
      adminId: req.admin!.id,
      adminEmail: req.admin!.email,
      actionType: 'auto_logout',
      entityType: 'auth',
      description: `Admin auto-logged out due to inactivity: ${req.admin!.email}`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    await supabase.auth.signOut();
    res.json({ message: 'Auto-logged out due to inactivity' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Check session
router.get('/session', requireAdmin, async (req: AuthRequest, res) => {
  try {
    res.json({ authenticated: true, admin: req.admin });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

