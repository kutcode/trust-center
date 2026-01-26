-- Seed security control categories and all controls
-- This migration inserts all 17 categories and 79 controls

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
SELECT id, 'SOC 2 Type II Report', 'We undergo an annual SOC 2 Type II audit to validate the design and operating effectiveness of controls relevant to security, availability, and confidentiality.', 1
FROM public.control_categories WHERE name = 'Compliance and Independent Testing';

INSERT INTO public.controls (category_id, title, description, sort_order)
SELECT id, 'ISO 27001 / 27701 Certification', 'We maintain ISO 27001 and ISO 27701 certifications to demonstrate alignment with global security and privacy standards.', 2
FROM public.control_categories WHERE name = 'Compliance and Independent Testing';

INSERT INTO public.controls (category_id, title, description, sort_order)
SELECT id, 'Penetration Testing', 'We conduct independent penetration tests to evaluate the security of our applications and infrastructure.', 3
FROM public.control_categories WHERE name = 'Compliance and Independent Testing';

INSERT INTO public.controls (category_id, title, description, sort_order)
SELECT id, 'AWS Foundational Technical Review', 'We are AWS Foundational Technical Review (FTR) certified, demonstrating that our platform aligns with AWS best practices in areas such as security and operational excellence.', 4
FROM public.control_categories WHERE name = 'Compliance and Independent Testing';

INSERT INTO public.controls (category_id, title, description, sort_order)
SELECT id, 'TruSight', 'We participate in annual TruSight assessments, allowing third parties to review standardized evaluations of our security and risk practices.', 5
FROM public.control_categories WHERE name = 'Compliance and Independent Testing';

-- Category 2: Governance
INSERT INTO public.controls (category_id, title, description, sort_order)
SELECT id, 'Information Security Governance', 'We implement governance structures that define how security objectives are set, monitored, and maintained across the organization.', 1
FROM public.control_categories WHERE name = 'Governance';

INSERT INTO public.controls (category_id, title, description, sort_order)
SELECT id, 'Security Policies and Standards', 'We maintain documented security policies and standards that establish expectations for how systems, data, and processes must be protected.', 2
FROM public.control_categories WHERE name = 'Governance';

INSERT INTO public.controls (category_id, title, description, sort_order)
SELECT id, 'Organizational Structure and Defined Roles', 'We use a defined organizational structure with clearly assigned teams, roles, and responsibilities to ensure accountability for security-related activities.', 3
FROM public.control_categories WHERE name = 'Governance';

-- Category 3: Security Risk Management
INSERT INTO public.controls (category_id, title, description, sort_order)
SELECT id, 'Security Risk Management Program', 'We use a structured risk management program to identify, evaluate, and track risks that could affect the security, availability, or confidentiality of our systems and data.', 1
FROM public.control_categories WHERE name = 'Security Risk Management';

INSERT INTO public.controls (category_id, title, description, sort_order)
SELECT id, 'Risk Mitigation Planning', 'We implement mitigation plans that outline the actions, owners, and timelines required to reduce identified risks to acceptable levels.', 2
FROM public.control_categories WHERE name = 'Security Risk Management';

INSERT INTO public.controls (category_id, title, description, sort_order)
SELECT id, 'Security Impact Monitoring', 'We monitor internal and external factors that may introduce new risks or impact existing controls, adjusting our security posture as needed.', 3
FROM public.control_categories WHERE name = 'Security Risk Management';

INSERT INTO public.controls (category_id, title, description, sort_order)
SELECT id, 'Management Risk Reviews', 'We conduct periodic reviews with management to assess risk trends, evaluate mitigation progress, and prioritize required actions.', 4
FROM public.control_categories WHERE name = 'Security Risk Management';

-- Category 4: Access Management
INSERT INTO public.controls (category_id, title, description, sort_order)
SELECT id, 'Access Control Governance', 'We use defined governance processes to manage how access to systems and data is granted, reviewed, and revoked.', 1
FROM public.control_categories WHERE name = 'Access Management';

