-- Corrected seed script for filler data
-- Based on actual database schema inspection

-- Get admin user ID for uploaded_by
DO $$
DECLARE
    admin_id uuid;
BEGIN
    SELECT id INTO admin_id FROM public.admin_users LIMIT 1;
    
    -- ============ DOCUMENT CATEGORIES ============
    INSERT INTO public.document_categories (name, description, slug, icon, display_order) VALUES
    ('Compliance Reports', 'SOC, ISO, and other compliance documentation', 'compliance', '📋', 1),
    ('Security Policies', 'Security policies and procedures', 'security', '🔒', 2),
    ('Privacy Documentation', 'Privacy policies and data handling procedures', 'privacy', '🛡️', 3),
    ('Legal Documents', 'Terms of service and legal agreements', 'legal', '📜', 4),
    ('Technical Documentation', 'Architecture and technical security documentation', 'technical', '🖥️', 5)
    ON CONFLICT (slug) DO NOTHING;
    
    -- ============ DOCUMENTS ============
    -- Get category IDs
    INSERT INTO public.documents (title, description, file_url, file_name, file_size, file_type, category_id, access_level, status, uploaded_by, published_at, requires_nda) 
    SELECT 'SOC 2 Type II Report 2025', 'Annual SOC 2 Type II examination report covering security, availability, and confidentiality.', '/files/soc2-type2-2025.pdf', 'soc2-type2-2025.pdf', 2500000, 'application/pdf', id, 'restricted', 'published', admin_id, NOW() - INTERVAL '30 days', true FROM public.document_categories WHERE slug = 'compliance'
    ON CONFLICT DO NOTHING;
    
    INSERT INTO public.documents (title, description, file_url, file_name, file_size, file_type, category_id, access_level, status, uploaded_by, published_at, requires_nda) 
    SELECT 'ISO 27001 Certificate', 'Current ISO 27001:2022 certification.', '/files/iso27001-cert.pdf', 'iso27001-cert.pdf', 500000, 'application/pdf', id, 'public', 'published', admin_id, NOW() - INTERVAL '60 days', false FROM public.document_categories WHERE slug = 'compliance'
    ON CONFLICT DO NOTHING;
    
    INSERT INTO public.documents (title, description, file_url, file_name, file_size, file_type, category_id, access_level, status, uploaded_by, published_at, requires_nda) 
    SELECT 'Penetration Test Summary 2025', 'Executive summary of annual penetration testing results.', '/files/pentest-summary-2025.pdf', 'pentest-summary-2025.pdf', 1200000, 'application/pdf', id, 'restricted', 'published', admin_id, NOW() - INTERVAL '15 days', true FROM public.document_categories WHERE slug = 'compliance'
    ON CONFLICT DO NOTHING;
    
    INSERT INTO public.documents (title, description, file_url, file_name, file_size, file_type, category_id, access_level, status, uploaded_by, published_at, requires_nda) 
    SELECT 'Information Security Policy', 'Comprehensive information security policy document.', '/files/security-policy.pdf', 'security-policy.pdf', 800000, 'application/pdf', id, 'public', 'published', admin_id, NOW() - INTERVAL '120 days', false FROM public.document_categories WHERE slug = 'security'
    ON CONFLICT DO NOTHING;
    
    INSERT INTO public.documents (title, description, file_url, file_name, file_size, file_type, category_id, access_level, status, uploaded_by, published_at, requires_nda) 
    SELECT 'Access Control Policy', 'Policy governing access management and authentication.', '/files/access-control-policy.pdf', 'access-control-policy.pdf', 450000, 'application/pdf', id, 'public', 'published', admin_id, NOW() - INTERVAL '100 days', false FROM public.document_categories WHERE slug = 'security'
    ON CONFLICT DO NOTHING;
    
    INSERT INTO public.documents (title, description, file_url, file_name, file_size, file_type, category_id, access_level, status, uploaded_by, published_at, requires_nda) 
    SELECT 'Incident Response Plan', 'Security incident response procedures and playbooks.', '/files/incident-response.pdf', 'incident-response.pdf', 600000, 'application/pdf', id, 'restricted', 'published', admin_id, NOW() - INTERVAL '80 days', true FROM public.document_categories WHERE slug = 'security'
    ON CONFLICT DO NOTHING;
    
    INSERT INTO public.documents (title, description, file_url, file_name, file_size, file_type, category_id, access_level, status, uploaded_by, published_at, requires_nda) 
    SELECT 'Business Continuity & DR Plan', 'Business continuity and disaster recovery procedures.', '/files/bcdr-plan.pdf', 'bcdr-plan.pdf', 750000, 'application/pdf', id, 'restricted', 'published', admin_id, NOW() - INTERVAL '70 days', true FROM public.document_categories WHERE slug = 'security'
    ON CONFLICT DO NOTHING;
    
    INSERT INTO public.documents (title, description, file_url, file_name, file_size, file_type, category_id, access_level, status, uploaded_by, published_at, requires_nda) 
    SELECT 'Privacy Policy', 'Public-facing privacy policy and data handling practices.', '/files/privacy-policy.pdf', 'privacy-policy.pdf', 400000, 'application/pdf', id, 'public', 'published', admin_id, NOW() - INTERVAL '200 days', false FROM public.document_categories WHERE slug = 'privacy'
    ON CONFLICT DO NOTHING;
    
    INSERT INTO public.documents (title, description, file_url, file_name, file_size, file_type, category_id, access_level, status, uploaded_by, published_at, requires_nda) 
    SELECT 'Data Processing Agreement', 'Standard data processing agreement template.', '/files/dpa-template.pdf', 'dpa-template.pdf', 550000, 'application/pdf', id, 'public', 'published', admin_id, NOW() - INTERVAL '180 days', false FROM public.document_categories WHERE slug = 'privacy'
    ON CONFLICT DO NOTHING;
    
    INSERT INTO public.documents (title, description, file_url, file_name, file_size, file_type, category_id, access_level, status, uploaded_by, published_at, requires_nda) 
    SELECT 'GDPR Compliance Statement', 'Statement of GDPR compliance and data subject rights.', '/files/gdpr-compliance.pdf', 'gdpr-compliance.pdf', 300000, 'application/pdf', id, 'public', 'published', admin_id, NOW() - INTERVAL '150 days', false FROM public.document_categories WHERE slug = 'privacy'
    ON CONFLICT DO NOTHING;
    
    INSERT INTO public.documents (title, description, file_url, file_name, file_size, file_type, category_id, access_level, status, uploaded_by, published_at, requires_nda) 
    SELECT 'Terms of Service', 'Platform terms of service agreement.', '/files/terms-of-service.pdf', 'terms-of-service.pdf', 350000, 'application/pdf', id, 'public', 'published', admin_id, NOW() - INTERVAL '365 days', false FROM public.document_categories WHERE slug = 'legal'
    ON CONFLICT DO NOTHING;
    
    INSERT INTO public.documents (title, description, file_url, file_name, file_size, file_type, category_id, access_level, status, uploaded_by, published_at, requires_nda) 
    SELECT 'Service Level Agreement', 'Standard SLA with uptime guarantees and support tiers.', '/files/sla.pdf', 'sla.pdf', 400000, 'application/pdf', id, 'public', 'published', admin_id, NOW() - INTERVAL '300 days', false FROM public.document_categories WHERE slug = 'legal'
    ON CONFLICT DO NOTHING;
    
    INSERT INTO public.documents (title, description, file_url, file_name, file_size, file_type, category_id, access_level, status, uploaded_by, published_at, requires_nda) 
    SELECT 'Security Architecture Overview', 'High-level security architecture and infrastructure design.', '/files/security-architecture.pdf', 'security-architecture.pdf', 900000, 'application/pdf', id, 'restricted', 'published', admin_id, NOW() - INTERVAL '40 days', true FROM public.document_categories WHERE slug = 'technical'
    ON CONFLICT DO NOTHING;
    
    INSERT INTO public.documents (title, description, file_url, file_name, file_size, file_type, category_id, access_level, status, uploaded_by, published_at, requires_nda) 
    SELECT 'API Security Guidelines', 'API authentication and security best practices.', '/files/api-security.pdf', 'api-security.pdf', 500000, 'application/pdf', id, 'public', 'published', admin_id, NOW() - INTERVAL '25 days', false FROM public.document_categories WHERE slug = 'technical'
    ON CONFLICT DO NOTHING;
    
