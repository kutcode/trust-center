CREATE TABLE IF NOT EXISTS outbound_webhooks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    url TEXT NOT NULL,
    description TEXT,
    event_types TEXT[] DEFAULT '{}',
    secret TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE outbound_webhooks ENABLE ROW LEVEL SECURITY;

-- Policy: Admin full access
CREATE POLICY "Admin full access for webhooks"
ON outbound_webhooks FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM admin_users
        WHERE admin_users.id = auth.uid()
    )
);

-- Trigger to update updated_at
CREATE TRIGGER update_outbound_webhooks_modtime
    BEFORE UPDATE ON outbound_webhooks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
