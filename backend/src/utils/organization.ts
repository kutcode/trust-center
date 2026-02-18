import { supabase } from '../server';

const PERSONAL_EMAIL_DOMAINS = [
  'gmail.com',
  'yahoo.com',
  'outlook.com',
  'hotmail.com',
  'icloud.com',
  'protonmail.com',
  'aol.com',
  'mail.com',
  'yandex.com',
  'zoho.com',
];

/**
 * Extract email domain from email address
 */
export const extractEmailDomain = (email: string): string | null => {
  const parts = email.split('@');
  if (parts.length !== 2) return null;
  return parts[1].toLowerCase();
};

/**
 * Check if email domain is a personal email provider
 */
export const isPersonalEmailDomain = (domain: string): boolean => {
  return PERSONAL_EMAIL_DOMAINS.includes(domain.toLowerCase());
};

/**
 * Get or create organization by email domain
 */
export const getOrCreateOrganization = async (
  emailDomain: string,
  companyName?: string
): Promise<{ id: string; email_domain: string }> => {
  // Check if organization exists
  const { data: existingOrg } = await supabase
    .from('organizations')
    .select('id, email_domain')
    .eq('email_domain', emailDomain)
    .single();

  if (existingOrg) {
    return existingOrg;
  }

  // Create new organization
  const orgName = companyName || emailDomain.split('.')[0].charAt(0).toUpperCase() + emailDomain.split('.')[0].slice(1);

  const { data: newOrg, error } = await supabase
    .from('organizations')
    .insert({
      email_domain: emailDomain,
      name: orgName,
      approved_document_ids: [],
    })
    .select('id, email_domain')
    .single();

  if (error || !newOrg) {
    throw new Error(`Failed to create organization: ${error?.message}`);
  }

  return newOrg;
};

/**
 * Check organization access status and whether to auto-approve
 */
export const checkOrganizationAccess = async (organizationId: string): Promise<{
  hasAccess: boolean;
  autoApproveAll: boolean;
  isArchived: boolean;
  status: 'whitelisted' | 'conditional' | 'no_access' | null;
}> => {
  const { data: org, error } = await supabase
    .from('organizations')
    .select('status, is_active')
    .eq('id', organizationId)
    .single();

  if (error || !org) {
    return { hasAccess: false, autoApproveAll: false, isArchived: false, status: null };
  }

  // Only block if status is explicitly no_access
  // Archived orgs (is_active=false, status=conditional) can still submit requests
  if (org.status === 'no_access') {
    return { hasAccess: false, autoApproveAll: false, isArchived: false, status: org.status as any };
  }

  const isArchived = !org.is_active;

  // Whitelisted organizations auto-approve all documents (but not if archived)
  if (org.status === 'whitelisted' && !isArchived) {
    return { hasAccess: true, autoApproveAll: true, isArchived: false, status: 'whitelisted' };
  }

  // Conditional or archived organizations need case-by-case approval
  return { hasAccess: true, autoApproveAll: false, isArchived, status: org.status as any };
};

/**
 * Check if a specific document should be auto-approved for an organization
 */
export const canAutoApproveDocument = async (
  organizationId: string,
  documentId: string
): Promise<boolean> => {
  const accessCheck = await checkOrganizationAccess(organizationId);

  // Whitelisted organizations auto-approve all documents
  if (accessCheck.autoApproveAll) {
    return true;
  }

  // Conditional organizations only auto-approve documents in their approved list
  if (accessCheck.status === 'conditional') {
    const { data: org } = await supabase
      .from('organizations')
      .select('approved_document_ids')
      .eq('id', organizationId)
      .single();

    if (org && org.approved_document_ids) {
      return org.approved_document_ids.includes(documentId);
    }
  }

  return false;
};

