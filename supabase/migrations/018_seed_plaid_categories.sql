-- Seed Plaid security control categories and all controls
-- This migration inserts all 17 categories and 79 controls matching Plaid's Trust Center

-- First, clear existing data to avoid duplicates (optional - remove if you want to merge)
-- DELETE FROM public.controls;
-- DELETE FROM public.control_categories;

-- Insert all control categories
INSERT INTO public.control_categories (id, name, description, icon, sort_order) VALUES
    (gen_random_uuid(), 'Compliance and Independent Testing', 'Certifications, audits, and third-party validation of security practices', '📋', 1),
    (gen_random_uuid(), 'Governance', 'Information security governance, policies, standards, and organizational structure', '🏢', 2),
    (gen_random_uuid(), 'Security Risk Management', 'Risk assessment, mitigation planning, and security impact monitoring', '⚙️', 3),
    (gen_random_uuid(), 'Access Management', 'Access control governance, role-based access controls, and user provisioning', '🔑', 4),
    (gen_random_uuid(), 'Asset Management', 'Asset inventory, classification, endpoint security, and cloud asset visibility', '🖥️', 5),
    (gen_random_uuid(), 'Change and Configuration Management', 'Change management program, secure SDLC, and code review controls', '🔄', 6),
    (gen_random_uuid(), 'Encryption and Key Management', 'Encryption of data at rest and in transit, key management practices', '🔐', 7),
    (gen_random_uuid(), 'Network Security', 'Network architecture, segmentation, and network security controls', '🌐', 8),
    (gen_random_uuid(), 'Application Security', 'Secure development practices and application hardening', '💻', 9),
    (gen_random_uuid(), 'Vulnerability Management', 'Vulnerability scanning, assessment, and remediation processes', '🔍', 10),
    (gen_random_uuid(), 'Logging and Monitoring', 'Security logging, activity monitoring, and alerting', '📊', 11),
    (gen_random_uuid(), 'Incident Management', 'Incident response procedures and handling capabilities', '🚨', 12),
    (gen_random_uuid(), 'Business Continuity and Disaster Recovery', 'BC/DR planning, testing, and recovery procedures', '☁️', 13),
    (gen_random_uuid(), 'Vendor / Third-Party Risk Management', 'Third-party security assessment and ongoing monitoring', '🤝', 14),
    (gen_random_uuid(), 'People Security', 'Background checks, personnel security, and employee lifecycle management', '👥', 15),
    (gen_random_uuid(), 'Training and Awareness', 'Security awareness training programs and ongoing education', '🎓', 16),
    (gen_random_uuid(), 'Legal and Privacy', 'Legal compliance, privacy controls, and data protection practices', '⚖️', 17)
ON CONFLICT DO NOTHING;

-- Insert all controls under each category
-- Category 1: Compliance and Independent Testing
INSERT INTO public.controls (category_id, title, description, sort_order)
SELECT id, 'SOC 2 Type II Report', 'Plaid undergoes an annual SOC 2 Type II audit to validate the design and operating effectiveness of controls relevant to security, availability, and confidentiality.', 1
FROM public.control_categories WHERE name = 'Compliance and Independent Testing';

INSERT INTO public.controls (category_id, title, description, sort_order)
SELECT id, 'ISO 27001 / 27701 Certification', 'Plaid maintains ISO 27001 and ISO 27701 certifications to demonstrate alignment with global security and privacy standards.', 2
FROM public.control_categories WHERE name = 'Compliance and Independent Testing';

INSERT INTO public.controls (category_id, title, description, sort_order)
SELECT id, 'Penetration Testing', 'Plaid conducts independent penetration tests to evaluate the security of its applications and infrastructure.', 3
FROM public.control_categories WHERE name = 'Compliance and Independent Testing';

INSERT INTO public.controls (category_id, title, description, sort_order)
SELECT id, 'AWS Foundational Technical Review', 'Plaid is AWS Foundational Technical Review (FTR) certified, demonstrating that our platform aligns with AWS best practices in areas such as security and operational excellence.', 4
FROM public.control_categories WHERE name = 'Compliance and Independent Testing';

INSERT INTO public.controls (category_id, title, description, sort_order)
SELECT id, 'TruSight', 'Plaid participates in annual TruSight assessments, allowing third parties to review standardized evaluations of Plaid''s security and risk practices.', 5
FROM public.control_categories WHERE name = 'Compliance and Independent Testing';

