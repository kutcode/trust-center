import { validateEmailAddress, getEmailDomain, isBlockedDomain, sanitizeEmailForLogging } from '../../utils/emailValidation';

describe('Email Validation Utilities', () => {
  describe('validateEmailAddress', () => {
    it('should accept valid email addresses', () => {
      expect(validateEmailAddress('user@example.com')).toBe(true);
      expect(validateEmailAddress('admin@company.co.uk')).toBe(true);
    });

    it('should reject invalid email addresses', () => {
      expect(validateEmailAddress('')).toBe(false);
      expect(validateEmailAddress('not-an-email')).toBe(false);
      expect(validateEmailAddress('@domain.com')).toBe(false);
      expect(validateEmailAddress('user@')).toBe(false);
    });

    it('should reject emails with consecutive dots', () => {
      expect(validateEmailAddress('user..name@example.com')).toBe(false);
    });

    it('should reject emails exceeding max length', () => {
      const longLocal = 'a'.repeat(65);
      expect(validateEmailAddress(`${longLocal}@example.com`)).toBe(false);
    });
  });

  describe('getEmailDomain', () => {
    it('should extract domain from valid email', () => {
      expect(getEmailDomain('user@example.com')).toBe('example.com');
      expect(getEmailDomain('admin@SUB.DOMAIN.co.uk')).toBe('sub.domain.co.uk');
    });

    it('should return null for invalid emails', () => {
      expect(getEmailDomain('')).toBeNull();
      expect(getEmailDomain('no-at-sign')).toBeNull();
    });
  });

  describe('isBlockedDomain', () => {
    it('should block test domains in production mode', () => {
      expect(isBlockedDomain('user@example.com', true)).toBe(true);
      expect(isBlockedDomain('user@test.com', true)).toBe(true);
    });

    it('should allow all domains in development mode', () => {
      expect(isBlockedDomain('user@example.com', false)).toBe(false);
      expect(isBlockedDomain('user@test.com', false)).toBe(false);
    });

    it('should allow legitimate domains in production', () => {
      expect(isBlockedDomain('user@company.com', true)).toBe(false);
      expect(isBlockedDomain('user@gmail.com', true)).toBe(false);
    });
  });

  describe('sanitizeEmailForLogging', () => {
    it('should mask local part for logging', () => {
      expect(sanitizeEmailForLogging('user@example.com')).toBe('@example.com');
    });

    it('should handle invalid input', () => {
      expect(sanitizeEmailForLogging('')).toBe('@unknown');
      expect(sanitizeEmailForLogging('no-at-sign')).toBe('@unknown');
    });
  });
});
