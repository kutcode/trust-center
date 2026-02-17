-- Combined migrations for Supabase Cloud (skip 000_auth_schema.sql)
-- Batch 1: Core schema + RLS + Storage + Seed

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Organizations table
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    email_domain TEXT UNIQUE NOT NULL,
    approved_document_ids UUID[] DEFAULT '{}',
    notes TEXT,
    first_approved_at TIMESTAMP WITH TIME ZONE,
    last_approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Organization document approvals audit table
CREATE TABLE organization_document_approvals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    document_id UUID NOT NULL,
    approved_by UUID NOT NULL,
    approved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    request_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Admin users table
-- Ensure auth schema and auth.users exist before creating this table
CREATE TABLE IF NOT EXISTS admin_users (
    id UUID PRIMARY KEY,
    email TEXT NOT NULL,
    full_name TEXT,
    role TEXT DEFAULT 'admin' CHECK (role = 'admin'),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT admin_users_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Document categories
CREATE TABLE document_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    icon TEXT,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Documents table
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    category_id UUID REFERENCES document_categories(id) ON DELETE SET NULL,
    access_level TEXT NOT NULL CHECK (access_level IN ('public', 'restricted')),
    file_url TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    file_type TEXT NOT NULL,
    version TEXT,
    version_number INTEGER DEFAULT 1,
    is_current_version BOOLEAN DEFAULT true,
    replaces_document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    published_at TIMESTAMP WITH TIME ZONE,
    archived_at TIMESTAMP WITH TIME ZONE,
    uploaded_by UUID NOT NULL REFERENCES admin_users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Document requests table
CREATE TABLE document_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    requester_name TEXT NOT NULL,
    requester_email TEXT NOT NULL,
    requester_company TEXT NOT NULL,
    organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    document_ids UUID[] NOT NULL,
    request_reason TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied', 'auto_approved')),
    magic_link_token TEXT UNIQUE,
    magic_link_expires_at TIMESTAMP WITH TIME ZONE,
    magic_link_used_at TIMESTAMP WITH TIME ZONE,
    admin_notes TEXT,
    reviewed_by UUID REFERENCES admin_users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    auto_approved BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Certifications table
CREATE TABLE certifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    issuer TEXT NOT NULL,
    issue_date DATE,
    expiry_date DATE,
    certificate_image_url TEXT,
    description TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Security updates table
CREATE TABLE security_updates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    severity TEXT CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    published_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Contact submissions table
CREATE TABLE contact_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    organization TEXT,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'resolved')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trust center settings table (single row)
CREATE TABLE trust_center_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_name TEXT,
    company_logo_url TEXT,
    primary_color TEXT DEFAULT '#007bff',
    secondary_color TEXT DEFAULT '#6c757d',
    hero_title TEXT,
    hero_subtitle TEXT,
    hero_image_url TEXT,
    about_section TEXT,
    contact_email TEXT,
    support_email TEXT,
    social_links JSONB DEFAULT '{}',
    footer_text TEXT,
    privacy_policy_url TEXT,
    terms_of_service_url TEXT,
    email_notification_enabled BOOLEAN DEFAULT true,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_by UUID REFERENCES admin_users(id) ON DELETE SET NULL
);

-- Audit logs table
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_user_id UUID REFERENCES admin_users(id) ON DELETE SET NULL,
    action_type TEXT NOT NULL CHECK (action_type IN (
        'document_upload', 'document_delete', 'request_approved', 'request_denied',
        'organization_approved', 'organization_denied', 'settings_updated'
    )),
    resource_type TEXT NOT NULL,
    resource_id UUID,
    details JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_organizations_email_domain ON organizations(email_domain);
