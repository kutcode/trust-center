-- Add requires_nda flag to documents
ALTER TABLE documents 
ADD COLUMN IF NOT EXISTS requires_nda BOOLEAN DEFAULT false;

-- Create table to track NDA acceptances
CREATE TABLE IF NOT EXISTS nda_acceptances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT NOT NULL,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    ip_address INET,
    user_agent TEXT,
    accepted_at TIMESTAMPTZ DEFAULT NOW(),
    -- Enforce one active acceptance per email/org? 
    -- Actually multiple is fine (audit trail).
    -- But meaningful one is the latest.
    CONSTRAINT nda_acceptances_email_check CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

CREATE INDEX IF NOT EXISTS idx_nda_acceptances_email ON nda_acceptances(email);
CREATE INDEX IF NOT EXISTS idx_nda_acceptances_org ON nda_acceptances(organization_id);

-- Enable RLS
ALTER TABLE nda_acceptances ENABLE ROW LEVEL SECURITY;

-- Policy: Admin can see all
CREATE POLICY "Admin view nda acceptances"
ON nda_acceptances FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM admin_users
        WHERE admin_users.id = auth.uid()
    )
);

-- Policy: Public/Anon can insert (via API endpoint which validates logic, but straight RLS needs care)
-- Actually, inserting usually happens via trusted API endpoint using Service Key or Admin context?
-- No, if public user clicks "I Agree", the API handles it.
-- We'll rely on API logic and backend insertion using service key (if needed) or just public insert?
-- Let's allow public insert for now but better controls in API.
-- Actually the API `POST /api/nda/accept` will likely verify the token (magic link) matches the email.
-- So we can restrict insert to only authenticated users?
-- Trust Center users are "magic link" users, they have a token but might NOT be "authenticated" in Supabase Auth sense (unless we sign them in).
-- The current system uses "token" for access.
-- So the backend will do the insertion using Service Key.
-- So no public RLS needed for insert.
