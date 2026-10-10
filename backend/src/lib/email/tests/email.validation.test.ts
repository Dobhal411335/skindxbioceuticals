import { EmailValidationError } from '../email.errors';
import {
  assertHttpUrl,
  assertSafeActionUrl,
  escapeHtml,
  requireNonEmptyString,
  stripControlChars,
  validateRecipient,
  validateSiteCode,
} from '../email.validation';
import { getEmailBrand } from '../company/company.config';
import { SITE_DISPLAY_NAMES } from '../company/company.constants';

describe('email.validation', () => {
  describe('escapeHtml', () => {
    it('escapes HTML special characters', () => {
      expect(escapeHtml(`<script>alert("x")</script>&'`)).toBe(
        '&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;&amp;&#39;',
      );
    });
  });

  describe('stripControlChars', () => {
    it('removes CR/LF and other control characters', () => {
      expect(stripControlChars('Alice\r\nBcc: evil@example.com')).toBe(
        'Alice  Bcc: evil@example.com',
      );
    });
  });

  describe('validateRecipient', () => {
    it('accepts a valid recipient and lowercases email', () => {
      expect(validateRecipient({ email: 'User@Example.com', name: 'Ada' })).toEqual({
        email: 'user@example.com',
        name: 'Ada',
      });
    });

    it('accepts a recipient without a name', () => {
      expect(validateRecipient({ email: 'user@example.com' })).toEqual({
        email: 'user@example.com',
        name: undefined,
      });
    });

    it('rejects an invalid email address', () => {
      expect(() => validateRecipient({ email: 'not-an-email' })).toThrow(EmailValidationError);
    });

    it('rejects missing email', () => {
      expect(() => validateRecipient({})).toThrow(EmailValidationError);
    });
  });

  describe('validateSiteCode', () => {
    it('accepts IN and COM', () => {
      expect(validateSiteCode('IN')).toBe('IN');
      expect(validateSiteCode('COM')).toBe('COM');
    });

    it('rejects unknown site codes', () => {
      expect(() => validateSiteCode('US')).toThrow(EmailValidationError);
      expect(() => validateSiteCode('')).toThrow(EmailValidationError);
    });
  });

  describe('requireNonEmptyString', () => {
    it('returns trimmed non-empty strings', () => {
      expect(requireNonEmptyString('  hello  ', 'field')).toBe('hello');
    });

    it('rejects empty or whitespace-only values', () => {
      expect(() => requireNonEmptyString('   ', 'field')).toThrow(EmailValidationError);
      expect(() => requireNonEmptyString('', 'field')).toThrow(EmailValidationError);
    });
  });

  describe('assertHttpUrl', () => {
    it('accepts http and https URLs', () => {
      expect(assertHttpUrl('https://example.com/path')).toBe('https://example.com/path');
      expect(assertHttpUrl('http://localhost:3000/reset')).toContain('http://localhost:3000/reset');
    });

    it('rejects non-http protocols', () => {
      expect(() => assertHttpUrl('javascript:alert(1)')).toThrow(EmailValidationError);
      expect(() => assertHttpUrl('ftp://files.example.com')).toThrow(EmailValidationError);
    });

    it('rejects malformed URLs', () => {
      expect(() => assertHttpUrl('not a url')).toThrow(EmailValidationError);
    });
  });

  describe('assertSafeActionUrl', () => {
    it('allows URLs on the site origin for IN', () => {
      const url = assertSafeActionUrl('http://localhost:3000/account/reset?token=abc', 'IN');
      expect(url).toContain('http://localhost:3000/account/reset');
    });

    it('allows URLs on the site origin for COM', () => {
      const url = assertSafeActionUrl('http://localhost:3001/verify?token=xyz', 'COM');
      expect(url).toContain('http://localhost:3001/verify');
    });

    it('rejects open redirects to other origins', () => {
      expect(() =>
        assertSafeActionUrl('https://evil.example.com/phish', 'IN'),
      ).toThrow(EmailValidationError);
    });

    it('allows explicitly listed external origins when provided', () => {
      const url = assertSafeActionUrl('https://track.carrier.example/abc', 'IN', {
        allowExternalOrigins: ['https://track.carrier.example'],
      });
      expect(url).toContain('https://track.carrier.example/abc');
    });
  });
});

describe('company / site branding', () => {
  it('returns IN-specific branding', () => {
    const brand = getEmailBrand('IN');
    expect(brand.siteCode).toBe('IN');
    expect(brand.siteName).toBe(SITE_DISPLAY_NAMES.IN);
    expect(brand.siteUrl).toBe('http://localhost:3000');
    expect(brand.supportEmail).toBe('support@test.example.com');
    expect(brand.companyName).toBe('SkinDx Bioc');
    expect(brand.copyrightText).toContain('SkinDx Bioc');
  });

  it('returns COM-specific branding', () => {
    const brand = getEmailBrand('COM');
    expect(brand.siteCode).toBe('COM');
    expect(brand.siteName).toBe(SITE_DISPLAY_NAMES.COM);
    expect(brand.siteUrl).toBe('http://localhost:3001');
  });

  it('does not invent logo, phone, or postal address when unset', () => {
    const brand = getEmailBrand('IN');
    expect(brand.logoUrl).toBeUndefined();
    expect(brand).not.toHaveProperty('phone');
    expect(brand).not.toHaveProperty('address');
  });
});
