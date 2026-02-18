/**
 * Generate 20 demo PDF documents for the Trust Center demo.
 * Each PDF is a real, multi-page document with professional content.
 * 
 * Run: node scripts/generate-demo-pdfs.js
 * Output: /app/uploads/documents/demo-*.pdf
 */

const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const UPLOADS_DIR = process.env.UPLOADS_DIR || '/app/uploads';
const OUTPUT_DIR = path.join(UPLOADS_DIR, 'documents');

// Ensure output directory exists
fs.mkdirSync(OUTPUT_DIR, { recursive: true });

// 20 demo documents across 5 categories
const documents = [
    // SOC 2 Reports (category 1)
    {
        filename: 'demo-soc2-type2-2025.pdf',
        title: 'SOC 2 Type II Report 2025',
        sections: [
            { heading: 'SOC 2 Type II Report — 2025', body: 'Prepared by: Independent Audit Partners LLP\nReport Period: January 1, 2025 — December 31, 2025\nScope: Security, Availability, and Confidentiality Trust Service Criteria' },
            { heading: 'Executive Summary', body: 'This report provides an independent assessment of the design and operating effectiveness of controls relevant to the Security, Availability, and Confidentiality trust service criteria at Acme Security for the period January 1, 2025 through December 31, 2025.\n\nBased on our examination, in our opinion, the description of the system is fairly presented, the controls were suitably designed, and the controls operated effectively throughout the examination period to provide reasonable assurance that the applicable trust service criteria were met.' },
            { heading: 'System Description', body: 'Acme Security provides a cloud-based security compliance platform that enables organizations to manage their trust center, security documentation, and compliance posture. The system operates across multiple AWS regions with high availability architecture.\n\nKey components include:\n• Web application servers (Node.js on AWS ECS)\n• PostgreSQL database clusters (AWS RDS)\n• Redis caching layer\n• CDN for static asset delivery\n• Monitoring and alerting infrastructure' },
            { heading: 'Control Environment', body: 'The organization maintains a comprehensive control environment including:\n\n1. Information Security Policy Framework\n2. Risk Assessment and Management Program\n3. Access Control and Authentication Mechanisms\n4. Change Management Procedures\n5. Incident Response Plan\n6. Business Continuity and Disaster Recovery\n7. Vendor Risk Management\n8. Employee Security Awareness Training' },
            { heading: 'Test Results Summary', body: 'Total Controls Tested: 127\nControls Operating Effectively: 127\nExceptions Noted: 0\n\nAll controls were found to be suitably designed and operating effectively throughout the examination period. No deviations or exceptions were identified during testing.' },
        ]
    },
    {
        filename: 'demo-soc2-type1-2024.pdf',
        title: 'SOC 2 Type I Report 2024',
        sections: [
            { heading: 'SOC 2 Type I Report — 2024', body: 'Prepared by: Independent Audit Partners LLP\nReport Date: June 30, 2024\nScope: Security and Availability Trust Service Criteria' },
            { heading: 'Management Assertion', body: 'Management of Acme Security is responsible for:\n\na) Identifying the system and describing it accurately\nb) Designing, implementing, and maintaining effective controls\nc) Specifying the applicable trust service criteria\n\nManagement asserts that the description fairly presents the system, and the controls were suitably designed as of June 30, 2024.' },
            { heading: 'Auditor Opinion', body: 'In our opinion, in all material respects:\n\n1. The description fairly presents the system as designed and implemented as of June 30, 2024.\n2. The controls stated in the description were suitably designed to provide reasonable assurance that the applicable trust services criteria would be met.' },
        ]
    },
    {
        filename: 'demo-soc2-bridge-letter.pdf',
        title: 'SOC 2 Bridge Letter',
        sections: [
            { heading: 'SOC 2 Bridge Letter', body: 'Date: February 1, 2026\nTo: Valued Customers and Partners\nFrom: Acme Security, Chief Information Security Officer' },
            { heading: 'Purpose', body: 'This bridge letter covers the period from January 1, 2026 through March 31, 2026, extending the coverage of our most recent SOC 2 Type II report.\n\nDuring this bridge period, we confirm that:\n• No material changes have been made to the system\n• All controls continue to operate effectively\n• No security incidents requiring disclosure have occurred\n• Our next SOC 2 Type II audit is scheduled to commence in Q2 2026' },
        ]
    },
    {
        filename: 'demo-soc2-faq.pdf',
        title: 'SOC 2 Compliance FAQ',
        sections: [
            { heading: 'SOC 2 Compliance — Frequently Asked Questions', body: 'This document addresses common questions from customers and prospects about our SOC 2 compliance program.' },
            { heading: 'Q: What is SOC 2?', body: 'A: SOC 2 (System and Organization Controls 2) is an auditing standard developed by the AICPA that evaluates a service organization\'s information systems relevant to security, availability, processing integrity, confidentiality, and privacy.' },
            { heading: 'Q: What trust service criteria do you cover?', body: 'A: Our SOC 2 report covers Security, Availability, and Confidentiality trust service criteria. These criteria were selected based on our service commitments and system requirements.' },
            { heading: 'Q: How often are you audited?', body: 'A: We undergo annual SOC 2 Type II audits conducted by an independent third-party auditor. Our audit period covers the full calendar year (January through December).' },
            { heading: 'Q: Can I get a copy of the full report?', body: 'A: Yes. SOC 2 reports are available to customers and qualified prospects under NDA through our Trust Center document request process.' },
        ]
    },

    // Privacy Policies (category 2)
    {
        filename: 'demo-privacy-policy.pdf',
        title: 'Privacy Policy',
        sections: [
            { heading: 'Privacy Policy', body: 'Effective Date: January 1, 2026\nLast Updated: January 1, 2026\n\nAcme Security ("we," "us," or "our") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information.' },
            { heading: '1. Information We Collect', body: 'We collect information that you provide directly to us, including:\n\n• Name, email address, and company information when you create an account\n• Communication data when you contact our support team\n• Usage data and analytics when you use our services\n• Payment information when you purchase our services\n\nWe also automatically collect certain information, including IP address, browser type, device information, and usage patterns.' },
            { heading: '2. How We Use Your Information', body: 'We use the collected information for the following purposes:\n\n• Providing, maintaining, and improving our services\n• Processing transactions and sending related information\n• Sending technical notices, updates, and security alerts\n• Responding to your comments, questions, and requests\n• Monitoring and analyzing trends, usage, and activities\n• Detecting, investigating, and preventing security incidents' },
            { heading: '3. Data Retention', body: 'We retain personal data for as long as necessary to fulfill the purposes for which it was collected, including to satisfy legal, accounting, or reporting requirements. The retention period varies based on the type of data and the purpose for which it was collected.' },
            { heading: '4. Your Rights', body: 'Depending on your location, you may have the following rights:\n\n• Right to access your personal data\n• Right to rectification of inaccurate data\n• Right to erasure ("right to be forgotten")\n• Right to restrict processing\n• Right to data portability\n• Right to object to processing\n\nTo exercise any of these rights, please contact privacy@acme-security.com.' },
        ]
    },
    {
        filename: 'demo-dpa.pdf',
        title: 'Data Processing Agreement',
        sections: [
            { heading: 'Data Processing Agreement (DPA)', body: 'This Data Processing Agreement ("DPA") forms part of the Master Service Agreement between Acme Security and the Customer.\n\nEffective Date: Upon execution of the MSA\nVersion: 3.0 — January 2026' },
            { heading: 'Article 1: Definitions', body: '1.1 "Personal Data" means any information relating to an identified or identifiable natural person.\n1.2 "Controller" means the Customer who determines the purposes and means of processing.\n1.3 "Processor" means Acme Security, which processes Personal Data on behalf of the Controller.\n1.4 "Sub-processor" means any third party engaged by the Processor to process Personal Data.' },
            { heading: 'Article 2: Data Processing', body: '2.1 The Processor shall process Personal Data only on documented instructions from the Controller.\n2.2 The Processor shall ensure that persons authorized to process Personal Data have committed themselves to confidentiality.\n2.3 The Processor shall implement appropriate technical and organizational measures to ensure security.' },
            { heading: 'Article 3: Sub-processors', body: 'Current sub-processors:\n• Amazon Web Services (AWS) — Cloud infrastructure, US/EU\n• Supabase — Database services, US\n• Resend — Email delivery, US\n• Cloudflare — CDN and DDoS protection, Global' },
        ]
    },
    {
        filename: 'demo-data-retention.pdf',
        title: 'Data Retention Policy',
        sections: [
            { heading: 'Data Retention Policy', body: 'Document Owner: Chief Privacy Officer\nApproval Date: December 1, 2025\nReview Cycle: Annual\nClassification: Public' },
            { heading: 'Purpose', body: 'This policy establishes guidelines for the retention and disposal of data to ensure compliance with applicable laws and regulations while minimizing storage costs and risks associated with retaining unnecessary data.' },
            { heading: 'Retention Schedule', body: 'Customer Account Data: Duration of service + 30 days\nFinancial Records: 7 years\nAudit Logs: 3 years\nAccess Logs: 1 year\nMarketing Data: Until consent withdrawal\nSupport Tickets: 2 years after resolution\nBackup Data: 90 days rolling' },
            { heading: 'Data Disposal', body: 'Upon expiration of the retention period, data shall be securely disposed of using:\n• Cryptographic erasure for encrypted data stores\n• DOD 5220.22-M standard for physical media\n• Secure deletion for cloud-stored data with verification' },
        ]
    },
    {
        filename: 'demo-ccpa-notice.pdf',
        title: 'CCPA Privacy Notice',
        sections: [
            { heading: 'California Consumer Privacy Act (CCPA) Notice', body: 'This notice supplements our Privacy Policy and applies solely to residents of the State of California.\n\nLast Updated: January 2026' },
            { heading: 'Categories of Personal Information Collected', body: '• Identifiers (name, email, IP address)\n• Commercial information (purchase history, subscription data)\n• Internet activity (browsing history, search history on our platform)\n• Geolocation data (approximate location from IP)\n• Professional information (company name, job title)' },
            { heading: 'Your Rights Under CCPA', body: 'California residents have the right to:\n\n1. Know what personal information is collected\n2. Know whether personal information is sold or disclosed\n3. Say no to the sale of personal information\n4. Access their personal information\n5. Request deletion of personal information\n6. Equal service and price, even if they exercise their privacy rights' },
        ]
    },

    // Penetration Tests (category 3)
    {
        filename: 'demo-pentest-q4-2025.pdf',
        title: 'Penetration Test Report Q4 2025',
        sections: [
            { heading: 'Penetration Test Report — Q4 2025', body: 'Assessment Period: October 15–30, 2025\nTesting Firm: CyberShield Assessment Group\nMethodology: OWASP Top 10, PTES, NIST SP 800-115\nClassification: CONFIDENTIAL' },
            { heading: 'Executive Summary', body: 'CyberShield Assessment Group conducted a comprehensive penetration test of Acme Security\'s external and internal attack surfaces. The assessment included web application testing, API security testing, network penetration testing, and social engineering assessment.\n\nOverall Risk Rating: LOW\n\nFindings Summary:\n• Critical: 0\n• High: 0\n• Medium: 2\n• Low: 3\n• Informational: 5' },
            { heading: 'Key Findings', body: 'MEDIUM-001: Rate limiting insufficient on password reset endpoint\nStatus: REMEDIATED (November 2, 2025)\n\nMEDIUM-002: Missing Content-Security-Policy header on legacy pages\nStatus: REMEDIATED (November 5, 2025)\n\nLOW-001: Verbose error messages in development API responses\nStatus: REMEDIATED (October 31, 2025)' },
            { heading: 'Methodology', body: '1. Reconnaissance — OSINT gathering, DNS enumeration, port scanning\n2. Vulnerability Analysis — Automated scanning with Burp Suite Professional, Nessus\n3. Exploitation — Manual exploitation attempts of identified vulnerabilities\n4. Post-Exploitation — Privilege escalation, lateral movement testing\n5. Reporting — Detailed documentation with remediation recommendations' },
        ]
    },
    {
        filename: 'demo-pentest-q2-2025.pdf',
        title: 'Penetration Test Report Q2 2025',
        sections: [
            { heading: 'Penetration Test Report — Q2 2025', body: 'Assessment Period: April 10–25, 2025\nTesting Firm: CyberShield Assessment Group\nClassification: CONFIDENTIAL' },
            { heading: 'Executive Summary', body: 'This was a scheduled quarterly penetration test covering application and infrastructure security.\n\nOverall Risk Rating: LOW\n\nFindings:\n• Critical: 0\n• High: 1 (Remediated in 24 hours)\n• Medium: 1\n• Low: 4\n• Informational: 7' },
            { heading: 'Critical/High Findings', body: 'HIGH-001: SQL injection vulnerability in legacy search endpoint\nImpact: Potential unauthorized data access\nStatus: REMEDIATED within 24 hours (April 11, 2025)\nRoot Cause: Parameterized queries not used in legacy code path\nPrevention: Added automated SAST scanning for SQL injection patterns' },
        ]
    },
    {
        filename: 'demo-vulnerability-mgmt.pdf',
        title: 'Vulnerability Management Policy',
        sections: [
            { heading: 'Vulnerability Management Policy', body: 'Document Owner: VP of Engineering\nApproval Date: January 2026\nReview Cycle: Annual' },
            { heading: 'Scope', body: 'This policy covers all information systems, networks, and applications owned or managed by Acme Security.' },
            { heading: 'Vulnerability Scanning', body: 'Automated vulnerability scanning is performed:\n• Weekly on all production systems\n• After every deployment to staging and production\n• Monthly on all internal systems\n• Annually by an external third party' },
            { heading: 'Remediation SLAs', body: 'Critical severity: 24 hours\nHigh severity: 72 hours\nMedium severity: 30 days\nLow severity: 90 days\nInformational: Next scheduled release' },
        ]
    },
    {
        filename: 'demo-security-assessment.pdf',
        title: 'Third-Party Security Assessment Summary',
        sections: [
            { heading: 'Third-Party Security Assessment Summary', body: 'Assessment Date: September 2025\nAssessor: SecureReview Associates\nScope: Cloud Infrastructure and Application Security' },
            { heading: 'Assessment Areas', body: '1. Cloud Infrastructure Security — AWS configuration review\n2. Application Security — Code review and dynamic testing\n3. Data Protection — Encryption and access control review\n4. Incident Response — Tabletop exercise and plan review\n5. Compliance — Control mapping against frameworks' },
            { heading: 'Results', body: 'Overall Maturity Score: 4.2 / 5.0 (Advanced)\n\nStrengths:\n• Robust encryption implementation\n• Comprehensive logging and monitoring\n• Well-documented incident response procedures\n\nAreas for Improvement:\n• Expand automated security testing in CI/CD pipeline\n• Enhance network segmentation documentation' },
        ]
    },

    // ISO Certifications (category 4)
    {
        filename: 'demo-iso27001-cert.pdf',
        title: 'ISO 27001 Certificate',
        sections: [
            { heading: 'Certificate of Registration', body: 'This is to certify that the Information Security Management System of\n\nACME SECURITY, INC.\n\nhas been assessed and registered as meeting the requirements of\n\nISO/IEC 27001:2022\n\nCertificate Number: IS-2024-78452\nInitial Registration: June 15, 2024\nValid Until: June 14, 2027' },
            { heading: 'Scope of Registration', body: 'The design, development, deployment, and management of cloud-based security compliance and trust center platform services, including associated infrastructure and support operations.' },
            { heading: 'Statement of Applicability', body: 'The Statement of Applicability (SoA) version 2.1, dated June 2024, covers 93 controls from Annex A of ISO/IEC 27001:2022, organized across four themes:\n\n• Organizational Controls (37 controls)\n• People Controls (8 controls)\n• Physical Controls (14 controls)\n• Technological Controls (34 controls)\n\nAll controls are applicable and implemented.' },
        ]
    },
    {
        filename: 'demo-iso27001-soa.pdf',
        title: 'ISO 27001 Statement of Applicability',
        sections: [
            { heading: 'Statement of Applicability (SoA)', body: 'Version: 2.1\nDate: June 2024\nClassification: Confidential\nISO/IEC 27001:2022' },
            { heading: 'Organizational Controls', body: 'A.5.1 Policies for information security — APPLICABLE (Implemented)\nA.5.2 Information security roles — APPLICABLE (Implemented)\nA.5.3 Segregation of duties — APPLICABLE (Implemented)\nA.5.4 Management responsibilities — APPLICABLE (Implemented)\nA.5.5 Contact with authorities — APPLICABLE (Implemented)\nA.5.6 Contact with special interest groups — APPLICABLE (Implemented)\nA.5.7 Threat intelligence — APPLICABLE (Implemented)\nA.5.8 Information security in project management — APPLICABLE (Implemented)' },
            { heading: 'Technological Controls', body: 'A.8.1 User endpoint devices — APPLICABLE (Implemented)\nA.8.2 Privileged access rights — APPLICABLE (Implemented)\nA.8.3 Information access restriction — APPLICABLE (Implemented)\nA.8.4 Access to source code — APPLICABLE (Implemented)\nA.8.5 Secure authentication — APPLICABLE (Implemented)\nA.8.6 Capacity management — APPLICABLE (Implemented)\nA.8.7 Protection against malware — APPLICABLE (Implemented)\nA.8.8 Management of technical vulnerabilities — APPLICABLE (Implemented)' },
        ]
    },
    {
        filename: 'demo-iso27001-isms-policy.pdf',
        title: 'Information Security Management Policy',
        sections: [
            { heading: 'Information Security Management System (ISMS) Policy', body: 'Document Owner: Chief Information Security Officer\nApproval: Board of Directors\nEffective Date: January 1, 2026\nReview Cycle: Annual' },
            { heading: 'Policy Statement', body: 'Acme Security is committed to preserving the confidentiality, integrity, and availability of all information assets throughout the organization. This ISMS Policy establishes the framework for managing information security risks and ensuring compliance with legal, regulatory, and contractual requirements.' },
            { heading: 'Objectives', body: '1. Protect information assets from unauthorized access and disclosure\n2. Ensure business continuity and minimize business damage\n3. Comply with applicable laws, regulations, and contractual obligations\n4. Build and maintain stakeholder confidence in our security posture\n5. Continuously improve the ISMS through regular review and assessment' },
            { heading: 'Risk Management', body: 'Information security risks are systematically identified, assessed, and treated in accordance with our Risk Management Methodology. Risk assessments are conducted:\n\n• At least annually as part of the ISMS review cycle\n• When significant changes occur to systems or processes\n• When new threats or vulnerabilities are identified\n• As part of new project or service development' },
        ]
    },

    // Compliance Reports (category 5)
    {
        filename: 'demo-security-whitepaper.pdf',
        title: 'Security Whitepaper',
        sections: [
            { heading: 'Acme Security — Security Whitepaper', body: 'Version: 4.0 — January 2026\n\nThis document provides a comprehensive overview of the security architecture, practices, and compliance posture of Acme Security.' },
            { heading: 'Infrastructure Security', body: 'Our platform is hosted on Amazon Web Services (AWS) and leverages multiple layers of security:\n\n• Network Security: VPC isolation, security groups, NACLs, AWS WAF\n• Compute Security: Container-based deployments, immutable infrastructure\n• Data Security: AES-256 encryption at rest, TLS 1.3 in transit\n• Identity: AWS IAM with least-privilege access, MFA enforced\n• Monitoring: CloudWatch, CloudTrail, GuardDuty, Security Hub' },
            { heading: 'Application Security', body: 'Security is embedded throughout our software development lifecycle:\n\n• Secure coding training for all developers\n• Automated SAST/DAST scanning in CI/CD pipeline\n• Dependency vulnerability scanning with Snyk\n• Peer code review for all changes\n• Quarterly penetration testing by independent firms\n• Bug bounty program for responsible disclosure' },
            { heading: 'Compliance Framework', body: 'Acme Security maintains compliance with:\n\n• SOC 2 Type II (Security, Availability, Confidentiality)\n• ISO 27001:2022\n• GDPR\n• CCPA\n• HIPAA\n• PCI DSS Level 1\n• CSA STAR Level 2' },
            { heading: 'Incident Response', body: 'Our incident response process follows NIST SP 800-61:\n\n1. Preparation — Documented procedures, trained team, regular drills\n2. Detection & Analysis — 24/7 monitoring, automated alerts\n3. Containment — Immediate containment within 1 hour of detection\n4. Eradication & Recovery — Root cause analysis, system restoration\n5. Post-Incident — Lessons learned, process improvements\n\nMean Time to Detect (MTTD): < 15 minutes\nMean Time to Respond (MTTR): < 1 hour' },
        ]
    },
    {
        filename: 'demo-business-continuity.pdf',
        title: 'Business Continuity Plan Summary',
        sections: [
            { heading: 'Business Continuity Plan — Executive Summary', body: 'Document Owner: VP of Operations\nLast Updated: November 2025\nClassification: Confidential' },
            { heading: 'Recovery Objectives', body: 'Recovery Time Objective (RTO): 4 hours\nRecovery Point Objective (RPO): 1 hour\n\nThese objectives apply to all critical business functions and are tested quarterly through tabletop exercises and annual full-scale recovery tests.' },
            { heading: 'High Availability Architecture', body: '• Multi-AZ database deployment with automatic failover\n• Container orchestration with auto-scaling\n• Global CDN with automatic origin failover\n• DNS-based failover for complete region failure\n• Automated backup every hour to separate AWS region' },
            { heading: 'Annual Test Results', body: 'Last BCP Test: October 2025\nTest Type: Full failover drill\nResult: PASSED\nActual Recovery Time: 2 hours 15 minutes (within 4-hour RTO)\nActual Data Loss: 0 records (within 1-hour RPO)' },
        ]
    },
    {
        filename: 'demo-vendor-risk.pdf',
        title: 'Vendor Risk Management Policy',
        sections: [
            { heading: 'Vendor Risk Management Policy', body: 'Document Owner: Chief Information Security Officer\nEffective Date: January 2026\nReview Cycle: Annual' },
            { heading: 'Vendor Classification', body: 'All vendors are classified based on data access and criticality:\n\nTier 1 (Critical): Vendors with access to customer data or critical infrastructure\n• Annual security assessment required\n• SOC 2 or ISO 27001 certification required\n• Continuous monitoring\n\nTier 2 (Important): Vendors with access to internal systems\n• Biennial security assessment\n• Security questionnaire required\n\nTier 3 (Standard): Low-risk vendors\n• Initial security review\n• Periodic reassessment' },
            { heading: 'Current Tier 1 Vendors', body: '1. Amazon Web Services — Cloud infrastructure (SOC 2, ISO 27001)\n2. Supabase — Database platform (SOC 2)\n3. Cloudflare — CDN and security (SOC 2, ISO 27001)\n4. Resend — Email delivery (SOC 2 in progress)\n5. GitHub — Source code management (SOC 2, ISO 27001)' },
        ]
    },
    {
        filename: 'demo-encryption-standards.pdf',
        title: 'Encryption Standards Document',
        sections: [
            { heading: 'Encryption Standards', body: 'Document Owner: VP of Engineering\nApproval Date: January 2026\nClassification: Internal' },
            { heading: 'Data at Rest', body: 'All data at rest is encrypted using:\n\n• Database: AES-256 via AWS RDS encryption\n• File Storage: AES-256 via AWS S3 server-side encryption (SSE-S3)\n• Backups: AES-256 with customer-managed keys (CMK)\n• Local Storage: FileVault 2 (macOS) or BitLocker (Windows) required for all employee devices' },
            { heading: 'Data in Transit', body: 'All data in transit is encrypted using:\n\n• External Communications: TLS 1.3 (minimum TLS 1.2)\n• Internal Service Communication: mTLS between services\n• VPN: IKEv2/IPsec for remote access\n• API Communications: HTTPS enforced with HSTS' },
            { heading: 'Key Management', body: 'Encryption keys are managed through AWS Key Management Service (KMS):\n\n• Automatic key rotation every 365 days\n• Key usage logging via CloudTrail\n• Separation of duties for key administration\n• Hardware Security Module (HSM) backed key storage' },
        ]
    },
    {
        filename: 'demo-access-control.pdf',
        title: 'Access Control Policy',
        sections: [
            { heading: 'Access Control Policy', body: 'Document Owner: Chief Information Security Officer\nEffective Date: January 2026\nClassification: Internal' },
            { heading: 'Principles', body: 'Our access control follows these core principles:\n\n1. Least Privilege — Users receive only the minimum access required\n2. Need to Know — Access is granted based on business justification\n3. Separation of Duties — Critical functions require multiple approvals\n4. Defense in Depth — Multiple layers of access control' },
            { heading: 'Authentication Requirements', body: '• Multi-Factor Authentication (MFA) required for all accounts\n• Password minimum 14 characters with complexity requirements\n• Passwords rotated every 90 days\n• SSO integration via SAML 2.0 / OpenID Connect\n• Session timeout after 30 minutes of inactivity\n• Account lockout after 5 failed attempts' },
            { heading: 'Access Reviews', body: 'Access reviews are conducted:\n\n• Quarterly for privileged accounts\n• Semi-annually for standard user accounts\n• Immediately upon role change or termination\n• Annually as part of compliance audit\n\nAll access reviews are documented and findings remediated within 30 days.' },
        ]
    },
];

