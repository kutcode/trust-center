#!/bin/sh
# reset-demo.sh — Resets demo database to a clean state
# This script is designed to run inside a container with psql available
# and the PGHOST/PGUSER/PGPASSWORD/PGDATABASE env vars set.

set -e

echo "=== Demo Reset Starting ==="
echo "Time: $(date)"

# Drop and recreate all application tables (preserve auth schema)
psql -c "
-- Drop app tables in dependency order
DROP TABLE IF EXISTS activity_logs CASCADE;
DROP TABLE IF EXISTS document_requests CASCADE;
DROP TABLE IF EXISTS documents CASCADE;
DROP TABLE IF EXISTS document_categories CASCADE;
DROP TABLE IF EXISTS certifications CASCADE;
DROP TABLE IF EXISTS controls CASCADE;
DROP TABLE IF EXISTS control_categories CASCADE;
DROP TABLE IF EXISTS security_updates CASCADE;
DROP TABLE IF EXISTS organizations CASCADE;
DROP TABLE IF EXISTS trust_center_settings CASCADE;
DROP TABLE IF EXISTS admin_users CASCADE;
DROP TABLE IF EXISTS outbound_webhooks CASCADE;
DROP TABLE IF EXISTS admin_nav_items CASCADE;
-- Drop other tables that may exist
DROP TABLE IF EXISTS ticket_messages CASCADE;
DROP TABLE IF EXISTS tickets CASCADE;
DROP TABLE IF EXISTS subprocessors CASCADE;
DROP TABLE IF EXISTS knowledge_base_articles CASCADE;
DROP TABLE IF EXISTS nda_agreements CASCADE;
"

echo "Tables dropped. Re-running migrations..."

