/**
 * Email validation utilities
 * Provides secure email validation without exposing sensitive data
 */

// RFC 5322 compliant email regex (simplified version)
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

// Blocklist for test/example domains (only in production)
const BLOCKED_DOMAINS = [
  'example.com',
  'test.com',
  'localhost',
  'test.local',
];

/**
 * Validates email address format
 * @param email Email address to validate
 * @returns true if valid, false otherwise
 */
export function validateEmailAddress(email: string): boolean {
  if (!email || typeof email !== 'string') {
    return false;
  }

  // Basic length check
  if (email.length > 254) {
    return false;
  }

  // Format validation
  if (!EMAIL_REGEX.test(email)) {
    return false;
  }

  // Additional checks
  const parts = email.split('@');
  if (parts.length !== 2) {
    return false;
  }

  const [localPart, domain] = parts;

  // Local part validation
  if (localPart.length === 0 || localPart.length > 64) {
    return false;
  }

  // Domain validation
  if (domain.length === 0 || domain.length > 253) {
    return false;
  }

  // Check for consecutive dots
  if (email.includes('..')) {
    return false;
  }

  return true;
}

/**
 * Checks if email domain is blocked (for production)
 * @param email Email address to check
 * @param isProduction Whether we're in production mode
 * @returns true if domain is blocked, false otherwise
 */
export function isBlockedDomain(email: string, isProduction: boolean = false): boolean {
  if (!isProduction) {
    return false; // Allow all domains in development
  }

  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) {
    return true;
  }

  return BLOCKED_DOMAINS.some(blocked => domain === blocked || domain.endsWith(`.${blocked}`));
}

/**
 * Sanitizes email address for logging (only shows domain)
 * @param email Email address to sanitize
 * @returns Sanitized email (e.g., "@example.com")
 */
export function sanitizeEmailForLogging(email: string): string {
  if (!email || !email.includes('@')) {
    return '@unknown';
  }

  const domain = email.split('@')[1];
  return `@${domain}`;
}

/**
 * Extracts domain from email address
 * @param email Email address
 * @returns Domain or null if invalid
 */
export function getEmailDomain(email: string): string | null {
  if (!validateEmailAddress(email)) {
    return null;
  }

  const parts = email.split('@');
  return parts.length === 2 ? parts[1].toLowerCase() : null;
}