-- Category 2: Governance
INSERT INTO public.controls (category_id, title, description, sort_order)
SELECT id, 'Information Security Governance', 'Plaid implements governance structures that define how security objectives are set, monitored, and maintained across the organization.', 1
FROM public.control_categories WHERE name = 'Governance';

INSERT INTO public.controls (category_id, title, description, sort_order)
SELECT id, 'Security Policies and Standards', 'Plaid maintains documented security policies and standards that establish expectations for how systems, data, and processes must be protected.', 2
FROM public.control_categories WHERE name = 'Governance';

INSERT INTO public.controls (category_id, title, description, sort_order)
SELECT id, 'Organizational Structure and Defined Roles', 'Plaid uses a defined organizational structure with clearly assigned teams, roles, and responsibilities to ensure accountability for security-related activities.', 3
FROM public.control_categories WHERE name = 'Governance';

-- Category 3: Security Risk Management
INSERT INTO public.controls (category_id, title, description, sort_order)
SELECT id, 'Security Risk Management Program', 'Plaid uses a structured risk management program to identify, evaluate, and track risks that could affect the security, availability, or confidentiality of its systems and data.', 1
FROM public.control_categories WHERE name = 'Security Risk Management';

INSERT INTO public.controls (category_id, title, description, sort_order)
SELECT id, 'Risk Mitigation Planning', 'Plaid implements mitigation plans that outline the actions, owners, and timelines required to reduce identified risks to acceptable levels.', 2
FROM public.control_categories WHERE name = 'Security Risk Management';

INSERT INTO public.controls (category_id, title, description, sort_order)
SELECT id, 'Security Impact Monitoring', 'Plaid monitors internal and external factors that may introduce new risks or impact existing controls, adjusting its security posture as needed.', 3
FROM public.control_categories WHERE name = 'Security Risk Management';

INSERT INTO public.controls (category_id, title, description, sort_order)
SELECT id, 'Management Risk Reviews', 'Plaid conducts periodic reviews with management to assess risk trends, evaluate mitigation progress, and prioritize required actions.', 4
FROM public.control_categories WHERE name = 'Security Risk Management';

-- Category 4: Access Management
INSERT INTO public.controls (category_id, title, description, sort_order)
SELECT id, 'Access Control Governance', 'Plaid uses defined governance processes to manage how access to systems and data is granted, reviewed, and revoked.', 1
FROM public.control_categories WHERE name = 'Access Management';

INSERT INTO public.controls (category_id, title, description, sort_order)
SELECT id, 'Role-Based Access Controls', 'Plaid implements role-based access controls that assign permissions based on job responsibilities and least-privilege principles.', 2
FROM public.control_categories WHERE name = 'Access Management';

INSERT INTO public.controls (category_id, title, description, sort_order)
SELECT id, 'User Provisioning and Deprovisioning', 'Plaid uses standardized workflows to provision, modify, and remove user access in alignment with lifecycle events.', 3
FROM public.control_categories WHERE name = 'Access Management';

INSERT INTO public.controls (category_id, title, description, sort_order)
SELECT id, 'Multi-Factor Authentication', 'Plaid enforces FIDO2 (WebAuthn) multi-factor authentication to strengthen access security for critical systems.', 4
FROM public.control_categories WHERE name = 'Access Management';

INSERT INTO public.controls (category_id, title, description, sort_order)
SELECT id, 'Password and Authentication Requirements', 'Plaid implements password and authentication requirements, including phishing-resistant methods, to protect user accounts.', 5
FROM public.control_categories WHERE name = 'Access Management';

INSERT INTO public.controls (category_id, title, description, sort_order)
SELECT id, 'Privileged Access Management', 'Plaid restricts and monitors privileged access to ensure elevated permissions are appropriately controlled.', 6
FROM public.control_categories WHERE name = 'Access Management';

INSERT INTO public.controls (category_id, title, description, sort_order)
SELECT id, 'Periodic Access Reviews', 'Plaid performs periodic reviews of user access to validate that permissions remain accurate and justified.', 7
FROM public.control_categories WHERE name = 'Access Management';

INSERT INTO public.controls (category_id, title, description, sort_order)
SELECT id, 'Zero Trust Access Controls', 'Plaid applies Zero Trust principles by verifying user identity, device posture, and contextual signals before granting access.', 8
FROM public.control_categories WHERE name = 'Access Management';

INSERT INTO public.controls (category_id, title, description, sort_order)
SELECT id, 'Service-to-Service Authentication', 'Plaid implements authentication mechanisms that ensure only authorized services can communicate within its environment.', 9
FROM public.control_categories WHERE name = 'Access Management';

