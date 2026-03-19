import { Request, Response, NextFunction } from 'express';

// Mock Supabase client before importing auth middleware
const mockGetUser = jest.fn();
const mockFrom = jest.fn();

jest.mock('../../server', () => ({
  supabase: {
    auth: {
      getUser: (...args: any[]) => mockGetUser(...args),
    },
    from: (...args: any[]) => mockFrom(...args),
  },
}));

import { requireAdmin, AuthRequest } from '../../middleware/auth';

describe('requireAdmin middleware', () => {
  let req: Partial<AuthRequest>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    jest.clearAllMocks();
    req = {
      headers: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    } as any;
    next = jest.fn();
  });

  it('should return 401 when no authorization header is present', async () => {
    await requireAdmin(req as AuthRequest, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Unauthorized: No token provided',
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 401 when authorization header does not start with Bearer', async () => {
    req.headers = { authorization: 'Basic some-token' };

    await requireAdmin(req as AuthRequest, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Unauthorized: No token provided',
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 401 when Supabase getUser returns an error', async () => {
    req.headers = { authorization: 'Bearer valid-token' };

    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'Invalid token' },
    });

    await requireAdmin(req as AuthRequest, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Unauthorized: Invalid token',
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 401 when no user found for token', async () => {
    req.headers = { authorization: 'Bearer valid-token' };

    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: null,
    });

    await requireAdmin(req as AuthRequest, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Unauthorized: No user found for token',
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 403 when user is not in admin_users table', async () => {
    req.headers = { authorization: 'Bearer valid-token' };

    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-1', email: 'user@test.com' } },
      error: null,
    });

    mockFrom.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: null,
            error: { message: 'Not found' },
          }),
        }),
      }),
    });

    await requireAdmin(req as AuthRequest, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Forbidden: Admin access required',
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('should call next and set req.admin when user is a valid admin', async () => {
    req.headers = { authorization: 'Bearer valid-token' };

    mockGetUser.mockResolvedValue({
      data: { user: { id: 'admin-1', email: 'admin@test.com' } },
      error: null,
    });

    mockFrom.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { id: 'admin-1', email: 'admin@test.com' },
            error: null,
          }),
        }),
      }),
    });

    await requireAdmin(req as AuthRequest, res as Response, next);

    expect(next).toHaveBeenCalled();
    expect(req.admin).toEqual({
      id: 'admin-1',
      email: 'admin@test.com',
    });
  });

  it('should return 500 on unexpected errors', async () => {
    req.headers = { authorization: 'Bearer valid-token' };

    mockGetUser.mockRejectedValue(new Error('Connection failed'));

    await requireAdmin(req as AuthRequest, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Internal server error',
    });
    expect(next).not.toHaveBeenCalled();
  });
});