CREATE INDEX idx_document_requests_email ON document_requests(requester_email);
CREATE INDEX idx_document_requests_org ON document_requests(organization_id);
CREATE INDEX idx_document_requests_token ON document_requests(magic_link_token);
CREATE INDEX idx_document_requests_status ON document_requests(status);
CREATE INDEX idx_documents_category ON documents(category_id);
CREATE INDEX idx_documents_status ON documents(status);
CREATE INDEX idx_documents_access_level ON documents(access_level);
CREATE INDEX idx_organization_document_approvals_org ON organization_document_approvals(organization_id);
CREATE INDEX idx_organization_document_approvals_doc ON organization_document_approvals(document_id);
CREATE INDEX idx_audit_logs_admin ON audit_logs(admin_user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action_type);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admin_users_updated_at BEFORE UPDATE ON admin_users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_document_categories_updated_at BEFORE UPDATE ON document_categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_document_requests_updated_at BEFORE UPDATE ON document_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_certifications_updated_at BEFORE UPDATE ON certifications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_security_updates_updated_at BEFORE UPDATE ON security_updates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contact_submissions_updated_at BEFORE UPDATE ON contact_submissions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_trust_center_settings_updated_at BEFORE UPDATE ON trust_center_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- Enable Row Level Security on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_document_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE trust_center_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Organizations: Only admins can view/modify
CREATE POLICY "Only admins can manage organizations"
ON organizations
FOR ALL
USING (
    auth.uid() IN (SELECT id FROM admin_users)
);

-- Organization document approvals: Only admins can view/modify
CREATE POLICY "Only admins can manage organization approvals"
ON organization_document_approvals
FOR ALL
USING (
    auth.uid() IN (SELECT id FROM admin_users)
);

-- Admin users: Simple non-recursive policy - users can view their own record
CREATE POLICY "View own admin record"
ON admin_users
FOR SELECT
USING (id = auth.uid());

-- Grant permissions for admin_users table
GRANT ALL ON admin_users TO service_role;
GRANT SELECT ON admin_users TO authenticated;

-- Document categories: Public can view, admins can modify
CREATE POLICY "Anyone can view document categories"
ON document_categories
FOR SELECT
USING (true);

CREATE POLICY "Only admins can insert document categories"
ON document_categories
FOR INSERT
WITH CHECK (
    auth.uid() IN (SELECT id FROM admin_users)
);

CREATE POLICY "Only admins can update document categories"
ON document_categories
FOR UPDATE
USING (
    auth.uid() IN (SELECT id FROM admin_users)
);

CREATE POLICY "Only admins can delete document categories"
ON document_categories
FOR DELETE
USING (
    auth.uid() IN (SELECT id FROM admin_users)
);

-- Documents: Public can view published, admins can modify
CREATE POLICY "Anyone can view published documents"
ON documents
FOR SELECT
USING (status = 'published');

CREATE POLICY "Only admins can insert documents"
ON documents
FOR INSERT
WITH CHECK (
    auth.uid() IN (SELECT id FROM admin_users)
);

CREATE POLICY "Only admins can update documents"
ON documents
FOR UPDATE
USING (
    auth.uid() IN (SELECT id FROM admin_users)
);

CREATE POLICY "Only admins can delete documents"
ON documents
FOR DELETE
USING (
    auth.uid() IN (SELECT id FROM admin_users)
);

-- Document requests: Anyone can insert, admins can view/modify
CREATE POLICY "Anyone can create document requests"
ON document_requests
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Only admins can view document requests"
ON document_requests
FOR SELECT
USING (
    auth.uid() IN (SELECT id FROM admin_users)
);

CREATE POLICY "Only admins can update document requests"
ON document_requests
FOR UPDATE
USING (
    auth.uid() IN (SELECT id FROM admin_users)
);

CREATE POLICY "Only admins can delete document requests"
ON document_requests
FOR DELETE
USING (
    auth.uid() IN (SELECT id FROM admin_users)
);

-- Certifications: Public can view active, admins can modify
CREATE POLICY "Anyone can view active certifications"
ON certifications
FOR SELECT
USING (status = 'active');

CREATE POLICY "Only admins can insert certifications"
ON certifications
FOR INSERT
WITH CHECK (
    auth.uid() IN (SELECT id FROM admin_users)
);

CREATE POLICY "Only admins can update certifications"
ON certifications
FOR UPDATE
USING (
    auth.uid() IN (SELECT id FROM admin_users)
);