INSERT INTO public.controls (category_id, title, description, sort_order)
SELECT id, 'Role-Based Access Controls', 'We implement role-based access controls that assign permissions based on job responsibilities and least-privilege principles.', 2
FROM public.control_categories WHERE name = 'Access Management';

INSERT INTO public.controls (category_id, title, description, sort_order)
SELECT id, 'User Provisioning and Deprovisioning', 'We use standardized workflows to provision, modify, and remove user access in alignment with lifecycle events.', 3
FROM public.control_categories WHERE name = 'Access Management';

INSERT INTO public.controls (category_id, title, description, sort_order)
SELECT id, 'Multi-Factor Authentication', 'We enforce FIDO2 (WebAuthn) multi-factor authentication to strengthen access security for critical systems.', 4
FROM public.control_categories WHERE name = 'Access Management';

INSERT INTO public.controls (category_id, title, description, sort_order)
SELECT id, 'Password and Authentication Requirements', 'We implement password and authentication requirements, including phishing-resistant methods, to protect user accounts.', 5
FROM public.control_categories WHERE name = 'Access Management';

INSERT INTO public.controls (category_id, title, description, sort_order)
SELECT id, 'Privileged Access Management', 'We restrict and monitor privileged access to ensure elevated permissions are appropriately controlled.', 6
FROM public.control_categories WHERE name = 'Access Management';

INSERT INTO public.controls (category_id, title, description, sort_order)
SELECT id, 'Periodic Access Reviews', 'We perform periodic reviews of user access to validate that permissions remain accurate and justified.', 7
FROM public.control_categories WHERE name = 'Access Management';

INSERT INTO public.controls (category_id, title, description, sort_order)
SELECT id, 'Zero Trust Access Controls', 'We apply Zero Trust principles by verifying user identity, device posture, and contextual signals before granting access.', 8
FROM public.control_categories WHERE name = 'Access Management';

INSERT INTO public.controls (category_id, title, description, sort_order)
SELECT id, 'Service-to-Service Authentication', 'We implement authentication mechanisms that ensure only authorized services can communicate within our environment.', 9
FROM public.control_categories WHERE name = 'Access Management';

-- Category 5: Asset Management
INSERT INTO public.controls (category_id, title, description, sort_order)
SELECT id, 'Asset Inventory and Classification', 'We use tools and processes to identify, track, and classify assets based on their sensitivity and criticality.', 1
FROM public.control_categories WHERE name = 'Asset Management';

INSERT INTO public.controls (category_id, title, description, sort_order)
SELECT id, 'Endpoint Security Management', 'We implement security controls on employee endpoints to enforce configuration standards and protect against threats.', 2
FROM public.control_categories WHERE name = 'Asset Management';

INSERT INTO public.controls (category_id, title, description, sort_order)
SELECT id, 'Cloud Asset Visibility and Tagging', 'We use cloud-native tooling to maintain visibility into cloud assets and apply consistent tagging for ownership and security management.', 3
FROM public.control_categories WHERE name = 'Asset Management';

INSERT INTO public.controls (category_id, title, description, sort_order)
SELECT id, 'Software and Service Catalog Management', 'We maintain a catalog of internally developed services and applications to support accurate ownership, lifecycle management, and security oversight.', 4
FROM public.control_categories WHERE name = 'Asset Management';

-- Category 6: Change and Configuration Management
INSERT INTO public.controls (category_id, title, description, sort_order)
SELECT id, 'Change Management Program', 'We use formal change management processes to ensure that modifications to systems and infrastructure are authorized, tested, and approved before deployment.', 1
FROM public.control_categories WHERE name = 'Change and Configuration Management';

