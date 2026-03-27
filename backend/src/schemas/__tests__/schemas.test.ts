import { loginSchema, signupSchema } from '../../schemas/auth';
import { updateDocumentSchema, submitReviewSchema } from '../../schemas/document';

describe('Auth Schemas', () => {
  describe('loginSchema', () => {
    it('should accept valid login data', () => {
      const result = loginSchema.safeParse({ email: 'admin@example.com', password: 'password123' });
      expect(result.success).toBe(true);
    });

    it('should reject invalid email', () => {
      const result = loginSchema.safeParse({ email: 'not-email', password: 'password123' });
      expect(result.success).toBe(false);
    });

    it('should reject empty password', () => {
      const result = loginSchema.safeParse({ email: 'admin@example.com', password: '' });
      expect(result.success).toBe(false);
    });

    it('should reject password exceeding max length', () => {
      const result = loginSchema.safeParse({ email: 'admin@example.com', password: 'a'.repeat(257) });
      expect(result.success).toBe(false);
    });

    it('should reject email exceeding max length', () => {
      const result = loginSchema.safeParse({ email: 'a'.repeat(250) + '@b.com', password: 'pass' });
      expect(result.success).toBe(false);
    });
  });

  describe('signupSchema', () => {
    it('should accept valid signup data', () => {
      const result = signupSchema.safeParse({
        email: 'new@example.com',
        password: 'securepass',
        full_name: 'Test User',
      });
      expect(result.success).toBe(true);
    });

    it('should reject password shorter than 8 characters', () => {
      const result = signupSchema.safeParse({ email: 'new@example.com', password: 'short' });
      expect(result.success).toBe(false);
    });

    it('should accept signup without optional fields', () => {
      const result = signupSchema.safeParse({ email: 'new@example.com', password: 'securepass' });
      expect(result.success).toBe(true);
    });

    it('should reject full_name exceeding max length', () => {
      const result = signupSchema.safeParse({
        email: 'new@example.com',
        password: 'securepass',
        full_name: 'a'.repeat(201),
      });
      expect(result.success).toBe(false);
    });
  });
});

describe('Document Schemas', () => {
  describe('updateDocumentSchema', () => {
    it('should accept valid partial update', () => {
      const result = updateDocumentSchema.safeParse({ title: 'New Title', status: 'published' });
      expect(result.success).toBe(true);
    });

    it('should accept empty object (all fields optional)', () => {
      const result = updateDocumentSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it('should reject invalid access_level', () => {
      const result = updateDocumentSchema.safeParse({ access_level: 'superadmin' });
      expect(result.success).toBe(false);
    });

    it('should reject invalid status', () => {
      const result = updateDocumentSchema.safeParse({ status: 'deleted' });
      expect(result.success).toBe(false);
    });

    it('should reject title exceeding max length', () => {
      const result = updateDocumentSchema.safeParse({ title: 'a'.repeat(301) });
      expect(result.success).toBe(false);
    });

    it('should reject unknown fields (strict mode)', () => {
      const result = updateDocumentSchema.safeParse({ title: 'Ok', malicious: 'payload' });
      expect(result.success).toBe(false);
    });

    it('should accept valid category_id as UUID', () => {
      const result = updateDocumentSchema.safeParse({ category_id: '550e8400-e29b-41d4-a716-446655440000' });
      expect(result.success).toBe(true);
    });

    it('should reject non-UUID category_id', () => {
      const result = updateDocumentSchema.safeParse({ category_id: 'not-a-uuid' });
      expect(result.success).toBe(false);
    });

    it('should accept nullable expires_at', () => {
      const result = updateDocumentSchema.safeParse({ expires_at: null });
      expect(result.success).toBe(true);
    });

    it('should accept valid datetime for expires_at', () => {
      const result = updateDocumentSchema.safeParse({ expires_at: '2026-12-31T00:00:00.000Z' });
      expect(result.success).toBe(true);
    });

    it('should accept review_cycle_days within range', () => {
      const result = updateDocumentSchema.safeParse({ review_cycle_days: 90 });
      expect(result.success).toBe(true);
    });

    it('should reject review_cycle_days out of range', () => {
      expect(updateDocumentSchema.safeParse({ review_cycle_days: 0 }).success).toBe(false);
      expect(updateDocumentSchema.safeParse({ review_cycle_days: 366 }).success).toBe(false);
    });
  });

  describe('submitReviewSchema', () => {
    it('should accept valid review submission', () => {
      const result = submitReviewSchema.safeParse({ status: 'approved', notes: 'Looks good' });
      expect(result.success).toBe(true);
    });

    it('should require status field', () => {
      const result = submitReviewSchema.safeParse({ notes: 'Missing status' });
      expect(result.success).toBe(false);
    });

    it('should reject invalid status value', () => {
      const result = submitReviewSchema.safeParse({ status: 'rejected' });
      expect(result.success).toBe(false);
    });

    it('should accept all valid status values', () => {
      expect(submitReviewSchema.safeParse({ status: 'approved' }).success).toBe(true);
      expect(submitReviewSchema.safeParse({ status: 'needs_changes' }).success).toBe(true);
      expect(submitReviewSchema.safeParse({ status: 'pending' }).success).toBe(true);
    });

    it('should reject notes exceeding max length', () => {
      const result = submitReviewSchema.safeParse({ status: 'approved', notes: 'a'.repeat(5001) });
      expect(result.success).toBe(false);
    });
  });
});