# Re-run migrations in order
for migration in /migrations/*.sql; do
  echo "Running: $(basename $migration)"
  psql -f "$migration" 2>&1 || echo "Warning: $(basename $migration) had errors (may be OK if creating existing objects)"
done

echo "Migrations complete. Inserting demo data..."

# Insert rich demo data
psql -c "
-- Demo admin user (will be created via Supabase Auth on first login)
-- The actual auth user is created by the demo-reset service or manually

-- Rich demo settings
UPDATE trust_center_settings SET
  company_name = 'Acme Security',
  hero_title = 'Security & Compliance Center',
  hero_subtitle = 'Transparency and trust are at the core of everything we do. Explore our security posture, compliance certifications, and documentation.',
  about_section = 'Acme Security is committed to maintaining the highest standards of data protection and compliance. Our Trust Center provides real-time visibility into our security practices, certifications, and policies.',
  contact_email = 'security@acme-demo.com',
  footer_text = '© 2026 Acme Security. All rights reserved.',
  primary_color = '#2563eb',
  secondary_color = '#7c3aed'
WHERE id = (SELECT id FROM trust_center_settings LIMIT 1);

-- Sample certifications
INSERT INTO certifications (name, description, icon_url, valid_from, valid_until, display_order) VALUES
  ('SOC 2 Type II', 'Annual SOC 2 Type II audit completed by independent auditor. Covers Security, Availability, and Confidentiality trust service criteria.', '✅', '2025-01-01', '2026-01-01', 1),
  ('ISO 27001', 'Information Security Management System (ISMS) certification covering our global operations.', '🏆', '2024-06-01', '2027-06-01', 2),
  ('GDPR Compliant', 'Full compliance with the EU General Data Protection Regulation, including Data Processing Agreements.', '🇪🇺', '2024-01-01', NULL, 3),
  ('HIPAA Compliant', 'Compliant with Health Insurance Portability and Accountability Act requirements for protected health information.', '🏥', '2024-03-01', NULL, 4),
  ('CSA STAR Level 2', 'Cloud Security Alliance STAR Level 2 certification for cloud security assurance.', '⭐', '2025-02-01', '2026-02-01', 5),
  ('PCI DSS Level 1', 'Payment Card Industry Data Security Standard Level 1 compliance for payment processing.', '💳', '2025-01-01', '2026-01-01', 6)
ON CONFLICT DO NOTHING;

-- Sample security updates
INSERT INTO security_updates (title, content, severity, published_at) VALUES
  ('Infrastructure Security Enhancement', 'We have completed a major upgrade to our infrastructure security, including implementation of zero-trust network architecture, enhanced encryption at rest using AES-256, and deployment of advanced threat detection systems across all environments.', 'info', NOW() - INTERVAL '2 days'),
  ('Q4 2025 Penetration Test Results', 'Our quarterly penetration test conducted by an independent security firm has been completed. No critical or high-severity findings were identified. Two medium-severity items were found and remediated within 48 hours. Full report available upon request.', 'low', NOW() - INTERVAL '14 days'),
  ('Incident Response Plan Update', 'We have updated our incident response plan to include enhanced communication protocols, reduced response time targets, and improved coordination procedures. All team members have completed training on the updated procedures.', 'medium', NOW() - INTERVAL '30 days'),
  ('Vulnerability Disclosure: CVE-2025-1234', 'We identified and patched a medium-severity vulnerability in our API gateway. No customer data was affected. The fix was deployed within 4 hours of discovery. We recommend all API consumers update their integrations to use the latest endpoint versions.', 'high', NOW() - INTERVAL '45 days')
ON CONFLICT DO NOTHING;

-- Sample organizations
INSERT INTO organizations (name, contact_email, status) VALUES
  ('TechCorp Industries', 'security@techcorp.example.com', 'active'),
  ('HealthNet Solutions', 'compliance@healthnet.example.com', 'active'),
  ('FinanceGuard LLC', 'audit@financeguard.example.com', 'pending'),
  ('DataFlow Analytics', 'info@dataflow.example.com', 'active'),
  ('CloudFirst Systems', 'security@cloudfirst.example.com', 'pending')
ON CONFLICT DO NOTHING;

-- Sample documents across categories
INSERT INTO documents (title, description, category_id, file_path, file_size, file_type, requires_nda, is_public)
SELECT
  'SOC 2 Type II Report 2025',
  'Complete SOC 2 Type II audit report covering Security, Availability, and Confidentiality trust service criteria.',
  dc.id,
  'demo/soc2-report-2025.pdf',
  2048000,
  'application/pdf',
  true,
  false
FROM document_categories dc WHERE dc.slug = 'soc2-reports'
ON CONFLICT DO NOTHING;

INSERT INTO documents (title, description, category_id, file_path, file_size, file_type, requires_nda, is_public)
SELECT
  'Privacy Policy v3.2',
  'Our comprehensive privacy policy detailing how we collect, use, and protect personal data.',
  dc.id,
  'demo/privacy-policy-v3.2.pdf',
  512000,
  'application/pdf',
  false,
  true
FROM document_categories dc WHERE dc.slug = 'privacy-policies'
ON CONFLICT DO NOTHING;

INSERT INTO documents (title, description, category_id, file_path, file_size, file_type, requires_nda, is_public)
SELECT
  'Annual Penetration Test Summary',
  'Summary findings from our annual penetration testing engagement with a third-party security firm.',
  dc.id,
  'demo/pentest-summary-2025.pdf',
  1024000,
  'application/pdf',
  true,
  false
FROM document_categories dc WHERE dc.slug = 'penetration-tests'
ON CONFLICT DO NOTHING;

INSERT INTO documents (title, description, category_id, file_path, file_size, file_type, requires_nda, is_public)
SELECT
  'ISO 27001 Certificate',
  'Our ISO 27001:2022 certification document issued by an accredited certification body.',
  dc.id,
  'demo/iso27001-cert.pdf',
  256000,
  'application/pdf',
  false,
  true
FROM document_categories dc WHERE dc.slug = 'iso-certifications'
ON CONFLICT DO NOTHING;

INSERT INTO documents (title, description, category_id, file_path, file_size, file_type, requires_nda, is_public)
SELECT
  'Data Processing Agreement (DPA)',
  'Standard Data Processing Agreement for customers who need to comply with GDPR and other data protection regulations.',
  dc.id,
  'demo/dpa-template.pdf',
  384000,
  'application/pdf',
  false,
  true
FROM document_categories dc WHERE dc.slug = 'compliance-reports'
ON CONFLICT DO NOTHING;

INSERT INTO documents (title, description, category_id, file_path, file_size, file_type, requires_nda, is_public)
SELECT
  'Security Whitepaper',
  'Detailed overview of our security architecture, encryption practices, and data protection measures.',
  dc.id,
  'demo/security-whitepaper.pdf',
  768000,
  'application/pdf',
  false,
  true
FROM document_categories dc WHERE dc.slug = 'compliance-reports'
ON CONFLICT DO NOTHING;

-- Sample document requests
INSERT INTO document_requests (document_id, requester_email, requester_name, company_name, status, purpose)
SELECT
  d.id,
  'john.doe@techcorp.example.com',
  'John Doe',
  'TechCorp Industries',
  'pending',
  'Annual vendor security assessment'
FROM documents d WHERE d.title = 'SOC 2 Type II Report 2025'
ON CONFLICT DO NOTHING;

INSERT INTO document_requests (document_id, requester_email, requester_name, company_name, status, purpose)
SELECT
  d.id,
  'jane.smith@healthnet.example.com',
  'Jane Smith',
  'HealthNet Solutions',
  'approved',
  'HIPAA compliance due diligence'
FROM documents d WHERE d.title = 'Annual Penetration Test Summary'
ON CONFLICT DO NOTHING;

-- Sample activity logs
INSERT INTO activity_logs (admin_id, admin_email, action_type, entity_type, description) VALUES
  ('system', 'system', 'system_start', 'system', 'Demo environment initialized'),
  ('system', 'demo@trustcenter.io', 'login', 'auth', 'Demo admin logged in'),
  ('system', 'demo@trustcenter.io', 'document_upload', 'document', 'Uploaded SOC 2 Type II Report 2025'),
  ('system', 'demo@trustcenter.io', 'settings_update', 'settings', 'Updated company branding settings'),
  ('system', 'demo@trustcenter.io', 'request_approved', 'document_request', 'Approved document request from HealthNet Solutions')
ON CONFLICT DO NOTHING;
"

echo "=== Demo Reset Complete ==="
echo "Demo admin: demo@trustcenter.io / demo1234"
