import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

/**
 * Express middleware that validates req.body against a Zod schema.
 * On success, replaces req.body with the parsed (and stripped) data.
 * On failure, returns 400 with structured validation errors.
 */
export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const formatted = (result.error as ZodError).flatten();
      return res.status(400).json({
        error: 'Validation failed',
        details: formatted.fieldErrors,
      });
    }
    req.body = result.data;
    next();
  };
}
