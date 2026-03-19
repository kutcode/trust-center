import { emailRateLimit } from '../../middleware/rateLimit';
import { Request, Response, NextFunction } from 'express';

describe('emailRateLimit middleware', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    req = {
      headers: {},
      body: {},
      socket: { remoteAddress: '127.0.0.1' } as any,
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    } as any;
    next = jest.fn();
  });

  it('should allow the first request through', () => {
    req.headers = { 'x-forwarded-for': '10.0.0.1' };

    emailRateLimit(req as Request, res as Response, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('should block after exceeding IP-based rate limit', () => {
    const testIp = '10.0.0.99';
    req.headers = { 'x-forwarded-for': testIp };

    // Make 10 successful requests (max allowed)
    for (let i = 0; i < 10; i++) {
      const mockNext = jest.fn();
      emailRateLimit(req as Request, res as Response, mockNext);
    }

    // 11th request should be blocked
    const blockedNext = jest.fn();
    emailRateLimit(req as Request, res as Response, blockedNext);

    expect(blockedNext).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(429);
  });

  it('should block after exceeding email-based rate limit', () => {
    const testEmail = 'ratetest@example.com';
    req.headers = {};
    req.body = { email: testEmail };

    // Use unique IP for each call to avoid IP limit
    for (let i = 0; i < 5; i++) {
      const uniqueReq = {
        ...req,
        headers: { 'x-forwarded-for': `192.168.${i}.1` },
        socket: { remoteAddress: `192.168.${i}.1` } as any,
      };
      const mockNext = jest.fn();
      emailRateLimit(uniqueReq as Request, res as Response, mockNext);
    }

    // 6th request with same email should be blocked
    const uniqueReq = {
      ...req,
      headers: { 'x-forwarded-for': '192.168.100.1' },
      socket: { remoteAddress: '192.168.100.1' } as any,
    };
    const blockedNext = jest.fn();
    emailRateLimit(uniqueReq as Request, res as Response, blockedNext);

    expect(blockedNext).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(429);
  });

  it('should handle requests without email in body', () => {
    req.headers = { 'x-forwarded-for': '10.0.0.200' };
    req.body = {};

    emailRateLimit(req as Request, res as Response, next);

    expect(next).toHaveBeenCalled();
  });
});
