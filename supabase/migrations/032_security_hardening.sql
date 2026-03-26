-- Security Hardening Migration
-- Fixes: missing RLS on 5 tables, overly permissive policies on 6 tables,
-- storage bucket restrictions, and excessive GRANT permissions.

-- ============================================================================
-- 1. ENABLE RLS ON TABLES THAT ARE MISSING IT
-- ============================================================================

-- ticket_messages: support conversations are sensitive
ALTER TABLE ticket_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can manage ticket messages"
ON ticket_messages FOR ALL
USING (auth.uid() IN (SELECT id FROM admin_users));

GRANT ALL ON ticket_messages TO service_role;
GRANT SELECT, INSERT ON ticket_messages TO authenticated;

-- salesforce_connections: contains OAuth access/refresh tokens
ALTER TABLE salesforce_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can manage salesforce connections"
ON salesforce_connections FOR ALL
USING (auth.uid() IN (SELECT id FROM admin_users));

-- salesforce_sync_runs: sync audit data
ALTER TABLE salesforce_sync_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can manage sync runs"
ON salesforce_sync_runs FOR ALL
USING (auth.uid() IN (SELECT id FROM admin_users));

-- salesforce_sync_run_accounts: account/contact data from syncs
ALTER TABLE salesforce_sync_run_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can manage sync run accounts"
ON salesforce_sync_run_accounts FOR ALL
USING (auth.uid() IN (SELECT id FROM admin_users));

-- integration_settings: provider configs that may contain secrets
ALTER TABLE integration_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can manage integration settings"
ON integration_settings FOR ALL
USING (auth.uid() IN (SELECT id FROM admin_users));

GRANT ALL ON integration_settings TO service_role;

-- ============================================================================
-- 2. TIGHTEN OVERLY PERMISSIVE POLICIES (authenticated -> admin-only)
-- ============================================================================

-- --- control_categories ---
DROP POLICY IF EXISTS "Allow authenticated insert on control_categories" ON control_categories;
DROP POLICY IF EXISTS "Allow authenticated update on control_categories" ON control_categories;
DROP POLICY IF EXISTS "Allow authenticated delete on control_categories" ON control_categories;

CREATE POLICY "Only admins can insert control_categories"
ON control_categories FOR INSERT
WITH CHECK (auth.uid() IN (SELECT id FROM admin_users));

CREATE POLICY "Only admins can update control_categories"
ON control_categories FOR UPDATE
USING (auth.uid() IN (SELECT id FROM admin_users));

CREATE POLICY "Only admins can delete control_categories"
ON control_categories FOR DELETE
USING (auth.uid() IN (SELECT id FROM admin_users));

-- --- controls ---
DROP POLICY IF EXISTS "Allow authenticated insert on controls" ON controls;
DROP POLICY IF EXISTS "Allow authenticated update on controls" ON controls;
DROP POLICY IF EXISTS "Allow authenticated delete on controls" ON controls;

CREATE POLICY "Only admins can insert controls"
ON controls FOR INSERT
WITH CHECK (auth.uid() IN (SELECT id FROM admin_users));

CREATE POLICY "Only admins can update controls"
ON controls FOR UPDATE
USING (auth.uid() IN (SELECT id FROM admin_users));

CREATE POLICY "Only admins can delete controls"
ON controls FOR DELETE
USING (auth.uid() IN (SELECT id FROM admin_users));

-- --- frameworks ---
DROP POLICY IF EXISTS "Allow authenticated insert on frameworks" ON frameworks;
DROP POLICY IF EXISTS "Allow authenticated update on frameworks" ON frameworks;
DROP POLICY IF EXISTS "Allow authenticated delete on frameworks" ON frameworks;

CREATE POLICY "Only admins can insert frameworks"
ON frameworks FOR INSERT
WITH CHECK (auth.uid() IN (SELECT id FROM admin_users));

CREATE POLICY "Only admins can update frameworks"
ON frameworks FOR UPDATE
USING (auth.uid() IN (SELECT id FROM admin_users));

CREATE POLICY "Only admins can delete frameworks"
ON frameworks FOR DELETE
USING (auth.uid() IN (SELECT id FROM admin_users));