END $$;

-- ============ CERTIFICATIONS ============
INSERT INTO public.certifications (name, description, issuer, issue_date, expiry_date, certificate_image_url, status, display_order) VALUES
('SOC 2 Type II', 'Service Organization Control 2 Type II certification demonstrating security, availability, and confidentiality controls.', 'AICPA', '2025-01-15', '2026-01-15', '/badges/soc2.png', 'active', 1),
('ISO 27001:2022', 'Information Security Management System certification.', 'BSI Group', '2024-06-01', '2027-06-01', '/badges/iso27001.png', 'active', 2),
('ISO 27701:2019', 'Privacy Information Management System extension to ISO 27001.', 'BSI Group', '2024-08-15', '2027-08-15', '/badges/iso27701.png', 'active', 3),
('GDPR Compliant', 'General Data Protection Regulation compliance verification.', 'TrustArc', '2024-03-01', '2025-03-01', '/badges/gdpr.png', 'active', 4),
('HIPAA Compliant', 'Health Insurance Portability and Accountability Act compliance.', 'HITRUST', '2024-09-01', '2025-09-01', '/badges/hipaa.png', 'active', 5),
('PCI DSS Level 1', 'Payment Card Industry Data Security Standard Level 1 certification.', 'PCI Security Standards Council', '2024-11-01', '2025-11-01', '/badges/pci.png', 'active', 6),
('CSA STAR Level 2', 'Cloud Security Alliance Security, Trust, Assurance, and Risk certification.', 'Cloud Security Alliance', '2024-05-01', '2026-05-01', '/badges/csa-star.png', 'active', 7),
('FedRAMP Moderate', 'Federal Risk and Authorization Management Program authorization.', 'GSA', '2024-01-01', '2027-01-01', '/badges/fedramp.png', 'active', 8)
ON CONFLICT DO NOTHING;