CREATE POLICY "Only admins can delete certifications"
ON certifications
FOR DELETE
USING (
    auth.uid() IN (SELECT id FROM admin_users)
);

-- Security updates: Public can view published, admins can modify
CREATE POLICY "Anyone can view published security updates"
ON security_updates
FOR SELECT
USING (published_at IS NOT NULL AND published_at <= NOW());

CREATE POLICY "Only admins can insert security updates"
ON security_updates
FOR INSERT
WITH CHECK (
    auth.uid() IN (SELECT id FROM admin_users)
);

CREATE POLICY "Only admins can update security updates"
ON security_updates
FOR UPDATE
USING (
    auth.uid() IN (SELECT id FROM admin_users)
);

CREATE POLICY "Only admins can delete security updates"
ON security_updates
FOR DELETE
USING (
    auth.uid() IN (SELECT id FROM admin_users)
);

-- Contact submissions: Anyone can insert, admins can view/modify
CREATE POLICY "Anyone can create contact submissions"
ON contact_submissions
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Only admins can view contact submissions"
ON contact_submissions
FOR SELECT
USING (
    auth.uid() IN (SELECT id FROM admin_users)
);

CREATE POLICY "Only admins can update contact submissions"
ON contact_submissions
FOR UPDATE
USING (
    auth.uid() IN (SELECT id FROM admin_users)
);

CREATE POLICY "Only admins can delete contact submissions"
ON contact_submissions
FOR DELETE
USING (
    auth.uid() IN (SELECT id FROM admin_users)
);

-- Trust center settings: Public can view, admins can modify
CREATE POLICY "Anyone can view trust center settings"
ON trust_center_settings
FOR SELECT
USING (true);

CREATE POLICY "Only admins can insert trust center settings"
ON trust_center_settings
FOR INSERT
WITH CHECK (
    auth.uid() IN (SELECT id FROM admin_users)
);

CREATE POLICY "Only admins can update trust center settings"
ON trust_center_settings
FOR UPDATE
USING (
    auth.uid() IN (SELECT id FROM admin_users)
);

CREATE POLICY "Only admins can delete trust center settings"
ON trust_center_settings
FOR DELETE
USING (
    auth.uid() IN (SELECT id FROM admin_users)
);

-- Audit logs: Only admins can view
CREATE POLICY "Only admins can view audit logs"
ON audit_logs
FOR SELECT
USING (
    auth.uid() IN (SELECT id FROM admin_users)
);

CREATE POLICY "System can insert audit logs"
ON audit_logs
FOR INSERT
WITH CHECK (true);

-- Grant permissions on all tables
-- service_role has full access (bypasses RLS anyway)
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- anon (unauthenticated) can read public tables
GRANT SELECT ON document_categories TO anon;
GRANT SELECT ON documents TO anon;
GRANT SELECT ON certifications TO anon;
GRANT SELECT ON security_updates TO anon;
GRANT SELECT ON trust_center_settings TO anon;

-- authenticated users can read more and submit requests
GRANT SELECT ON document_categories TO authenticated;
GRANT SELECT ON documents TO authenticated;
GRANT SELECT ON certifications TO authenticated;
GRANT SELECT ON security_updates TO authenticated;
GRANT SELECT ON trust_center_settings TO authenticated;
GRANT SELECT ON admin_users TO authenticated;
GRANT INSERT ON contact_submissions TO authenticated;
GRANT INSERT, SELECT ON document_requests TO authenticated;


-- Create storage buckets
INSERT INTO storage.buckets (id, name, public)
VALUES
    ('compliance-documents', 'compliance-documents', false),
    ('certificate-images', 'certificate-images', true),
    ('trust-center-assets', 'trust-center-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for compliance-documents bucket
-- Note: Public access is handled by backend API, not storage policies
-- This policy allows admins to manage all documents

-- Restricted documents accessed via magic link (validated by backend)
-- Note: Storage policies can't validate magic links, so backend handles this
CREATE POLICY "Admins can manage compliance documents"
ON storage.objects FOR ALL
USING (
    bucket_id = 'compliance-documents' AND
    auth.uid() IN (SELECT id FROM admin_users)
)
WITH CHECK (
    bucket_id = 'compliance-documents' AND
    auth.uid() IN (SELECT id FROM admin_users)
);

-- Certificate images: Public read, admin write
CREATE POLICY "Certificates are publicly viewable"
ON storage.objects FOR SELECT
USING (bucket_id = 'certificate-images');

CREATE POLICY "Only admins can insert certificates"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'certificate-images' AND
    auth.uid() IN (SELECT id FROM admin_users)
);