INSERT INTO public.controls (category_id, title, description, sort_order)
SELECT id, 'Secure Software Development Lifecycle (SDLC)', 'We implement a secure development lifecycle that incorporates security reviews, testing, and verification throughout the development process.', 2
FROM public.control_categories WHERE name = 'Change and Configuration Management';

INSERT INTO public.controls (category_id, title, description, sort_order)
SELECT id, 'Code Review and Approval Controls', 'We enforce code review and approval requirements to validate changes, maintain code quality, and ensure appropriate oversight.', 3
FROM public.control_categories WHERE name = 'Change and Configuration Management';

INSERT INTO public.controls (category_id, title, description, sort_order)
SELECT id, 'Configuration Baseline and Hardening', 'We use configuration baselines and hardening standards to ensure systems are deployed and maintained in a secure and consistent manner.', 4
FROM public.control_categories WHERE name = 'Change and Configuration Management';

-- Category 7: Encryption and Key Management
INSERT INTO public.controls (category_id, title, description, sort_order)
SELECT id, 'Encryption at Rest', 'We implement encryption mechanisms to protect sensitive data at rest using industry-standard cryptographic controls.', 1
FROM public.control_categories WHERE name = 'Encryption and Key Management';

INSERT INTO public.controls (category_id, title, description, sort_order)
SELECT id, 'Encryption in Transit', 'We use secure communication protocols to encrypt data in transit between systems, customers, and partners.', 2
FROM public.control_categories WHERE name = 'Encryption and Key Management';

INSERT INTO public.controls (category_id, title, description, sort_order)
SELECT id, 'Key Management Program', 'We maintain key management processes to generate, store, rotate, and protect cryptographic keys used to secure sensitive data.', 3
FROM public.control_categories WHERE name = 'Encryption and Key Management';

-- Category 8: Network Security
INSERT INTO public.controls (category_id, title, description, sort_order)
SELECT id, 'Network Segmentation and VPC Architecture', 'We use segmented network architectures and virtual private cloud configurations to limit access and isolate critical systems.', 1
FROM public.control_categories WHERE name = 'Network Security';

INSERT INTO public.controls (category_id, title, description, sort_order)
SELECT id, 'Firewall and ACL Management', 'We implement firewall rules and access control lists to restrict unauthorized network traffic and enforce defined security boundaries.', 2
FROM public.control_categories WHERE name = 'Network Security';

INSERT INTO public.controls (category_id, title, description, sort_order)
SELECT id, 'Web Application Firewalls (WAF)', 'We use web application firewalls to detect and block malicious web traffic targeting public-facing services.', 3
FROM public.control_categories WHERE name = 'Network Security';

INSERT INTO public.controls (category_id, title, description, sort_order)
SELECT id, 'Threat Detection and Prevention (IDS/IPS)', 'We implement intrusion detection and prevention technologies to identify and block suspicious or malicious network activity.', 4
FROM public.control_categories WHERE name = 'Network Security';

INSERT INTO public.controls (category_id, title, description, sort_order)
SELECT id, 'Secure Remote Access (VPN)', 'We enforce secure remote access using encrypted VPN connections and strong authentication mechanisms.', 5
FROM public.control_categories WHERE name = 'Network Security';

INSERT INTO public.controls (category_id, title, description, sort_order)
SELECT id, 'DDoS Protection', 'We use distributed denial-of-service protection services to safeguard systems against large-scale availability attacks.', 6
FROM public.control_categories WHERE name = 'Network Security';

-- Category 9: Application Security
INSERT INTO public.controls (category_id, title, description, sort_order)
SELECT id, 'Secure Coding Practices', 'We implement secure coding practices to ensure applications are developed in accordance with established security standards.', 1
FROM public.control_categories WHERE name = 'Application Security';

INSERT INTO public.controls (category_id, title, description, sort_order)
SELECT id, 'Static and Dynamic Code Analysis', 'We use automated static and dynamic analysis tools to identify vulnerabilities during development and testing.', 2
FROM public.control_categories WHERE name = 'Application Security';