-- Category 5: Asset Management
INSERT INTO public.controls (category_id, title, description, sort_order)
SELECT id, 'Asset Inventory and Classification', 'Plaid uses tools and processes to identify, track, and classify assets based on their sensitivity and criticality.', 1
FROM public.control_categories WHERE name = 'Asset Management';

INSERT INTO public.controls (category_id, title, description, sort_order)
SELECT id, 'Endpoint Security Management', 'Plaid implements security controls on employee endpoints to enforce configuration standards and protect against threats.', 2
FROM public.control_categories WHERE name = 'Asset Management';

INSERT INTO public.controls (category_id, title, description, sort_order)
SELECT id, 'Cloud Asset Visibility and Tagging', 'Plaid uses cloud-native tooling to maintain visibility into cloud assets and apply consistent tagging for ownership and security management.', 3
FROM public.control_categories WHERE name = 'Asset Management';

INSERT INTO public.controls (category_id, title, description, sort_order)
SELECT id, 'Software and Service Catalog Management', 'Plaid maintains a catalog of internally developed services and applications to support accurate ownership, lifecycle management, and security oversight.', 4
FROM public.control_categories WHERE name = 'Asset Management';

-- Category 6: Change and Configuration Management
INSERT INTO public.controls (category_id, title, description, sort_order)
SELECT id, 'Change Management Program', 'Plaid uses formal change management processes to ensure that modifications to systems and infrastructure are authorized, tested, and approved before deployment.', 1
FROM public.control_categories WHERE name = 'Change and Configuration Management';

INSERT INTO public.controls (category_id, title, description, sort_order)
SELECT id, 'Secure Software Development Lifecycle (SDLC)', 'Plaid implements a secure development lifecycle that incorporates security reviews, testing, and verification throughout the development process.', 2
FROM public.control_categories WHERE name = 'Change and Configuration Management';

INSERT INTO public.controls (category_id, title, description, sort_order)
SELECT id, 'Code Review and Approval Controls', 'Plaid enforces code review and approval requirements to validate changes, maintain code quality, and ensure appropriate oversight.', 3
FROM public.control_categories WHERE name = 'Change and Configuration Management';

INSERT INTO public.controls (category_id, title, description, sort_order)
SELECT id, 'Configuration Baseline and Hardening', 'Plaid uses configuration baselines and hardening standards to ensure systems are deployed and maintained in a secure and consistent manner.', 4
FROM public.control_categories WHERE name = 'Change and Configuration Management';

-- Category 7: Encryption and Key Management
INSERT INTO public.controls (category_id, title, description, sort_order)
SELECT id, 'Encryption at Rest', 'Plaid implements encryption mechanisms to protect sensitive data at rest using industry-standard cryptographic controls.', 1
FROM public.control_categories WHERE name = 'Encryption and Key Management';

INSERT INTO public.controls (category_id, title, description, sort_order)
SELECT id, 'Encryption in Transit', 'Plaid uses secure communication protocols to encrypt data in transit between systems, customers, and partners.', 2
FROM public.control_categories WHERE name = 'Encryption and Key Management';

INSERT INTO public.controls (category_id, title, description, sort_order)
SELECT id, 'Key Management Program', 'Plaid maintains key management processes to generate, store, rotate, and protect cryptographic keys used to secure sensitive data.', 3
FROM public.control_categories WHERE name = 'Encryption and Key Management';

-- Category 8: Network Security
INSERT INTO public.controls (category_id, title, description, sort_order)
SELECT id, 'Network Segmentation and VPC Architecture', 'Plaid uses segmented network architectures and virtual private cloud configurations to limit access and isolate critical systems.', 1
FROM public.control_categories WHERE name = 'Network Security';

INSERT INTO public.controls (category_id, title, description, sort_order)
SELECT id, 'Firewall and ACL Management', 'Plaid implements firewall rules and access control lists to restrict unauthorized network traffic and enforce defined security boundaries.', 2
FROM public.control_categories WHERE name = 'Network Security';

INSERT INTO public.controls (category_id, title, description, sort_order)
SELECT id, 'Web Application Firewalls (WAF)', 'Plaid uses web application firewalls to detect and block malicious web traffic targeting public-facing services.', 3
FROM public.control_categories WHERE name = 'Network Security';

