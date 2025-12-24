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