-- ============ SECURITY UPDATES ============
INSERT INTO public.security_updates (title, content, severity, published_at) VALUES
('January 2026 Security Patch Release', 'We have deployed our monthly security patches addressing several low-severity vulnerabilities identified during routine security scanning. No customer action is required.', 'low', NOW() - INTERVAL '5 days'),
('Enhanced MFA Options Now Available', 'We are pleased to announce support for hardware security keys (FIDO2/WebAuthn) as an additional multi-factor authentication option. This provides the highest level of account security.', 'low', NOW() - INTERVAL '15 days'),
('Critical Infrastructure Security Update', 'A critical security update was deployed to address a vulnerability in our authentication service. All systems have been patched and no customer data was affected.', 'critical', NOW() - INTERVAL '30 days'),
('Annual Penetration Test Completed', 'Our annual third-party penetration test has been completed successfully. All identified findings have been remediated. Customers can request the executive summary through our document portal.', 'low', NOW() - INTERVAL '45 days'),
('SOC 2 Type II Audit Completed', 'We have successfully completed our annual SOC 2 Type II audit with no exceptions. The report is now available for customers under NDA.', 'low', NOW() - INTERVAL '60 days'),
('Medium Severity API Vulnerability Patched', 'A medium-severity vulnerability in our API gateway was identified and patched within 24 hours of discovery. No evidence of exploitation was found.', 'medium', NOW() - INTERVAL '75 days'),
('New Data Center Region: EU-West', 'We have launched our new EU-West data center region in Frankfurt, Germany. This provides enhanced data residency options for our European customers.', 'low', NOW() - INTERVAL '90 days'),
('Enhanced Encryption Standards', 'We have upgraded our encryption standards to TLS 1.3 across all services and implemented AES-256-GCM for data at rest encryption.', 'high', NOW() - INTERVAL '120 days')
ON CONFLICT DO NOTHING;

-- ============ SUBPROCESSORS ============
INSERT INTO public.subprocessors (name, description, website_url, category, is_active, display_order) VALUES
('Amazon Web Services (AWS)', 'Cloud infrastructure hosting and data storage in United States and EU (Frankfurt)', 'https://aws.amazon.com', 'Infrastructure', true, 1),
('Google Cloud Platform', 'Backup infrastructure and disaster recovery in United States and EU', 'https://cloud.google.com', 'Infrastructure', true, 2),
('Cloudflare', 'CDN, DDoS protection, and DNS services globally', 'https://cloudflare.com', 'Infrastructure', true, 3),
('Datadog', 'Application monitoring and observability', 'https://datadoghq.com', 'Analytics', true, 4),
('PagerDuty', 'Incident management and on-call scheduling', 'https://pagerduty.com', 'Operations', true, 5),
('Zendesk', 'Customer support ticketing', 'https://zendesk.com', 'Support', true, 6),
('SendGrid (Twilio)', 'Transactional email delivery', 'https://sendgrid.com', 'Communication', true, 7),
('Stripe', 'Payment processing', 'https://stripe.com', 'Payment', true, 8),
('Snowflake', 'Data warehousing and analytics', 'https://snowflake.com', 'Analytics', true, 9),
('Okta', 'Identity and access management', 'https://okta.com', 'Security', true, 10)
ON CONFLICT DO NOTHING;

