import crypto from 'crypto';

/**
 * Generate a secure magic link token
 */
export const generateMagicLinkToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Calculate expiration date (default 7 days from now)
 */
export const getMagicLinkExpiration = (days: number = 7): Date => {
  const expiration = new Date();
  expiration.setDate(expiration.getDate() + days);
  return expiration;
};