INSERT INTO public.controls (category_id, title, description, sort_order)
SELECT id, 'Dependency and IaC Scanning', 'We scan third-party libraries and infrastructure-as-code artifacts to detect security issues and configuration risks.', 3
FROM public.control_categories WHERE name = 'Application Security';

INSERT INTO public.controls (category_id, title, description, sort_order)
SELECT id, 'Application Penetration Testing', 'We conduct penetration testing on applications to identify exploitable weaknesses and validate security controls.', 4
FROM public.control_categories WHERE name = 'Application Security';

INSERT INTO public.controls (category_id, title, description, sort_order)
SELECT id, 'API Authentication', 'We implement strong authentication mechanisms across our API endpoints to ensure that only authorized clients can access our services.', 5
FROM public.control_categories WHERE name = 'Application Security';

INSERT INTO public.controls (category_id, title, description, sort_order)
SELECT id, 'Dashboard MFA and SSO', 'We provide multi-factor authentication and single sign-on capabilities within the admin dashboard to support secure customer access and account management.', 6
FROM public.control_categories WHERE name = 'Application Security';

-- Category 10: Vulnerability Management
INSERT INTO public.controls (category_id, title, description, sort_order)
SELECT id, 'Vulnerability Scanning Program', 'We use automated scanning tools to continuously identify and assess vulnerabilities across systems and applications.', 1
FROM public.control_categories WHERE name = 'Vulnerability Management';

INSERT INTO public.controls (category_id, title, description, sort_order)
SELECT id, 'Bug Bounty Program', 'We operate a public bug bounty program that enables external researchers to responsibly disclose security issues.', 2
FROM public.control_categories WHERE name = 'Vulnerability Management';

INSERT INTO public.controls (category_id, title, description, sort_order)
SELECT id, 'Remediation and Patch Management', 'We implement processes to prioritize, remediate, and track vulnerabilities through patching and configuration updates.', 3
FROM public.control_categories WHERE name = 'Vulnerability Management';

INSERT INTO public.controls (category_id, title, description, sort_order)
SELECT id, 'Threat Intelligence Monitoring', 'We monitor internal and external threat intelligence sources to identify emerging risks and inform defensive actions.', 4
FROM public.control_categories WHERE name = 'Vulnerability Management';

-- Category 11: Logging and Monitoring
INSERT INTO public.controls (category_id, title, description, sort_order)
SELECT id, 'Centralized Logging', 'We use centralized logging to collect system, application, and security events for analysis and investigation.', 1
FROM public.control_categories WHERE name = 'Logging and Monitoring';

INSERT INTO public.controls (category_id, title, description, sort_order)
SELECT id, 'Security Event Monitoring (SIEM)', 'We implement a security information and event management platform to correlate logs, detect anomalies, and support incident response.', 2
FROM public.control_categories WHERE name = 'Logging and Monitoring';

INSERT INTO public.controls (category_id, title, description, sort_order)
SELECT id, 'Alerting and On-Call Response', 'We use automated alerting and maintain on-call response capabilities to ensure timely investigation of security and availability events.', 3
FROM public.control_categories WHERE name = 'Logging and Monitoring';

INSERT INTO public.controls (category_id, title, description, sort_order)
SELECT id, 'Performance and Availability Monitoring', 'We monitor system performance and availability to detect issues and maintain reliable service operations.', 4
FROM public.control_categories WHERE name = 'Logging and Monitoring';

INSERT INTO public.controls (category_id, title, description, sort_order)
SELECT id, 'Log Retention and Protection', 'We implement retention and protection controls to preserve log integrity and ensure logs remain available for security and compliance needs.', 5
FROM public.control_categories WHERE name = 'Logging and Monitoring';

-- Category 12: Incident Management
INSERT INTO public.controls (category_id, title, description, sort_order)
SELECT id, 'Incident Response Program', 'We implement an incident response program that defines roles, responsibilities, and procedures for handling security and availability incidents.', 1
FROM public.control_categories WHERE name = 'Incident Management';

