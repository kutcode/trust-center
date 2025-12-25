-- Migration: Add Organization Status System
-- Adds status tracking, soft deletion, and access control for organizations

-- Add status column with check constraint
ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'conditional' 
CHECK (status IN ('whitelisted', 'conditional', 'no_access'));

-- Add is_active column for soft deletion
ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Add revoked_at timestamp for tracking when access was revoked
ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS revoked_at TIMESTAMP WITH TIME ZONE;

-- Update existing organizations based on their current state
-- Organizations with approved documents -> conditional
-- Organizations without approved documents -> no_access
UPDATE organizations 
SET status = CASE 
  WHEN array_length(approved_document_ids, 1) > 0 THEN 'conditional'
  ELSE 'no_access'
END
WHERE status IS NULL;

-- Ensure is_active is set for existing organizations
UPDATE organizations 
SET is_active = true 
WHERE is_active IS NULL;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_organizations_status ON organizations(status);
CREATE INDEX IF NOT EXISTS idx_organizations_is_active ON organizations(is_active);
CREATE INDEX IF NOT EXISTS idx_organizations_status_active ON organizations(status, is_active);

-- Add comment to explain the status system
COMMENT ON COLUMN organizations.status IS 'Organization access status: whitelisted (all docs auto-approved), conditional (case-by-case), no_access (blocked)';
COMMENT ON COLUMN organizations.is_active IS 'Soft deletion flag. When false, organization is revoked and hidden from lists';
COMMENT ON COLUMN organizations.revoked_at IS 'Timestamp when organization access was revoked (status changed to no_access or soft-deleted)';

