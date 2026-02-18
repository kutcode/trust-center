/**
 * Seeds demo document records into the database.
 * Run after generate-demo-pdfs.js to insert matching DB records.
 * 
 * Requires: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const UPLOADS_DIR = process.env.UPLOADS_DIR || '/app/uploads';

async function seedDemoDocuments() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

    if (!supabaseUrl || !supabaseKey) {
        console.error('[DEMO SEED] Missing SUPABASE_URL or SUPABASE_SERVICE_KEY/SUPABASE_SERVICE_ROLE_KEY');
        process.exit(1);
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get categories
    const { data: categories, error: catError } = await supabase
        .from('document_categories')
        .select('id, slug');

    if (catError) {
        console.error('[DEMO SEED] Failed to fetch categories:', catError.message);
        process.exit(1);
    }

    const catMap = {};
    categories.forEach(c => { catMap[c.slug] = c.id; });

    // Get admin user for uploaded_by
    const { data: admins } = await supabase
        .from('admin_users')
        .select('id')
        .limit(1)
        .single();

    if (!admins) {
        console.error('[DEMO SEED] No admin user found. Create an admin first.');
        process.exit(1);
    }

    const adminId = admins.id;

    // Document definitions mapped to categories
    const documents = [
        // SOC 2 Reports
        { filename: 'demo-soc2-type2-2025.pdf', title: 'SOC 2 Type II Report 2025', description: 'Annual SOC 2 Type II audit report covering Security, Availability, and Confidentiality trust service criteria for 2025.', category: 'soc2-reports', access: 'restricted' },
        { filename: 'demo-soc2-type1-2024.pdf', title: 'SOC 2 Type I Report 2024', description: 'SOC 2 Type I report verifying the design of controls as of June 2024.', category: 'soc2-reports', access: 'restricted' },
        { filename: 'demo-soc2-bridge-letter.pdf', title: 'SOC 2 Bridge Letter', description: 'Bridge letter extending SOC 2 coverage during the gap period between audits.', category: 'soc2-reports', access: 'restricted' },
        { filename: 'demo-soc2-faq.pdf', title: 'SOC 2 Compliance FAQ', description: 'Frequently asked questions about our SOC 2 compliance program.', category: 'soc2-reports', access: 'public' },

        // Privacy Policies
        { filename: 'demo-privacy-policy.pdf', title: 'Privacy Policy', description: 'Our comprehensive privacy policy covering data collection, usage, retention, and your rights.', category: 'privacy-policies', access: 'public' },
        { filename: 'demo-dpa.pdf', title: 'Data Processing Agreement', description: 'Standard Data Processing Agreement (DPA) for data protection compliance.', category: 'privacy-policies', access: 'restricted' },
        { filename: 'demo-data-retention.pdf', title: 'Data Retention Policy', description: 'Policy governing how long different types of data are retained.', category: 'privacy-policies', access: 'public' },
        { filename: 'demo-ccpa-notice.pdf', title: 'CCPA Privacy Notice', description: 'California Consumer Privacy Act notice for California residents.', category: 'privacy-policies', access: 'public' },

        // Penetration Tests
        { filename: 'demo-pentest-q4-2025.pdf', title: 'Penetration Test Report Q4 2025', description: 'Quarterly penetration test report from CyberShield Assessment Group. All findings remediated.', category: 'penetration-tests', access: 'restricted' },
        { filename: 'demo-pentest-q2-2025.pdf', title: 'Penetration Test Report Q2 2025', description: 'Q2 2025 penetration test covering application and infrastructure security.', category: 'penetration-tests', access: 'restricted' },
        { filename: 'demo-vulnerability-mgmt.pdf', title: 'Vulnerability Management Policy', description: 'Policy covering vulnerability scanning, classification, and remediation SLAs.', category: 'penetration-tests', access: 'restricted' },
        { filename: 'demo-security-assessment.pdf', title: 'Third-Party Security Assessment Summary', description: 'Independent third-party security assessment summary from SecureReview Associates.', category: 'penetration-tests', access: 'restricted' },

        // ISO Certifications
        { filename: 'demo-iso27001-cert.pdf', title: 'ISO 27001 Certificate', description: 'ISO/IEC 27001:2022 certificate of registration for our ISMS.', category: 'iso-certifications', access: 'public' },
        { filename: 'demo-iso27001-soa.pdf', title: 'ISO 27001 Statement of Applicability', description: 'Statement of Applicability listing all ISO 27001 Annex A controls and their implementation status.', category: 'iso-certifications', access: 'restricted' },
        { filename: 'demo-iso27001-isms-policy.pdf', title: 'Information Security Management Policy', description: 'Top-level ISMS policy establishing the framework for information security management.', category: 'iso-certifications', access: 'restricted' },

        // Compliance Reports
        { filename: 'demo-security-whitepaper.pdf', title: 'Security Whitepaper', description: 'Comprehensive overview of our security architecture, practices, and compliance posture.', category: 'compliance-reports', access: 'public' },
        { filename: 'demo-business-continuity.pdf', title: 'Business Continuity Plan Summary', description: 'Executive summary of our business continuity and disaster recovery plan.', category: 'compliance-reports', access: 'restricted' },
        { filename: 'demo-vendor-risk.pdf', title: 'Vendor Risk Management Policy', description: 'Policy governing third-party vendor security assessment and monitoring.', category: 'compliance-reports', access: 'restricted' },
        { filename: 'demo-encryption-standards.pdf', title: 'Encryption Standards Document', description: 'Encryption standards for data at rest, in transit, and key management practices.', category: 'compliance-reports', access: 'restricted' },
        { filename: 'demo-access-control.pdf', title: 'Access Control Policy', description: 'Access control policy covering authentication, authorization, and access review processes.', category: 'compliance-reports', access: 'restricted' },
    ];

    let inserted = 0;
    let skipped = 0;

    for (const doc of documents) {
        const filePath = path.join(UPLOADS_DIR, 'documents', doc.filename);

        // Check if file exists
        if (!fs.existsSync(filePath)) {
            console.warn(`[DEMO SEED] File not found: ${filePath}, skipping ${doc.title}`);
            continue;
        }

        const stats = fs.statSync(filePath);
        const categoryId = catMap[doc.category];

        if (!categoryId) {
            console.warn(`[DEMO SEED] Category '${doc.category}' not found, skipping ${doc.title}`);
            continue;
        }

        // Check if document already exists (by title)
        const { data: existing } = await supabase
            .from('documents')
            .select('id')
            .eq('title', doc.title)
            .single();

        if (existing) {
            // Update the file_url in case the path changed
            await supabase
                .from('documents')
                .update({
                    file_url: `documents/${doc.filename}`,
                    file_size: stats.size,
                    file_type: 'application/pdf',
                })
                .eq('id', existing.id);
            skipped++;
            continue;
        }

        const { error: insertError } = await supabase
            .from('documents')
            .insert({
                title: doc.title,
                description: doc.description,
                category_id: categoryId,
                access_level: doc.access,
                file_url: `documents/${doc.filename}`,
                file_name: doc.filename,
                file_size: stats.size,
                file_type: 'application/pdf',
                version: '1.0',
                version_number: 1,
                is_current_version: true,
                status: 'published',
                published_at: new Date().toISOString(),
                uploaded_by: adminId,
            });

        if (insertError) {
            console.error(`[DEMO SEED] Failed to insert ${doc.title}:`, insertError.message);
        } else {
            inserted++;
        }
    }

    console.log(`[DEMO SEED] Documents: ${inserted} inserted, ${skipped} already existed`);
}

seedDemoDocuments().catch(err => {
    console.error('[DEMO SEED] Error:', err.message);
    process.exit(1);
});