INSERT INTO public.controls (category_id, title, description, sort_order)
SELECT id, 'Incident Triage and Response', 'We use structured processes to triage alerts, investigate incidents, and determine appropriate response actions.', 2
FROM public.control_categories WHERE name = 'Incident Management';

INSERT INTO public.controls (category_id, title, description, sort_order)
SELECT id, 'Post-Incident Reviews / Root Cause Analysis', 'We conduct post-incident reviews to identify root causes and implement improvements that reduce the likelihood of recurrence.', 3
FROM public.control_categories WHERE name = 'Incident Management';

INSERT INTO public.controls (category_id, title, description, sort_order)
SELECT id, '24/7 On-Call Response', 'We maintain 24/7 on-call coverage to ensure a timely response to security and operational incidents.', 4
FROM public.control_categories WHERE name = 'Incident Management';

INSERT INTO public.controls (category_id, title, description, sort_order)
SELECT id, 'Incident Escalation Workflows', 'We use defined escalation workflows to route incidents to the appropriate teams and stakeholders based on severity and impact.', 5
FROM public.control_categories WHERE name = 'Incident Management';

-- Category 13: Business Continuity and Disaster Recovery
INSERT INTO public.controls (category_id, title, description, sort_order)
SELECT id, 'Business Continuity Program', 'We implement a business continuity program to maintain critical operations during disruptive events.', 1
FROM public.control_categories WHERE name = 'Business Continuity and Disaster Recovery';

INSERT INTO public.controls (category_id, title, description, sort_order)
SELECT id, 'Disaster Recovery Program', 'We use documented disaster recovery procedures to restore systems and services in the event of a major outage.', 2
FROM public.control_categories WHERE name = 'Business Continuity and Disaster Recovery';

INSERT INTO public.controls (category_id, title, description, sort_order)
SELECT id, 'Backup and Restore Operations', 'We perform regular backups and implement restoration processes to ensure data availability and integrity.', 3
FROM public.control_categories WHERE name = 'Business Continuity and Disaster Recovery';

INSERT INTO public.controls (category_id, title, description, sort_order)
SELECT id, 'Multi-AZ Redundancy', 'We use multi-availability zone architectures to increase resilience and reduce the impact of infrastructure failures.', 4
FROM public.control_categories WHERE name = 'Business Continuity and Disaster Recovery';

INSERT INTO public.controls (category_id, title, description, sort_order)
SELECT id, 'Capacity and Availability Planning', 'We monitor system demand and plan capacity to support reliable service delivery under varying workloads.', 5
FROM public.control_categories WHERE name = 'Business Continuity and Disaster Recovery';

INSERT INTO public.controls (category_id, title, description, sort_order)
SELECT id, 'DR Testing and Scenario Exercises', 'We conduct disaster recovery tests and scenario-based exercises to validate recovery capabilities and identify areas for improvement.', 6
FROM public.control_categories WHERE name = 'Business Continuity and Disaster Recovery';

-- Category 14: Vendor / Third-Party Risk Management
INSERT INTO public.controls (category_id, title, description, sort_order)
SELECT id, 'Vendor Risk Management Program', 'We implement a vendor risk management program to evaluate and manage risks associated with third-party service providers.', 1
FROM public.control_categories WHERE name = 'Vendor / Third-Party Risk Management';

INSERT INTO public.controls (category_id, title, description, sort_order)
SELECT id, 'Vendor Security Assessments', 'We perform vendor security assessments to verify that their controls meet our security and availability requirements.', 2
FROM public.control_categories WHERE name = 'Vendor / Third-Party Risk Management';

-- Category 15: People Security
INSERT INTO public.controls (category_id, title, description, sort_order)
SELECT id, 'Background Screening', 'We use background screening processes to verify the qualifications and integrity of prospective employees in accordance with applicable laws.', 1
FROM public.control_categories WHERE name = 'People Security';

