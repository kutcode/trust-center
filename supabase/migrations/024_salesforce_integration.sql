-- Salesforce integration support

CREATE TABLE IF NOT EXISTS salesforce_connections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    instance_url TEXT NOT NULL,
    access_token TEXT NOT NULL,
    refresh_token TEXT NOT NULL,
    token_type TEXT DEFAULT 'Bearer',
    scope TEXT,
    connected_by UUID REFERENCES admin_users(id) ON DELETE SET NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    last_synced_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_salesforce_connections_active
    ON salesforce_connections(is_active);

CREATE TRIGGER update_salesforce_connections_updated_at
    BEFORE UPDATE ON salesforce_connections
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
