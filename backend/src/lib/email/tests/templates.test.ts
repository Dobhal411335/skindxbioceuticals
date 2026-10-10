import { SITE_DISPLAY_NAMES } from '../company/company.constants';
import { EmailValidationError } from '../email.errors';
import {
  renderEnquiryConfirmationEmail,
  renderOrderConfirmationEmail,
  renderOrderShippedEmail,
  renderOtpEmail,
  renderPasswordResetEmail,
  renderPaymentFailedEmail,
  renderWelcomeEmail,
} from '../templates';

describe('email templates', () => {
  describe('shared layout', () => {
    it('renders HTML and plain text with header and footer', () => {
      const rendered = renderWelcomeEmail({ siteCode: 'IN' });

      expect(rendered.subject).toContain(SITE_DISPLAY_NAMES.IN);
      expect(rendered.html).toContain('<!DOCTYPE html>');
      expect(rendered.html).toContain(SITE_DISPLAY_NAMES.IN);
      expect(rendered.html).toContain('support@test.example.com');
      expect(rendered.html).toContain('http://localhost:3000');
      expect(rendered.html).toContain('All rights reserved');
      expect(rendered.text).toContain(SITE_DISPLAY_NAMES.IN);
      expect(rendered.text).toContain('support@test.example.com');
      expect(rendered.text).toContain('http://localhost:3000');
    });

    it('does not add marketing unsubscribe language to transactional emails', () => {
      const rendered = renderWelcomeEmail({ siteCode: 'IN' });
      expect(rendered.html.toLowerCase()).not.toContain('unsubscribe from marketing');
      expect(rendered.text.toLowerCase()).not.toContain('unsubscribe from marketing');
    });
  });

  describe('site branding', () => {
    it('uses IN site URL and display name', () => {
      const rendered = renderWelcomeEmail({ siteCode: 'IN', displayName: 'Ada' });
      expect(rendered.html).toContain(SITE_DISPLAY_NAMES.IN);
      expect(rendered.html).toContain('http://localhost:3000');
      expect(rendered.html).not.toContain('http://localhost:3001');
      expect(rendered.text).toContain('Welcome, Ada!');
    });

    it('uses COM site URL and display name', () => {
      const rendered = renderWelcomeEmail({ siteCode: 'COM' });
      expect(rendered.html).toContain(SITE_DISPLAY_NAMES.COM);
      expect(rendered.html).toContain('http://localhost:3001');
      expect(rendered.subject).toContain(SITE_DISPLAY_NAMES.COM);
    });
  });

  describe('OTP template', () => {
    it('includes purpose, expiry, and share warning', () => {
      const rendered = renderOtpEmail({
        siteCode: 'IN',
        otpCode: '123456',
        purpose: 'email verification',
        expiresInMinutes: 10,
      });

      expect(rendered.html).toContain('123456');
      expect(rendered.html).toContain('email verification');
      expect(rendered.html).toContain('10 minutes');
      expect(rendered.html).toContain('Do not share');
      expect(rendered.text).toContain('Code: 123456');
    });

    it('escapes user-controlled purpose text', () => {
      const rendered = renderOtpEmail({
        siteCode: 'IN',
        otpCode: '999999',
        purpose: '<img src=x onerror=alert(1)>',
        expiresInMinutes: 5,
      });

      expect(rendered.html).not.toContain('<img src=x');
      expect(rendered.html).toContain('&lt;img src=x');
    });

    it('rejects invalid expiry', () => {
      expect(() =>
        renderOtpEmail({
          siteCode: 'IN',
          otpCode: '123456',
          purpose: 'login',
          expiresInMinutes: 0,
        }),
      ).toThrow(EmailValidationError);
    });
  });

  describe('password reset template', () => {
    it('includes reset link and security notice', () => {
      const resetUrl = 'http://localhost:3000/reset?token=secure-token';
      const rendered = renderPasswordResetEmail({
        siteCode: 'IN',
        resetUrl,
        expiresInMinutes: 30,
      });

      expect(rendered.html).toContain(resetUrl);
      expect(rendered.html).toContain('30 minutes');
      expect(rendered.html).toContain('If you did not request');
      expect(rendered.text).toContain(resetUrl);
      expect(rendered.html.toLowerCase()).not.toContain('password=');
    });

    it('rejects open-redirect reset URLs', () => {
      expect(() =>
        renderPasswordResetEmail({
          siteCode: 'IN',
          resetUrl: 'https://evil.example.com/reset',
          expiresInMinutes: 30,
        }),
      ).toThrow(EmailValidationError);
    });
  });

  describe('order confirmation template', () => {
    const baseInput = {
      siteCode: 'IN' as const,
      orderReference: 'ORD-1001',
      items: [
        {
          name: 'Serum <script>',
          quantity: 2,
          unitPrice: '499.00',
          lineTotal: '998.00',
        },
      ],
      breakdown: {
        subtotal: '998.00',
        shipping: '50.00',
        total: '1048.00',
        currency: 'INR',
      },
      orderDetailsUrl: 'http://localhost:3000/orders/ORD-1001',
    };

    it('renders items, totals, and both HTML and text', () => {
      const rendered = renderOrderConfirmationEmail(baseInput);

      expect(rendered.subject).toContain('ORD-1001');
      expect(rendered.html).toContain('ORD-1001');
      expect(rendered.html).toContain('Serum &lt;script&gt;');
      expect(rendered.html).not.toContain('<script>');
      expect(rendered.html).toContain('1048.00');
      expect(rendered.html).toContain('INR');
      expect(rendered.text).toContain('Serum <script>');
      expect(rendered.text).toContain('Total (INR): 1048.00');
    });

    it('omits shipping address when not provided', () => {
      const rendered = renderOrderConfirmationEmail(baseInput);
      expect(rendered.html).not.toContain('Shipping address');
      expect(rendered.text).not.toContain('Shipping address');
    });

    it('includes shipping address when provided', () => {
      const rendered = renderOrderConfirmationEmail({
        ...baseInput,
        shippingAddress: {
          name: 'Ada Lovelace',
          line1: '12 Main St',
          city: 'Mumbai',
          country: 'IN',
        },
      });

      expect(rendered.html).toContain('Shipping address');
      expect(rendered.html).toContain('12 Main St');
      expect(rendered.text).toContain('Ada Lovelace');
    });

    it('rejects empty item lists', () => {
      expect(() =>
        renderOrderConfirmationEmail({ ...baseInput, items: [] }),
      ).toThrow(EmailValidationError);
    });
  });

  describe('payment failed template', () => {
    it('includes safe failure message and optional retry link', () => {
      const rendered = renderPaymentFailedEmail({
        siteCode: 'IN',
        orderReference: 'ORD-2002',
        safeFailureMessage: 'Your card was declined. Please try another method.',
        retryUrl: 'http://localhost:3000/checkout/retry',
      });

      expect(rendered.html).toContain('ORD-2002');
      expect(rendered.html).toContain('Your card was declined');
      expect(rendered.html).toContain('http://localhost:3000/checkout/retry');
      expect(rendered.html).not.toContain('razorpay_error');
    });

    it('handles missing retry URL', () => {
      const rendered = renderPaymentFailedEmail({
        siteCode: 'IN',
        orderReference: 'ORD-2002',
        safeFailureMessage: 'Payment could not be completed.',
      });

      expect(rendered.html).toContain('Payment could not be completed');
      expect(rendered.html).not.toContain('Try again');
    });
  });

  describe('order shipped template', () => {
    it('handles missing optional tracking fields', () => {
      const rendered = renderOrderShippedEmail({
        siteCode: 'IN',
        orderReference: 'ORD-3003',
        orderDetailsUrl: 'http://localhost:3000/orders/ORD-3003',
      });

      expect(rendered.html).toContain('ORD-3003');
      expect(rendered.html).not.toContain('Carrier:');
      expect(rendered.html).not.toContain('Tracking reference');
      expect(rendered.text).toContain('View order details');
    });

    it('includes carrier and tracking when supplied', () => {
      const rendered = renderOrderShippedEmail({
        siteCode: 'IN',
        orderReference: 'ORD-3003',
        carrier: 'Demo Carrier',
        trackingReference: 'TRK-99',
        trackingUrl: 'https://track.example.com/TRK-99',
        orderDetailsUrl: 'http://localhost:3000/orders/ORD-3003',
      });

      expect(rendered.html).toContain('Demo Carrier');
      expect(rendered.html).toContain('TRK-99');
      expect(rendered.html).toContain('https://track.example.com/TRK-99');
    });
  });

  describe('enquiry confirmation template', () => {
    it('works without enquiry reference or response-time promise', () => {
      const rendered = renderEnquiryConfirmationEmail({ siteCode: 'COM' });

      expect(rendered.html).toContain('received your enquiry');
      expect(rendered.html).toContain(SITE_DISPLAY_NAMES.COM);
      expect(rendered.html).toContain('as soon as possible');
      expect(rendered.text).toContain('support@test.example.com');
    });

    it('includes enquiry reference when provided', () => {
      const rendered = renderEnquiryConfirmationEmail({
        siteCode: 'COM',
        enquiryReference: 'ENQ-55',
      });

      expect(rendered.subject).toContain('ENQ-55');
      expect(rendered.html).toContain('ENQ-55');
    });
  });
});