-- ============ OUTBOUND WEBHOOKS ============
INSERT INTO public.outbound_webhooks (url, description, event_types, secret, is_active) VALUES
('https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX', 'Slack Security Alerts', ARRAY['security_update.created', 'document.created'], 'whsec_slack_security_12345', true),
('https://hooks.slack.com/services/T00000000/B00000001/YYYYYYYYYYYYYYYYYYYYYYYY', 'Slack Document Requests', ARRAY['document_request.created', 'document_request.approved'], 'whsec_slack_requests_67890', true),
('https://company.atlassian.net/rest/webhooks/1.0/webhook', 'Jira Ticket Integration', ARRAY['ticket.created', 'ticket.updated'], 'whsec_jira_integration_abcde', true),
('https://events.pagerduty.com/v2/enqueue', 'PagerDuty Escalation', ARRAY['security_update.created'], 'whsec_pagerduty_fghij', false)
ON CONFLICT DO NOTHING;

-- ============ ORGANIZATIONS ============
INSERT INTO public.organizations (name, email_domain, status, is_active) VALUES
('Acme Corporation', 'acme.com', 'conditional', true),
('Globex Industries', 'globex.com', 'conditional', true),
('Initech', 'initech.com', 'whitelisted', true),
('Umbrella Corp', 'umbrella.io', 'conditional', true),
('Stark Industries', 'stark.com', 'conditional', true)
ON CONFLICT (email_domain) DO NOTHING;

-- ============ DOCUMENT REQUESTS ============
DO $$
DECLARE
    doc_ids uuid[];
    org_id uuid;
BEGIN
    -- Get some document IDs for requests
    SELECT ARRAY(SELECT id FROM public.documents WHERE status = 'published' AND access_level = 'restricted' LIMIT 3) INTO doc_ids;
    
    IF array_length(doc_ids, 1) > 0 THEN
        SELECT id INTO org_id FROM public.organizations WHERE email_domain = 'acme.com' LIMIT 1;
        INSERT INTO public.document_requests (requester_name, requester_email, requester_company, organization_id, document_ids, request_reason, status)
        VALUES ('John Smith', 'john.smith@acme.com', 'Acme Corporation', org_id, doc_ids[1:1], 'Vendor security assessment for procurement', 'pending')
        ON CONFLICT DO NOTHING;
        
        SELECT id INTO org_id FROM public.organizations WHERE email_domain = 'globex.com' LIMIT 1;
        INSERT INTO public.document_requests (requester_name, requester_email, requester_company, organization_id, document_ids, request_reason, status)
        VALUES ('Sarah Johnson', 'sarah.j@globex.com', 'Globex Industries', org_id, doc_ids, 'Security review for enterprise contract', 'pending')
        ON CONFLICT DO NOTHING;
        
        SELECT id INTO org_id FROM public.organizations WHERE email_domain = 'initech.com' LIMIT 1;
        INSERT INTO public.document_requests (requester_name, requester_email, requester_company, organization_id, document_ids, request_reason, status)
        VALUES ('Michael Chen', 'mchen@initech.com', 'Initech', org_id, doc_ids[1:2], 'Technical due diligence', 'approved')
        ON CONFLICT DO NOTHING;
        
        SELECT id INTO org_id FROM public.organizations WHERE email_domain = 'umbrella.io' LIMIT 1;
        INSERT INTO public.document_requests (requester_name, requester_email, requester_company, organization_id, document_ids, request_reason, status)
        VALUES ('Emily Davis', 'emily.davis@umbrella.io', 'Umbrella Corp', org_id, doc_ids[1:1], 'Business continuity review', 'approved')
        ON CONFLICT DO NOTHING;
        
        SELECT id INTO org_id FROM public.organizations WHERE email_domain = 'stark.com' LIMIT 1;
        INSERT INTO public.document_requests (requester_name, requester_email, requester_company, organization_id, document_ids, request_reason, status)
        VALUES ('Tony Stark', 'tony@stark.com', 'Stark Industries', org_id, doc_ids, 'Security assessment for government contract', 'pending')
        ON CONFLICT DO NOTHING;
        
        -- Requests without organization
        INSERT INTO public.document_requests (requester_name, requester_email, requester_company, document_ids, request_reason, status)
        VALUES ('Bruce Wayne', 'bruce@waynetech.com', 'Wayne Technologies', doc_ids[1:1], 'Annual vendor review', 'pending')
        ON CONFLICT DO NOTHING;
        
        INSERT INTO public.document_requests (requester_name, requester_email, requester_company, document_ids, request_reason, status)
        VALUES ('Diana Prince', 'diana@themyscira.org', 'Themyscira Foundation', doc_ids, 'Legal review for partnership', 'pending')
        ON CONFLICT DO NOTHING;
    END IF;
END $$;

SELECT 'Seed data inserted successfully!' as result;
