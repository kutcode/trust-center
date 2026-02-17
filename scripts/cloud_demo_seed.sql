-- Demo seed data for Supabase Cloud
-- Run this AFTER both migration batches complete AND after creating the demo admin user
-- ⚠️ Make sure to replace <DEMO_USER_UUID> below with the actual UUID from Supabase Auth

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

-- Sample certifications (matches: name, issuer, issue_date, expiry_date, certificate_image_url, description, status, display_order)
INSERT INTO certifications (name, issuer, issue_date, expiry_date, certificate_image_url, description, status, display_order) VALUES
  ('SOC 2 Type II', 'Independent Auditor', '2025-01-01', '2026-01-01', NULL, 'Annual SOC 2 Type II audit completed by independent auditor. Covers Security, Availability, and Confidentiality trust service criteria.', 'active', 1),
  ('ISO 27001', 'BSI Group', '2024-06-01', '2027-06-01', NULL, 'Information Security Management System (ISMS) certification covering our global operations.', 'active', 2),
  ('GDPR Compliant', 'EU DPA', '2024-01-01', NULL, NULL, 'Full compliance with the EU General Data Protection Regulation, including Data Processing Agreements.', 'active', 3),
  ('HIPAA Compliant', 'HHS OCR', '2024-03-01', NULL, NULL, 'Compliant with Health Insurance Portability and Accountability Act requirements for protected health information.', 'active', 4),
  ('CSA STAR Level 2', 'Cloud Security Alliance', '2025-02-01', '2026-02-01', NULL, 'Cloud Security Alliance STAR Level 2 certification for cloud security assurance.', 'active', 5),
  ('PCI DSS Level 1', 'PCI Security Standards Council', '2025-01-01', '2026-01-01', NULL, 'Payment Card Industry Data Security Standard Level 1 compliance for payment processing.', 'active', 6)
ON CONFLICT DO NOTHING;

-- Sample security updates (matches: title, content, severity, published_at)
INSERT INTO security_updates (title, content, severity, published_at) VALUES
  ('Infrastructure Security Enhancement', 'We have completed a major upgrade to our infrastructure security, including implementation of zero-trust network architecture, enhanced encryption at rest using AES-256, and deployment of advanced threat detection systems across all environments.', 'low', NOW() - INTERVAL '2 days'),
  ('Q4 2025 Penetration Test Results', 'Our quarterly penetration test conducted by an independent security firm has been completed. No critical or high-severity findings were identified. Two medium-severity items were found and remediated within 48 hours. Full report available upon request.', 'low', NOW() - INTERVAL '14 days'),
  ('Incident Response Plan Update', 'We have updated our incident response plan to include enhanced communication protocols, reduced response time targets, and improved coordination procedures. All team members have completed training on the updated procedures.', 'medium', NOW() - INTERVAL '30 days'),
  ('Vulnerability Disclosure: CVE-2025-1234', 'We identified and patched a medium-severity vulnerability in our API gateway. No customer data was affected. The fix was deployed within 4 hours of discovery. We recommend all API consumers update their integrations to use the latest endpoint versions.', 'high', NOW() - INTERVAL '45 days')
ON CONFLICT DO NOTHING;

-- Sample organizations (matches: name, email_domain, status)
INSERT INTO organizations (name, email_domain, status) VALUES
  ('TechCorp Industries', 'techcorp.example.com', 'whitelisted'),
  ('HealthNet Solutions', 'healthnet.example.com', 'conditional'),
  ('FinanceGuard LLC', 'financeguard.example.com', 'conditional'),
  ('DataFlow Analytics', 'dataflow.example.com', 'whitelisted'),
  ('CloudFirst Systems', 'cloudfirst.example.com', 'no_access')
ON CONFLICT (email_domain) DO NOTHING;

-- Sample activity logs (no FK constraint needed for admin_user_id when NULL)
INSERT INTO activity_logs (admin_user_id, admin_email, action_type, entity_type, description) VALUES
  (NULL, 'system', 'create', 'system', 'Demo environment initialized'),
  (NULL, 'demo@trustcenter.io', 'create', 'auth', 'Demo admin logged in'),
  (NULL, 'demo@trustcenter.io', 'create', 'document', 'Uploaded SOC 2 Type II Report 2025'),
  (NULL, 'demo@trustcenter.io', 'update', 'settings', 'Updated company branding settings'),
  (NULL, 'demo@trustcenter.io', 'update', 'request', 'Approved document request from HealthNet Solutions')
ON CONFLICT DO NOTHING;
