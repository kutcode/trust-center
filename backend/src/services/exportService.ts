import { SupabaseClient } from '@supabase/supabase-js';

export interface ExportMetadata {
    version: string;
    exportedAt: string;
    trustCenterName: string;
    exportedBy?: string;
}

export interface CertificationExport {
    id: string;
    name: string;
    issuer: string;
    issuedDate: string | null;
    expirationDate: string | null;
    description: string | null;
    status: string;
    displayOrder: number;
}

export interface ControlExport {
    id: string;
    title: string;
    description: string | null;
    sortOrder: number;
}

export interface ControlCategoryExport {
    id: string;
    name: string;
    description: string | null;
    icon: string | null;
    sortOrder: number;
    controls: ControlExport[];
}

export interface DocumentExport {
    id: string;
    title: string;
    description: string | null;
    category: string | null;
    categoryId: string | null;
    version: string | null;
    accessLevel: string;
    status: string;
    publishedAt: string | null;
    lastUpdated: string;
}

export interface SecurityUpdateExport {
    id: string;
    title: string;
    content: string;
    severity: string | null;
    publishedAt: string | null;
    createdAt: string;
}

export interface SubprocessorExport {
    id: string;
    name: string;
    purpose: string;
    dataLocation: string | null;
    websiteUrl: string | null;
    category: string;
}

export interface OrganizationInfo {
    name: string | null;
    website: string | null;
    contactEmail: string | null;
    supportEmail: string | null;
}

export interface TrustCenterExport {
    exportMetadata: ExportMetadata;
    organization: OrganizationInfo;
    certifications?: CertificationExport[];
    controls?: {
        categories: ControlCategoryExport[];
    };
    documents?: DocumentExport[];
    securityUpdates?: SecurityUpdateExport[];
    subprocessors?: SubprocessorExport[];
}

export type ExportSection = 'certifications' | 'controls' | 'documents' | 'securityUpdates' | 'subprocessors';

export class ExportService {
    private supabase: SupabaseClient;

    constructor(supabase: SupabaseClient) {
        this.supabase = supabase;
    }

    /**
     * Get trust center settings for organization info
     */
    private async getOrganizationInfo(): Promise<OrganizationInfo> {
        const { data: settings } = await this.supabase
            .from('trust_center_settings')
            .select('company_name, contact_email, support_email, social_links')
            .single();

        return {
            name: settings?.company_name || null,
            website: settings?.social_links?.website || null,
            contactEmail: settings?.contact_email || null,
            supportEmail: settings?.support_email || null,
        };
    }

    /**
     * Export certifications
     */
    async exportCertifications(since?: Date): Promise<CertificationExport[]> {
        let query = this.supabase
            .from('certifications')
            .select('id, name, issuer, issue_date, expiry_date, description, status, display_order')
            .eq('status', 'active')
            .order('display_order', { ascending: true });

        if (since) {
            query = query.gte('updated_at', since.toISOString());
        }

        const { data, error } = await query;

        if (error) throw error;

        return (data || []).map((cert) => ({
            id: cert.id,
            name: cert.name,
            issuer: cert.issuer,
            issuedDate: cert.issue_date,
            expirationDate: cert.expiry_date,
            description: cert.description,
            status: cert.status,
            displayOrder: cert.display_order,
        }));
    }

    /**
     * Export controls with categories
     */
    async exportControls(since?: Date): Promise<{ categories: ControlCategoryExport[] }> {
        // Get categories
        let categoryQuery = this.supabase
            .from('control_categories')
            .select('id, name, description, icon, sort_order')
            .order('sort_order', { ascending: true });

        if (since) {
            categoryQuery = categoryQuery.gte('updated_at', since.toISOString());
        }

        const { data: categories, error: catError } = await categoryQuery;

        if (catError) throw catError;

        // Get controls
        const { data: controls, error: ctrlError } = await this.supabase
            .from('controls')
            .select('id, category_id, title, description, sort_order')
            .order('sort_order', { ascending: true });

        if (ctrlError) throw ctrlError;

        // Map controls to categories
        const categoryExports: ControlCategoryExport[] = (categories || []).map((cat) => ({
            id: cat.id,
            name: cat.name,
            description: cat.description,
            icon: cat.icon,
            sortOrder: cat.sort_order,
            controls: (controls || [])
                .filter((ctrl) => ctrl.category_id === cat.id)
                .map((ctrl) => ({
                    id: ctrl.id,
                    title: ctrl.title,
                    description: ctrl.description,
                    sortOrder: ctrl.sort_order,
                })),
        }));

        return { categories: categoryExports };
    }

