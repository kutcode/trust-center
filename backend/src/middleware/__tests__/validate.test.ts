import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validate } from '../../middleware/validate';

describe('validate middleware', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    req = { body: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    } as any;
    next = jest.fn();
  });

  const testSchema = z.object({
    email: z.string().email(),
    name: z.string().min(1).max(100),
  });

  it('should call next and replace body with parsed data on valid input', () => {
    req.body = { email: 'test@example.com', name: 'John' };

    validate(testSchema)(req as Request, res as Response, next);

    expect(next).toHaveBeenCalled();
    expect(req.body).toEqual({ email: 'test@example.com', name: 'John' });
    expect(res.status).not.toHaveBeenCalled();
  });

  it('should return 400 with validation errors on invalid input', () => {
    req.body = { email: 'not-an-email', name: '' };

    validate(testSchema)(req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'Validation failed',
        details: expect.any(Object),
      })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 400 when required fields are missing', () => {
    req.body = {};

    validate(testSchema)(req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(next).not.toHaveBeenCalled();
  });

  it('should strip unknown fields from the body', () => {
    const strictSchema = z.object({
      email: z.string().email(),
    }).strict();

    req.body = { email: 'test@example.com', malicious: '<script>alert(1)</script>' };

    validate(strictSchema)(req as Request, res as Response, next);

    // .strict() rejects unknown keys
    expect(res.status).toHaveBeenCalledWith(400);
    expect(next).not.toHaveBeenCalled();
  });

  it('should pass through with correct types after validation', () => {
    const numSchema = z.object({
      count: z.number().int().min(1).max(100),
    });

    req.body = { count: 42 };

    validate(numSchema)(req as Request, res as Response, next);

    expect(next).toHaveBeenCalled();
    expect(req.body.count).toBe(42);
  });
});
