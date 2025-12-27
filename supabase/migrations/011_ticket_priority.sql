-- Migration: Add priority field to tickets (contact_submissions)
-- Enables prioritizing support tickets as low, normal, high, or critical

ALTER TABLE contact_submissions 
ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'normal' 
CHECK (priority IN ('low', 'normal', 'high', 'critical'));

-- Index for filtering by priority
CREATE INDEX IF NOT EXISTS idx_contact_submissions_priority ON contact_submissions(priority);
