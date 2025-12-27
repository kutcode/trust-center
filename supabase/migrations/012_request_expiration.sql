-- Migration: Add time-limited access to document requests
-- Allows approvals to expire after a specified number of days

-- Add expiration columns to document_requests
ALTER TABLE document_requests 
ADD COLUMN IF NOT EXISTS access_expires_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE document_requests 
ADD COLUMN IF NOT EXISTS expiration_days INTEGER;

-- Index for finding expired access
CREATE INDEX IF NOT EXISTS idx_document_requests_expires ON document_requests(access_expires_at);