CREATE POLICY "Only admins can update certificates"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'certificate-images' AND
    auth.uid() IN (SELECT id FROM admin_users)
);

CREATE POLICY "Only admins can delete certificates"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'certificate-images' AND
    auth.uid() IN (SELECT id FROM admin_users)
);

-- Trust center assets: Public read, admin write
CREATE POLICY "Trust center assets are publicly viewable"
ON storage.objects FOR SELECT
USING (bucket_id = 'trust-center-assets');

CREATE POLICY "Only admins can insert trust center assets"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'trust-center-assets' AND
    auth.uid() IN (SELECT id FROM admin_users)
);

CREATE POLICY "Only admins can update trust center assets"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'trust-center-assets' AND
    auth.uid() IN (SELECT id FROM admin_users)
);

CREATE POLICY "Only admins can delete trust center assets"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'trust-center-assets' AND
    auth.uid() IN (SELECT id FROM admin_users)
);


-- Seed default document categories
INSERT INTO document_categories (name, slug, description, display_order) VALUES
    ('SOC 2 Reports', 'soc2-reports', 'SOC 2 Type I and Type II compliance reports', 1),
    ('Privacy Policies', 'privacy-policies', 'Privacy policy and data protection documents', 2),
    ('Penetration Tests', 'penetration-tests', 'Security penetration testing reports', 3),
    ('ISO Certifications', 'iso-certifications', 'ISO 27001 and related certifications', 4),
    ('Compliance Reports', 'compliance-reports', 'General compliance and audit reports', 5)
ON CONFLICT (slug) DO NOTHING;

-- Seed default trust center settings (only if no settings exist)
INSERT INTO trust_center_settings (
    company_name,
    hero_title,
    hero_subtitle,
    about_section,
    contact_email,
    footer_text
)
SELECT 
    'Trust Center',
    'Security & Compliance',
    'Your trusted partner for security and compliance documentation',
    'Welcome to our Trust Center. We are committed to maintaining the highest standards of security and compliance.',
    'security@example.com',
    '© 2024 Trust Center. All rights reserved.'
WHERE NOT EXISTS (SELECT 1 FROM trust_center_settings LIMIT 1);

-- Note: Admin user will be created via Supabase Auth signup
-- After signup, insert into admin_users table manually or via trigger


