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

