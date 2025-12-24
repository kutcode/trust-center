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