INSERT INTO public.controls (category_id, title, description, sort_order)
SELECT id, 'Threat Detection and Prevention (IDS/IPS)', 'Plaid implements intrusion detection and prevention technologies to identify and block suspicious or malicious network activity.', 4
FROM public.control_categories WHERE name = 'Network Security';

INSERT INTO public.controls (category_id, title, description, sort_order)
SELECT id, 'Secure Remote Access (VPN)', 'Plaid enforces secure remote access using encrypted VPN connections and strong authentication mechanisms.', 5
FROM public.control_categories WHERE name = 'Network Security';

INSERT INTO public.controls (category_id, title, description, sort_order)
SELECT id, 'DDoS Protection', 'Plaid uses distributed denial-of-service protection services to safeguard systems against large-scale availability attacks.', 6
FROM public.control_categories WHERE name = 'Network Security';

-- Category 9: Application Security
INSERT INTO public.controls (category_id, title, description, sort_order)
SELECT id, 'Secure Coding Practices', 'Plaid implements secure coding practices to ensure applications are developed in accordance with established security standards.', 1
FROM public.control_categories WHERE name = 'Application Security';

INSERT INTO public.controls (category_id, title, description, sort_order)
SELECT id, 'Static and Dynamic Code Analysis', 'Plaid uses automated static and dynamic analysis tools to identify vulnerabilities during development and testing.', 2
FROM public.control_categories WHERE name = 'Application Security';

INSERT INTO public.controls (category_id, title, description, sort_order)
SELECT id, 'Dependency and IaC Scanning', 'Plaid scans third-party libraries and infrastructure-as-code artifacts to detect security issues and configuration risks.', 3
FROM public.control_categories WHERE name = 'Application Security';

INSERT INTO public.controls (category_id, title, description, sort_order)
SELECT id, 'Application Penetration Testing', 'Plaid conducts penetration testing on applications to identify exploitable weaknesses and validate security controls.', 4
FROM public.control_categories WHERE name = 'Application Security';

INSERT INTO public.controls (category_id, title, description, sort_order)
SELECT id, 'API Authentication', 'Plaid implements strong authentication mechanisms across its API endpoints to ensure that only authorized clients can access Plaid services.', 5
FROM public.control_categories WHERE name = 'Application Security';

INSERT INTO public.controls (category_id, title, description, sort_order)
SELECT id, 'Plaid Dashboard MFA and SSO', 'Plaid provides multi-factor authentication and single sign-on capabilities within the Plaid Dashboard to support secure customer access and account management.', 6
FROM public.control_categories WHERE name = 'Application Security';

-- Category 10: Vulnerability Management
INSERT INTO public.controls (category_id, title, description, sort_order)
SELECT id, 'Vulnerability Scanning Program', 'Plaid uses automated scanning tools to continuously identify and assess vulnerabilities across systems and applications.', 1
FROM public.control_categories WHERE name = 'Vulnerability Management';

INSERT INTO public.controls (category_id, title, description, sort_order)
SELECT id, 'Bug Bounty Program', 'Plaid operates a public bug bounty program that enables external researchers to responsibly disclose security issues.', 2
FROM public.control_categories WHERE name = 'Vulnerability Management';

INSERT INTO public.controls (category_id, title, description, sort_order)
SELECT id, 'Remediation and Patch Management', 'Plaid implements processes to prioritize, remediate, and track vulnerabilities through patching and configuration updates.', 3
FROM public.control_categories WHERE name = 'Vulnerability Management';

INSERT INTO public.controls (category_id, title, description, sort_order)
SELECT id, 'Threat Intelligence Monitoring', 'Plaid monitors internal and external threat intelligence sources to identify emerging risks and inform defensive actions.', 4
FROM public.control_categories WHERE name = 'Vulnerability Management';

-- Category 11: Logging and Monitoring
INSERT INTO public.controls (category_id, title, description, sort_order)
SELECT id, 'Centralized Logging', 'Plaid uses centralized logging to collect system, application, and security events for analysis and investigation.', 1
FROM public.control_categories WHERE name = 'Logging and Monitoring';

INSERT INTO public.controls (category_id, title, description, sort_order)
SELECT id, 'Security Event Monitoring (SIEM)', 'Plaid implements a security information and event management platform to correlate logs, detect anomalies, and support incident response.', 2
FROM public.control_categories WHERE name = 'Logging and Monitoring';

