export interface Document {
  id: string;
  title: string;
  description?: string;
  category_id?: string;
  access_level: 'public' | 'restricted';
  file_url: string;
  file_name: string;
  file_size: number;
  file_type: string;
  version?: string;
  status: 'draft' | 'published' | 'archived';
  created_at: string;
  updated_at: string;
  document_categories?: DocumentCategory;
}

export interface DocumentCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  display_order: number;
}

export interface DocumentRequest {
  id: string;
  requester_name: string;
  requester_email: string;
  requester_company: string;
  organization_id?: string;
  document_ids: string[];
  request_reason?: string;
  status: 'pending' | 'approved' | 'denied' | 'auto_approved';
  magic_link_token?: string;
  magic_link_expires_at?: string;
  created_at: string;
  documents?: Document[];
  organizations?: Organization;
}

export interface Organization {
  id: string;
  name: string;
  email_domain: string;
  status: 'whitelisted' | 'conditional' | 'no_access';
  is_active: boolean;
  approved_document_ids: string[];
  notes?: string;
  revoked_at?: string;
  first_approved_at?: string;
  last_approved_at?: string;
}

export interface Certification {
  id: string;
  name: string;
  issuer: string;
  issue_date?: string;
  expiry_date?: string;
  certificate_image_url?: string;
  description?: string;
  status: 'active' | 'inactive';
  display_order: number;
}

export interface SecurityUpdate {
  id: string;
  title: string;
  content: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  published_at?: string;
  created_at: string;
}

export interface TrustCenterSettings {
  id: string;
  company_name?: string;
  company_logo_url?: string;
  favicon_url?: string;
  primary_color: string;
  secondary_color: string;
  accent_color?: string;
  hero_title?: string;
  hero_subtitle?: string;
  hero_image_url?: string;
  about_section?: string;
  contact_email?: string;
  support_email?: string;
  social_links?: Record<string, string>;
  footer_text?: string;
  font_family?: string;
  footer_links?: Array<{ label: string; url: string }>;
}

