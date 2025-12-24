import { Request, Response, NextFunction } from 'express';
import { supabase } from '../server';

export interface AuthRequest extends Request {
  admin?: {
    id: string;
    email: string;
  };
}

export const requireAdmin = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Verify token with Supabase
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError) {
      console.error('Auth error:', authError.message);
      return res.status(401).json({ error: `Unauthorized: ${authError.message}` });
    }
    
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized: No user found for token' });
    }
    
    console.log('Authenticated user:', user.id, user.email);

    // Verify user exists in admin_users table
    const { data: adminUser, error: adminError } = await supabase
      .from('admin_users')
      .select('id, email')
      .eq('id', user.id)
      .single();

    if (adminError || !adminUser) {
      return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }

    req.admin = {
      id: adminUser.id,
      email: adminUser.email,
    };

    next();
  } catch (error: any) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