INSERT INTO public.controls (category_id, title, description, sort_order)
SELECT id, 'Hiring and Onboarding Controls', 'We implement hiring and onboarding controls to ensure new employees understand their responsibilities and meet security requirements before accessing company systems.', 2
FROM public.control_categories WHERE name = 'People Security';

INSERT INTO public.controls (category_id, title, description, sort_order)
SELECT id, 'Confidentiality and Non-Disclosure Controls', 'We use confidentiality and non-disclosure agreements to ensure employees understand and uphold their obligations to protect sensitive information.', 3
FROM public.control_categories WHERE name = 'People Security';

INSERT INTO public.controls (category_id, title, description, sort_order)
SELECT id, 'Termination and Offboarding Controls', 'We implement termination and offboarding processes to ensure access is revoked and company assets are returned when an employee leaves the organization.', 4
FROM public.control_categories WHERE name = 'People Security';

-- Category 16: Training and Awareness
INSERT INTO public.controls (category_id, title, description, sort_order)
SELECT id, 'Security Awareness Training', 'We provide security awareness training to ensure employees understand common threats and their responsibilities in protecting systems and data.', 1
FROM public.control_categories WHERE name = 'Training and Awareness';

INSERT INTO public.controls (category_id, title, description, sort_order)
SELECT id, 'Role-Based Security Training', 'We deliver role-based security training tailored to employees whose duties involve elevated security responsibilities.', 2
FROM public.control_categories WHERE name = 'Training and Awareness';

INSERT INTO public.controls (category_id, title, description, sort_order)
SELECT id, 'Privacy Training', 'We provide privacy training to help employees understand data handling requirements and regulatory obligations.', 3
FROM public.control_categories WHERE name = 'Training and Awareness';

INSERT INTO public.controls (category_id, title, description, sort_order)
SELECT id, 'Ongoing Security Communications', 'We share ongoing security communications to keep employees informed about emerging risks, best practices, and policy updates.', 4
FROM public.control_categories WHERE name = 'Training and Awareness';

-- Category 17: Legal and Privacy
INSERT INTO public.controls (category_id, title, description, sort_order)
SELECT id, 'Data Classification and Handling', 'We implement data classification and handling requirements to ensure information is managed according to its sensitivity and regulatory obligations.', 1
FROM public.control_categories WHERE name = 'Legal and Privacy';

INSERT INTO public.controls (category_id, title, description, sort_order)
SELECT id, 'Data Retention and Disposal', 'We use defined retention and disposal processes to store data only as long as necessary and securely delete it when no longer required.', 2
FROM public.control_categories WHERE name = 'Legal and Privacy';

INSERT INTO public.controls (category_id, title, description, sort_order)
SELECT id, 'Data Subject Request Management', 'We maintain processes that enable individuals to request access, correction, or deletion of their data in accordance with applicable laws.', 3
FROM public.control_categories WHERE name = 'Legal and Privacy';

INSERT INTO public.controls (category_id, title, description, sort_order)
SELECT id, 'Contractual Security Commitments', 'We include security and confidentiality requirements in customer and vendor contracts to ensure appropriate protection of data.', 4
FROM public.control_categories WHERE name = 'Legal and Privacy';

INSERT INTO public.controls (category_id, title, description, sort_order)
SELECT id, 'Privacy Policy and Consumer Disclosures', 'We publish privacy policies and disclosures to explain how data is collected, used, stored, and shared across our services.', 5
FROM public.control_categories WHERE name = 'Legal and Privacy';

INSERT INTO public.controls (category_id, title, description, sort_order)
SELECT id, 'Cyber Insurance', 'We maintain cyber insurance coverage in addition to other insurance policies to support our legal and regulatory obligations related to data protection.', 6
FROM public.control_categories WHERE name = 'Legal and Privacy';