-- Function to create users (for admin user management)
CREATE OR REPLACE FUNCTION create_user_with_password(
    p_email TEXT,
    p_password TEXT,
    p_full_name TEXT DEFAULT NULL,
    p_is_admin BOOLEAN DEFAULT FALSE,
    p_admin_role TEXT DEFAULT 'admin'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID;
    v_identity_id UUID;
BEGIN
    -- Generate user ID
    v_user_id := gen_random_uuid();
    v_identity_id := gen_random_uuid();

    -- Check if user already exists
    SELECT id INTO v_user_id FROM auth.users WHERE email = p_email;
    
    IF v_user_id IS NULL THEN
        -- Insert new user
        v_user_id := gen_random_uuid();
        INSERT INTO auth.users (
            id,
            email,
            encrypted_password,
            email_confirmed_at,
            created_at,
            updated_at,
            raw_user_meta_data,
            is_super_admin,
            is_sso_user
        )
        VALUES (
            v_user_id,
            p_email,
            crypt(p_password, gen_salt('bf')),
            NOW(),
            NOW(),
            NOW(),
            COALESCE(jsonb_build_object('full_name', p_full_name), '{}'::jsonb),
            false,
            false
        );
    ELSE
        -- Update existing user password
        UPDATE auth.users
        SET encrypted_password = crypt(p_password, gen_salt('bf')),
            updated_at = NOW()
        WHERE id = v_user_id;
    END IF;

    -- Insert into auth.identities
    INSERT INTO auth.identities (
        id,
        user_id,
        identity_data,
        provider,
        created_at,
        updated_at,
        last_sign_in_at
    )
    VALUES (
        v_identity_id,
        v_user_id,
        jsonb_build_object('sub', v_user_id::text, 'email', p_email),
        'email',
        NOW(),
        NOW(),
        NOW()
    )
    ON CONFLICT DO NOTHING;

    -- If admin user, add to admin_users table
    IF p_is_admin THEN
        INSERT INTO admin_users (id, email, full_name, role)
        VALUES (v_user_id, p_email, COALESCE(p_full_name, 'Admin User'), p_admin_role)
        ON CONFLICT (id) DO UPDATE
        SET email = EXCLUDED.email,
            full_name = EXCLUDED.full_name,
            role = EXCLUDED.role,
            updated_at = NOW();
    END IF;

    RETURN v_user_id;
END;
$$;

-- Function to update user password
CREATE OR REPLACE FUNCTION update_user_password(
    p_user_id UUID,
    p_password TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE auth.users
    SET encrypted_password = crypt(p_password, gen_salt('bf')),
        updated_at = NOW()
    WHERE id = p_user_id;

    RETURN FOUND;
END;
$$;

-- Function to get all users (for admin panel)
CREATE OR REPLACE FUNCTION get_all_users()
RETURNS TABLE (
    id UUID,
    email TEXT,
    created_at TIMESTAMPTZ,
    email_confirmed_at TIMESTAMPTZ,
    raw_user_meta_data JSONB,
    is_admin BOOLEAN,
    admin_role TEXT,
    full_name TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id,
        u.email,
        u.created_at,
        u.email_confirmed_at,
        u.raw_user_meta_data,
        COALESCE(au.id IS NOT NULL, false) as is_admin,
        au.role as admin_role,
        COALESCE(au.full_name, u.raw_user_meta_data->>'full_name') as full_name
    FROM auth.users u
    LEFT JOIN admin_users au ON u.id = au.id
    ORDER BY u.created_at DESC;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION create_user_with_password TO service_role;
GRANT EXECUTE ON FUNCTION update_user_password TO service_role;
GRANT EXECUTE ON FUNCTION get_all_users TO service_role;


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


-- Ticket messages table for conversation history
CREATE TABLE ticket_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id UUID NOT NULL REFERENCES contact_submissions(id) ON DELETE CASCADE,
    sender_type TEXT NOT NULL CHECK (sender_type IN ('admin', 'user')),
    sender_id UUID REFERENCES admin_users(id) ON DELETE SET NULL,
    sender_name TEXT,
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast lookups by ticket
CREATE INDEX idx_ticket_messages_ticket ON ticket_messages(ticket_id);
CREATE INDEX idx_ticket_messages_created ON ticket_messages(created_at);

-- Add admin_id to contact_submissions for assignment
ALTER TABLE contact_submissions
ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES admin_users(id) ON DELETE SET NULL;

-- Add trigger for updated_at on ticket_messages (if needed)
CREATE TRIGGER update_ticket_messages_updated_at BEFORE UPDATE ON ticket_messages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

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

-- Migration: Add branding columns to trust_center_settings
-- Adds favicon_url, font_family, and footer_links for enhanced white-labeling

-- Add favicon URL
ALTER TABLE trust_center_settings 
ADD COLUMN IF NOT EXISTS favicon_url TEXT;

-- Add font family (Google Font name)
ALTER TABLE trust_center_settings 
ADD COLUMN IF NOT EXISTS font_family TEXT DEFAULT 'Inter';

-- Add footer links as JSONB (array of {label, url} objects)
ALTER TABLE trust_center_settings 
ADD COLUMN IF NOT EXISTS footer_links JSONB DEFAULT '[]';

-- Add accent color for more customization
ALTER TABLE trust_center_settings 
ADD COLUMN IF NOT EXISTS accent_color TEXT DEFAULT '#2563eb';

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
