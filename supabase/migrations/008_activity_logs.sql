-- Migration: Activity Logs System
-- Comprehensive logging for all database changes with precise timestamps

-- Create enhanced activity_logs table
CREATE TABLE IF NOT EXISTS activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_user_id UUID REFERENCES admin_users(id) ON DELETE SET NULL,
    admin_email TEXT,                    -- Store email for reference even if user deleted
    action_type TEXT NOT NULL,           -- e.g., 'status_change', 'approval', 'create', 'update', 'delete'
    entity_type TEXT NOT NULL,           -- e.g., 'organization', 'document', 'request', 'ticket', 'settings'
    entity_id UUID,                      -- ID of the affected entity
    entity_name TEXT,                    -- Human-readable name (e.g., org name, doc title)
    old_value JSONB,                     -- Previous state (for updates)
    new_value JSONB,                     -- New state
    description TEXT,                    -- Human-readable description of the change
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for efficient querying
-- Note: We use created_at DESC for date range queries since DATE() is not immutable
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_entity ON activity_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_admin ON activity_logs(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action ON activity_logs(action_type);

-- Add comment
COMMENT ON TABLE activity_logs IS 'Comprehensive audit log tracking all admin actions with precise timestamps';

-- Enable RLS and grant permissions
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users (admins) to read all logs
CREATE POLICY activity_logs_admin_read ON activity_logs 
    FOR SELECT TO authenticated USING (true);

-- Allow authenticated users (admins) to insert logs
CREATE POLICY activity_logs_admin_insert ON activity_logs 
    FOR INSERT TO authenticated WITH CHECK (true);

-- Grant access to all roles
GRANT ALL ON activity_logs TO authenticated, anon, service_role;

-- Drop first_approved_at and last_approved_at from organizations (replaced by activity logs)
-- Note: We keep these columns for now as they may have historical data
-- ALTER TABLE organizations DROP COLUMN IF EXISTS first_approved_at;
-- ALTER TABLE organizations DROP COLUMN IF EXISTS last_approved_at;
