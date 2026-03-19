import { generateMagicLinkToken, getMagicLinkExpiration } from '../../utils/magicLink';

describe('Magic Link Utilities', () => {
  describe('generateMagicLinkToken', () => {
    it('should generate a non-empty string token', () => {
      const token = generateMagicLinkToken();
      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(0);
    });

    it('should generate unique tokens on each call', () => {
      const tokens = new Set<string>();
      for (let i = 0; i < 100; i++) {
        tokens.add(generateMagicLinkToken());
      }
      expect(tokens.size).toBe(100);
    });

    it('should generate tokens of consistent length', () => {
      const token1 = generateMagicLinkToken();
      const token2 = generateMagicLinkToken();
      expect(token1.length).toBe(token2.length);
    });
  });

  describe('getMagicLinkExpiration', () => {
    it('should return a Date in the future', () => {
      const now = new Date();
      const expiration = getMagicLinkExpiration();
      expect(expiration.getTime()).toBeGreaterThan(now.getTime());
    });

    it('should return a Date roughly 7 days in the future', () => {
      const now = new Date();
      const expiration = getMagicLinkExpiration();
      const diffDays = (expiration.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
      // Allow small tolerance for execution time
      expect(diffDays).toBeGreaterThan(6.9);
      expect(diffDays).toBeLessThan(7.1);
    });
  });
});
