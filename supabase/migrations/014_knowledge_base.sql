-- Create knowledge base items table
CREATE TABLE IF NOT EXISTS knowledge_base_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    tags TEXT[] DEFAULT '{}',
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE knowledge_base_items ENABLE ROW LEVEL SECURITY;

-- Drop policies if they exist to avoid errors on re-run
DROP POLICY IF EXISTS "Public read access for public kb items" ON knowledge_base_items;
DROP POLICY IF EXISTS "Admin full access for kb items" ON knowledge_base_items;

-- Policy: Public read access (only if is_public is true)
CREATE POLICY "Public read access for public kb items"
ON knowledge_base_items FOR SELECT
TO anon, authenticated
USING (is_public = true);

-- Policy: Admin full access
CREATE POLICY "Admin full access for kb items"
ON knowledge_base_items FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM admin_users
        WHERE admin_users.id = auth.uid()
    )
);

-- Drop trigger if exists
DROP TRIGGER IF EXISTS update_knowledge_base_modtime ON knowledge_base_items;

-- Trigger to update updated_at using the CORRECT function name
CREATE TRIGGER update_knowledge_base_modtime
    BEFORE UPDATE ON knowledge_base_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