    /**
     * Export documents (metadata only, not file contents)
     */
    async exportDocuments(since?: Date): Promise<DocumentExport[]> {
        let query = this.supabase
            .from('documents')
            .select(`
        id, 
        title, 
        description, 
        category_id,
        version, 
        access_level, 
        status, 
        published_at, 
        updated_at,
        document_categories(name)
      `)
            .eq('status', 'published')
            .eq('is_current_version', true)
            .order('title', { ascending: true });

        if (since) {
            query = query.gte('updated_at', since.toISOString());
        }

        const { data, error } = await query;

        if (error) throw error;

        return (data || []).map((doc: any) => ({
            id: doc.id,
            title: doc.title,
            description: doc.description,
            category: doc.document_categories?.name || null,
            categoryId: doc.category_id,
            version: doc.version,
            accessLevel: doc.access_level,
            status: doc.status,
            publishedAt: doc.published_at,
            lastUpdated: doc.updated_at,
        }));
    }

    /**
     * Export security updates
     */
    async exportSecurityUpdates(since?: Date): Promise<SecurityUpdateExport[]> {
        let query = this.supabase
            .from('security_updates')
            .select('id, title, content, severity, published_at, created_at')
            .not('published_at', 'is', null)
            .order('published_at', { ascending: false });

        if (since) {
            query = query.gte('updated_at', since.toISOString());
        }

        const { data, error } = await query;

        if (error) throw error;

        return (data || []).map((update) => ({
            id: update.id,
            title: update.title,
            content: update.content,
            severity: update.severity,
            publishedAt: update.published_at,
            createdAt: update.created_at,
        }));
    }

    /**
     * Export subprocessors
     */
    async exportSubprocessors(since?: Date): Promise<SubprocessorExport[]> {
        let query = this.supabase
            .from('subprocessors')
            .select('id, name, purpose, data_location, website_url, category')
            .eq('is_active', true)
            .order('display_order', { ascending: true });

        if (since) {
            query = query.gte('updated_at', since.toISOString());
        }

        const { data, error } = await query;

        if (error) throw error;

        return (data || []).map((sub) => ({
            id: sub.id,
            name: sub.name,
            purpose: sub.purpose,
            dataLocation: sub.data_location,
            websiteUrl: sub.website_url,
            category: sub.category,
        }));
    }

    /**
     * Full export of Trust Center data
     */
    async exportAll(
        options: {
            sections?: ExportSection[];
            since?: Date;
            adminEmail?: string;
        } = {}
    ): Promise<TrustCenterExport> {
        const {
            sections = ['certifications', 'controls', 'documents', 'securityUpdates', 'subprocessors'],
            since,
            adminEmail,
        } = options;

        const organizationInfo = await this.getOrganizationInfo();

        const exportData: TrustCenterExport = {
            exportMetadata: {
                version: '1.0',
                exportedAt: new Date().toISOString(),
                trustCenterName: organizationInfo.name || 'Trust Center',
                exportedBy: adminEmail,
            },
            organization: organizationInfo,
        };

        // Export requested sections in parallel
        const exportPromises: Promise<void>[] = [];

        if (sections.includes('certifications')) {
            exportPromises.push(
                this.exportCertifications(since).then((data) => {
                    exportData.certifications = data;
                })
            );
        }

        if (sections.includes('controls')) {
            exportPromises.push(
                this.exportControls(since).then((data) => {
                    exportData.controls = data;
                })
            );
        }

        if (sections.includes('documents')) {
            exportPromises.push(
                this.exportDocuments(since).then((data) => {
                    exportData.documents = data;
                })
            );
        }

        if (sections.includes('securityUpdates')) {
            exportPromises.push(
                this.exportSecurityUpdates(since).then((data) => {
                    exportData.securityUpdates = data;
                })
            );
        }

        if (sections.includes('subprocessors')) {
            exportPromises.push(
                this.exportSubprocessors(since).then((data) => {
                    exportData.subprocessors = data;
                })
            );
        }

        await Promise.all(exportPromises);

        return exportData;
    }

    /**
     * Convert export data to CSV format for a specific section
     */
    convertToCSV(data: any[], section: ExportSection): string {
        if (!data || data.length === 0) {
            return '';
        }

        // Get headers from first object
        const headers = Object.keys(data[0]);
        const csvRows: string[] = [];

        // Add header row
        csvRows.push(headers.join(','));

        // Add data rows
        for (const row of data) {
            const values = headers.map((header) => {
                const value = row[header];
                // Handle nested objects, nulls, and escape quotes
                if (value === null || value === undefined) {
                    return '';
                }
                if (typeof value === 'object') {
                    return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
                }
                const stringValue = String(value);
                // Escape quotes and wrap in quotes if contains comma or newline
                if (stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('"')) {
                    return `"${stringValue.replace(/"/g, '""')}"`;
                }
                return stringValue;
            });
            csvRows.push(values.join(','));
        }

        return csvRows.join('\n');
    }
}
