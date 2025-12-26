-- Migration: Create subprocessors tables for GDPR compliance
-- Lists third-party vendors and allows email subscription for updates

-- Subprocessors table
CREATE TABLE IF NOT EXISTS subprocessors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    purpose TEXT NOT NULL,
    data_location TEXT,
    website_url TEXT,
    category TEXT DEFAULT 'Infrastructure',
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Subscriptions for subprocessor updates
CREATE TABLE IF NOT EXISTS subprocessor_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT NOT NULL UNIQUE,
    is_verified BOOLEAN DEFAULT false,
    verification_token TEXT,
    verified_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE subprocessors ENABLE ROW LEVEL SECURITY;
ALTER TABLE subprocessor_subscriptions ENABLE ROW LEVEL SECURITY;

-- Public can view active subprocessors
CREATE POLICY "Anyone can view active subprocessors"
ON subprocessors
FOR SELECT
USING (is_active = true);

-- Admins can manage subprocessors
CREATE POLICY "Admins can insert subprocessors"
ON subprocessors
FOR INSERT
WITH CHECK (
    EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid())
);

CREATE POLICY "Admins can update subprocessors"
ON subprocessors
FOR UPDATE
USING (
    EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid())
);

CREATE POLICY "Admins can delete subprocessors"
ON subprocessors
FOR DELETE
USING (
    EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid())
);

-- Anyone can subscribe (insert)
CREATE POLICY "Anyone can subscribe"
ON subprocessor_subscriptions
FOR INSERT
WITH CHECK (true);

-- Admins can view subscriptions
CREATE POLICY "Admins can view subscriptions"
ON subprocessor_subscriptions
FOR SELECT
USING (
    EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid())
);

-- Grant permissions
GRANT SELECT ON subprocessors TO anon;
GRANT SELECT ON subprocessors TO authenticated;
GRANT INSERT ON subprocessor_subscriptions TO anon;
GRANT INSERT ON subprocessor_subscriptions TO authenticated;

-- Service role needs full access for backend operations
GRANT ALL ON subprocessors TO service_role;
GRANT ALL ON subprocessor_subscriptions TO service_role;

-- Trigger for updated_at
CREATE TRIGGER update_subprocessors_updated_at BEFORE UPDATE ON subprocessors
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