INSERT INTO public.controls (category_id, title, description, sort_order)
SELECT id, 'Alerting and On-Call Response', 'Plaid uses automated alerting and maintains on-call response capabilities to ensure timely investigation of security and availability events.', 3
FROM public.control_categories WHERE name = 'Logging and Monitoring';

INSERT INTO public.controls (category_id, title, description, sort_order)
SELECT id, 'Performance and Availability Monitoring', 'Plaid monitors system performance and availability to detect issues and maintain reliable service operations.', 4
FROM public.control_categories WHERE name = 'Logging and Monitoring';

INSERT INTO public.controls (category_id, title, description, sort_order)
SELECT id, 'Log Retention and Protection', 'Plaid implements retention and protection controls to preserve log integrity and ensure logs remain available for security and compliance needs.', 5
FROM public.control_categories WHERE name = 'Logging and Monitoring';

-- Category 12: Incident Management
INSERT INTO public.controls (category_id, title, description, sort_order)
SELECT id, 'Incident Response Program', 'Plaid implements an incident response program that defines roles, responsibilities, and procedures for handling security and availability incidents.', 1
FROM public.control_categories WHERE name = 'Incident Management';

INSERT INTO public.controls (category_id, title, description, sort_order)
SELECT id, 'Incident Triage and Response', 'Plaid uses structured processes to triage alerts, investigate incidents, and determine appropriate response actions.', 2
FROM public.control_categories WHERE name = 'Incident Management';

INSERT INTO public.controls (category_id, title, description, sort_order)
SELECT id, 'Post-Incident Reviews / Root Cause Analysis', 'Plaid conducts post-incident reviews to identify root causes and implement improvements that reduce the likelihood of recurrence.', 3
FROM public.control_categories WHERE name = 'Incident Management';

INSERT INTO public.controls (category_id, title, description, sort_order)
SELECT id, '24/7 On-Call Response', 'Plaid maintains 24/7 on-call coverage to ensure a timely response to security and operational incidents.', 4
FROM public.control_categories WHERE name = 'Incident Management';

INSERT INTO public.controls (category_id, title, description, sort_order)
SELECT id, 'Incident Escalation Workflows', 'Plaid uses defined escalation workflows to route incidents to the appropriate teams and stakeholders based on severity and impact.', 5
FROM public.control_categories WHERE name = 'Incident Management';

-- Category 13: Business Continuity and Disaster Recovery
INSERT INTO public.controls (category_id, title, description, sort_order)
SELECT id, 'Business Continuity Program', 'Plaid implements a business continuity program to maintain critical operations during disruptive events.', 1
FROM public.control_categories WHERE name = 'Business Continuity and Disaster Recovery';

INSERT INTO public.controls (category_id, title, description, sort_order)
SELECT id, 'Disaster Recovery Program', 'Plaid uses documented disaster recovery procedures to restore systems and services in the event of a major outage.', 2
FROM public.control_categories WHERE name = 'Business Continuity and Disaster Recovery';

INSERT INTO public.controls (category_id, title, description, sort_order)
SELECT id, 'Backup and Restore Operations', 'Plaid performs regular backups and implements restoration processes to ensure data availability and integrity.', 3
FROM public.control_categories WHERE name = 'Business Continuity and Disaster Recovery';

INSERT INTO public.controls (category_id, title, description, sort_order)
SELECT id, 'Multi-AZ Redundancy', 'Plaid uses multi-availability zone architectures to increase resilience and reduce the impact of infrastructure failures.', 4
FROM public.control_categories WHERE name = 'Business Continuity and Disaster Recovery';

INSERT INTO public.controls (category_id, title, description, sort_order)
SELECT id, 'Capacity and Availability Planning', 'Plaid monitors system demand and plans capacity to support reliable service delivery under varying workloads.', 5
FROM public.control_categories WHERE name = 'Business Continuity and Disaster Recovery';

INSERT INTO public.controls (category_id, title, description, sort_order)
SELECT id, 'DR Testing and Scenario Exercises', 'Plaid conducts disaster recovery tests and scenario-based exercises to validate recovery capabilities and identify areas for improvement.', 6
FROM public.control_categories WHERE name = 'Business Continuity and Disaster Recovery';

-- Category 14: Vendor / Third-Party Risk Management
INSERT INTO public.controls (category_id, title, description, sort_order)
SELECT id, 'Vendor Risk Management Program', 'Plaid implements a vendor risk management program to evaluate and manage risks associated with third-party service providers.', 1
FROM public.control_categories WHERE name = 'Vendor / Third-Party Risk Management';

