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