-- --- control_framework_mappings ---
DROP POLICY IF EXISTS "Allow authenticated insert on control_framework_mappings" ON control_framework_mappings;
DROP POLICY IF EXISTS "Allow authenticated update on control_framework_mappings" ON control_framework_mappings;
DROP POLICY IF EXISTS "Allow authenticated delete on control_framework_mappings" ON control_framework_mappings;

CREATE POLICY "Only admins can insert control_framework_mappings"
ON control_framework_mappings FOR INSERT
WITH CHECK (auth.uid() IN (SELECT id FROM admin_users));

CREATE POLICY "Only admins can update control_framework_mappings"
ON control_framework_mappings FOR UPDATE
USING (auth.uid() IN (SELECT id FROM admin_users));

CREATE POLICY "Only admins can delete control_framework_mappings"
ON control_framework_mappings FOR DELETE
USING (auth.uid() IN (SELECT id FROM admin_users));

-- --- document_reviews ---
DROP POLICY IF EXISTS "Allow public read access on document_reviews" ON document_reviews;
DROP POLICY IF EXISTS "Allow authenticated insert on document_reviews" ON document_reviews;
DROP POLICY IF EXISTS "Allow authenticated update on document_reviews" ON document_reviews;
DROP POLICY IF EXISTS "Allow authenticated delete on document_reviews" ON document_reviews;

CREATE POLICY "Only admins can view document reviews"
ON document_reviews FOR SELECT
USING (auth.uid() IN (SELECT id FROM admin_users));

CREATE POLICY "Only admins can insert document reviews"
ON document_reviews FOR INSERT
WITH CHECK (auth.uid() IN (SELECT id FROM admin_users));

CREATE POLICY "Only admins can update document reviews"
ON document_reviews FOR UPDATE
USING (auth.uid() IN (SELECT id FROM admin_users));

CREATE POLICY "Only admins can delete document reviews"
ON document_reviews FOR DELETE
USING (auth.uid() IN (SELECT id FROM admin_users));

-- ============================================================================
-- 3. REVOKE EXCESSIVE GRANT PERMISSIONS
-- ============================================================================

-- frameworks: was GRANT ALL to authenticated, should be SELECT only
REVOKE ALL ON public.frameworks FROM authenticated;
GRANT SELECT ON public.frameworks TO authenticated;

-- control_framework_mappings: same
REVOKE ALL ON public.control_framework_mappings FROM authenticated;
GRANT SELECT ON public.control_framework_mappings TO authenticated;

-- document_reviews: was GRANT ALL to authenticated, should be SELECT only
REVOKE ALL ON public.document_reviews FROM authenticated;
GRANT SELECT ON public.document_reviews TO authenticated;
-- Also revoke anon SELECT since reviews are admin-only now
REVOKE SELECT ON public.document_reviews FROM anon;

-- ============================================================================
-- 4. HARDEN STORAGE BUCKETS
-- ============================================================================

-- compliance-documents: restrict to document types, 25MB max
UPDATE storage.buckets SET
    file_size_limit = 26214400,
    allowed_mime_types = ARRAY[
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'image/png',
        'image/jpeg'
    ]
WHERE id = 'compliance-documents';

-- certificate-images: restrict to image types, 5MB max
UPDATE storage.buckets SET
    file_size_limit = 5242880,
    allowed_mime_types = ARRAY[
        'image/png',
        'image/jpeg',
        'image/svg+xml',
        'image/webp'
    ]
WHERE id = 'certificate-images';

-- trust-center-assets: restrict to image/icon types, 5MB max
UPDATE storage.buckets SET
    file_size_limit = 5242880,
    allowed_mime_types = ARRAY[
        'image/png',
        'image/jpeg',
        'image/svg+xml',
        'image/webp',
        'image/x-icon'
    ]
WHERE id = 'trust-center-assets';

-- Enable RLS on storage.buckets to prevent unauthorized bucket creation
ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view buckets"
ON storage.buckets FOR SELECT
USING (true);

CREATE POLICY "Only admins can manage buckets"
ON storage.buckets FOR INSERT
WITH CHECK (auth.uid() IN (SELECT id FROM admin_users));

CREATE POLICY "Only admins can update buckets"
ON storage.buckets FOR UPDATE
USING (auth.uid() IN (SELECT id FROM admin_users));

CREATE POLICY "Only admins can delete buckets"
ON storage.buckets FOR DELETE
USING (auth.uid() IN (SELECT id FROM admin_users));
