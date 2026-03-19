import { validateEmail, extractDomain, isDisposableEmail } from '../../utils/emailValidation';

describe('Email Validation Utilities', () => {
  describe('validateEmail', () => {
    it('should accept valid email addresses', () => {
      expect(validateEmail('user@example.com')).toBe(true);
      expect(validateEmail('admin@company.co.uk')).toBe(true);
      expect(validateEmail('test.user+tag@domain.org')).toBe(true);
    });

    it('should reject invalid email addresses', () => {
      expect(validateEmail('')).toBe(false);
      expect(validateEmail('not-an-email')).toBe(false);
      expect(validateEmail('@domain.com')).toBe(false);
      expect(validateEmail('user@')).toBe(false);
    });
  });

  describe('extractDomain', () => {
    it('should extract domain from email address', () => {
      expect(extractDomain('user@example.com')).toBe('example.com');
      expect(extractDomain('admin@sub.domain.co.uk')).toBe('sub.domain.co.uk');
    });

    it('should handle edge cases', () => {
      expect(extractDomain('')).toBe('');
      expect(extractDomain('no-at-sign')).toBe('');
    });
  });

  describe('isDisposableEmail', () => {
    it('should identify common disposable email providers', () => {
      expect(isDisposableEmail('user@mailinator.com')).toBe(true);
      expect(isDisposableEmail('user@guerrillamail.com')).toBe(true);
    });

    it('should allow legitimate email domains', () => {
      expect(isDisposableEmail('user@company.com')).toBe(false);
      expect(isDisposableEmail('user@gmail.com')).toBe(false);
    });
  });
});