INSERT INTO public.controls (category_id, title, description, sort_order)
SELECT id, 'Vendor Security Assessments', 'Plaid performs vendor security assessments to verify that their controls meet Plaid''s security and availability requirements.', 2
FROM public.control_categories WHERE name = 'Vendor / Third-Party Risk Management';

-- Category 15: People Security
INSERT INTO public.controls (category_id, title, description, sort_order)
SELECT id, 'Background Screening', 'Plaid uses background screening processes to verify the qualifications and integrity of prospective employees in accordance with applicable laws.', 1
FROM public.control_categories WHERE name = 'People Security';

INSERT INTO public.controls (category_id, title, description, sort_order)
SELECT id, 'Hiring and Onboarding Controls', 'Plaid implements hiring and onboarding controls to ensure new employees understand their responsibilities and meet security requirements before accessing company systems.', 2
FROM public.control_categories WHERE name = 'People Security';

INSERT INTO public.controls (category_id, title, description, sort_order)
SELECT id, 'Confidentiality and Non-Disclosure Controls', 'Plaid uses confidentiality and non-disclosure agreements to ensure employees understand and uphold their obligations to protect sensitive information.', 3
FROM public.control_categories WHERE name = 'People Security';

INSERT INTO public.controls (category_id, title, description, sort_order)
SELECT id, 'Termination and Offboarding Controls', 'Plaid implements termination and offboarding processes to ensure access is revoked and company assets are returned when an employee leaves the organization.', 4
FROM public.control_categories WHERE name = 'People Security';

-- Category 16: Training and Awareness
INSERT INTO public.controls (category_id, title, description, sort_order)
SELECT id, 'Security Awareness Training', 'Plaid provides security awareness training to ensure employees understand common threats and their responsibilities in protecting systems and data.', 1
FROM public.control_categories WHERE name = 'Training and Awareness';

INSERT INTO public.controls (category_id, title, description, sort_order)
SELECT id, 'Role-Based Security Training', 'Plaid delivers role-based security training tailored to employees whose duties involve elevated security responsibilities.', 2
FROM public.control_categories WHERE name = 'Training and Awareness';

INSERT INTO public.controls (category_id, title, description, sort_order)
SELECT id, 'Privacy Training', 'Plaid provides privacy training to help employees understand data handling requirements and regulatory obligations.', 3
FROM public.control_categories WHERE name = 'Training and Awareness';

INSERT INTO public.controls (category_id, title, description, sort_order)
SELECT id, 'Ongoing Security Communications', 'Plaid shares ongoing security communications to keep employees informed about emerging risks, best practices, and policy updates.', 4
FROM public.control_categories WHERE name = 'Training and Awareness';

-- Category 17: Legal and Privacy
INSERT INTO public.controls (category_id, title, description, sort_order)
SELECT id, 'Data Classification and Handling', 'Plaid implements data classification and handling requirements to ensure information is managed according to its sensitivity and regulatory obligations.', 1
FROM public.control_categories WHERE name = 'Legal and Privacy';

INSERT INTO public.controls (category_id, title, description, sort_order)
SELECT id, 'Data Retention and Disposal', 'Plaid uses defined retention and disposal processes to store data only as long as necessary and securely delete it when no longer required.', 2
FROM public.control_categories WHERE name = 'Legal and Privacy';

INSERT INTO public.controls (category_id, title, description, sort_order)
SELECT id, 'Data Subject Request Management', 'Plaid maintains processes that enable individuals to request access, correction, or deletion of their data in accordance with applicable laws.', 3
FROM public.control_categories WHERE name = 'Legal and Privacy';

INSERT INTO public.controls (category_id, title, description, sort_order)
SELECT id, 'Contractual Security Commitments', 'Plaid includes security and confidentiality requirements in customer and vendor contracts to ensure appropriate protection of data.', 4
FROM public.control_categories WHERE name = 'Legal and Privacy';

INSERT INTO public.controls (category_id, title, description, sort_order)
SELECT id, 'Privacy Policy and Consumer Disclosures', 'Plaid publishes privacy policies and disclosures to explain how data is collected, used, stored, and shared across its services.', 5
FROM public.control_categories WHERE name = 'Legal and Privacy';

INSERT INTO public.controls (category_id, title, description, sort_order)
SELECT id, 'Cyber Insurance', 'Plaid maintains cyber insurance coverage in addition to other insurance policies to support its legal and regulatory obligations related to data protection.', 6
FROM public.control_categories WHERE name = 'Legal and Privacy';