function generatePDF(doc, outputPath) {
    return new Promise((resolve, reject) => {
        const pdf = new PDFDocument({
            size: 'A4',
            margins: { top: 72, bottom: 72, left: 72, right: 72 },
            info: {
                Title: doc.title,
                Author: 'Acme Security',
                Subject: doc.title,
                Creator: 'Trust Center Demo',
            }
        });

        const stream = fs.createWriteStream(outputPath);
        pdf.pipe(stream);

        // Header bar
        pdf.rect(0, 0, 595.28, 40).fill('#1e3a5f');
        pdf.fill('#ffffff').fontSize(10).text('ACME SECURITY — CONFIDENTIAL', 72, 14, { align: 'center' });

        // Reset position
        pdf.fill('#000000');
        let y = 80;

        doc.sections.forEach((section, idx) => {
            if (idx > 0 && y > 650) {
                pdf.addPage();
                // Header on new pages
                pdf.rect(0, 0, 595.28, 40).fill('#1e3a5f');
                pdf.fill('#ffffff').fontSize(10).text('ACME SECURITY — CONFIDENTIAL', 72, 14, { align: 'center' });
                pdf.fill('#000000');
                y = 80;
            }

            // Section heading
            if (idx === 0) {
                // Title page heading
                pdf.fontSize(22).font('Helvetica-Bold').fillColor('#1e3a5f');
                pdf.text(section.heading, 72, y, { width: 451.28 });
                y = pdf.y + 20;

                // Divider
                pdf.moveTo(72, y).lineTo(523.28, y).strokeColor('#1e3a5f').lineWidth(2).stroke();
                y += 20;
            } else {
                pdf.fontSize(14).font('Helvetica-Bold').fillColor('#1e3a5f');
                pdf.text(section.heading, 72, y, { width: 451.28 });
                y = pdf.y + 8;
            }

            // Section body
            pdf.fontSize(10.5).font('Helvetica').fillColor('#333333');
            pdf.text(section.body, 72, y, { width: 451.28, lineGap: 3 });
            y = pdf.y + 24;
        });

        // Footer
        const pageCount = pdf.bufferedPageRange().count;
        for (let i = 0; i < pageCount; i++) {
            pdf.switchToPage(i);
            pdf.fontSize(8).fillColor('#999999');
            pdf.text(
                `© 2026 Acme Security  |  ${doc.title}  |  Page ${i + 1} of ${pageCount}`,
                72, 770, { width: 451.28, align: 'center' }
            );
        }

        pdf.end();

        stream.on('finish', () => {
            const stats = fs.statSync(outputPath);
            resolve({ size: stats.size });
        });
        stream.on('error', reject);
    });
}

async function main() {
    console.log('Generating 20 demo PDF documents...');
    console.log(`Output directory: ${OUTPUT_DIR}\n`);

    const results = [];

    for (const doc of documents) {
        const outputPath = path.join(OUTPUT_DIR, doc.filename);
        try {
            const { size } = await generatePDF(doc, outputPath);
            console.log(`✓ ${doc.filename} (${(size / 1024).toFixed(1)} KB)`);
            results.push({ ...doc, size, path: `documents/${doc.filename}` });
        } catch (err) {
            console.error(`✗ ${doc.filename}: ${err.message}`);
        }
    }

    console.log(`\nGenerated ${results.length} / ${documents.length} documents`);

    // Output JSON manifest for seed SQL reference
    const manifest = results.map(r => ({
        file_url: r.path,
        file_name: r.filename,
        file_size: r.size,
        file_type: 'application/pdf',
        title: r.title,
    }));

    fs.writeFileSync(
        path.join(OUTPUT_DIR, 'manifest.json'),
        JSON.stringify(manifest, null, 2)
    );
    console.log('\nManifest written to documents/manifest.json');
}

main().catch(console.error);
