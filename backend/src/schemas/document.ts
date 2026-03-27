import { z } from 'zod';

export const updateDocumentSchema = z.object({
  title: z.string().min(1).max(300).optional(),
  description: z.string().max(5000).optional().nullable(),
  category_id: z.string().uuid().optional().nullable(),
  access_level: z.enum(['public', 'restricted']).optional(),
  status: z.enum(['draft', 'published', 'archived']).optional(),
  requires_nda: z.boolean().optional(),
  expires_at: z.string().datetime().optional().nullable(),
  review_cycle_days: z.number().int().min(1).max(365).optional().nullable(),
}).strict();

export const submitReviewSchema = z.object({
  status: z.enum(['approved', 'needs_changes', 'pending']),
  notes: z.string().max(5000).optional().nullable(),
  next_review_date: z.string().optional().nullable(),
});
