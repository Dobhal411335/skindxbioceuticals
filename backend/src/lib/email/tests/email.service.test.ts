import { BrevoEmailClient } from '../email.client';
import { EmailProviderError, EmailValidationError } from '../email.errors';
import { EmailService } from '../email.service';
import type { BrevoEmailConfig } from '../email.config';
import type { BrevoSendPayload, EmailSendResult } from '../email.types';

function mockClient(result: EmailSendResult) {
  return {
    sendTransactionalEmail: jest.fn().mockResolvedValue(result),
    sendOrThrow: jest.fn(),
  } as unknown as BrevoEmailClient;
}

describe('EmailService', () => {
  it('renders OTP email and submits via the Brevo client', async () => {
    const client = mockClient({
      submitted: true,
      providerMessageId: 'msg-otp-1',
    });
    const service = new EmailService(client);

    const result = await service.sendOtpEmail({
      to: { email: 'Customer@Example.com', name: 'Ada' },
      siteCode: 'IN',
      otpCode: '654321',
      purpose: 'login',
      expiresInMinutes: 5,
    });

    expect(result).toEqual({ submitted: true, providerMessageId: 'msg-otp-1' });
    expect(client.sendTransactionalEmail).toHaveBeenCalledTimes(1);

    const payload = (client.sendTransactionalEmail as jest.Mock).mock
      .calls[0][0] as BrevoSendPayload;

    expect(payload.to).toEqual([{ email: 'customer@example.com', name: 'Ada' }]);
    expect(payload.subject).toMatch(/verification code/i);
    expect(payload.htmlContent).toContain('654321');
    expect(payload.textContent).toContain('654321');
    expect(payload.tags).toEqual(['otp']);
  });

  it('rejects invalid recipients before calling the provider', async () => {
    const client = mockClient({ submitted: true });
    const service = new EmailService(client);

    await expect(
      service.sendWelcomeEmail({
        to: { email: 'not-valid' },
        siteCode: 'IN',
      }),
    ).rejects.toBeInstanceOf(EmailValidationError);

    expect(client.sendTransactionalEmail).not.toHaveBeenCalled();
  });

  it('returns submitted=false without throwing when the provider rejects', async () => {
    const client = mockClient({
      submitted: false,
      errorCode: 'http_401',
      errorMessage: 'Email provider rejected the request',
    });
    const service = new EmailService(client);

    const result = await service.sendWelcomeEmail({
      to: { email: 'user@example.com' },
      siteCode: 'COM',
    });

    expect(result.submitted).toBe(false);
    expect(result.errorMessage).toBe('Email provider rejected the request');
    expect(JSON.stringify(result)).not.toContain('test-brevo-api-key');
  });

  it('submits welcome email with COM branding tags', async () => {
    const client = mockClient({ submitted: true, providerMessageId: 'msg-2' });
    const service = new EmailService(client);

    await service.sendWelcomeEmail({
      to: { email: 'user@example.com', name: 'Bo' },
      siteCode: 'COM',
      displayName: 'Bo',
    });

    const payload = (client.sendTransactionalEmail as jest.Mock).mock
      .calls[0][0] as BrevoSendPayload;

    expect(payload.tags).toEqual(['welcome']);
    expect(payload.htmlContent).toContain('http://localhost:3001');
    expect(payload.textContent).toContain('Welcome, Bo!');
  });

  it('submits password-reset email after validating the action URL', async () => {
    const client = mockClient({ submitted: true, providerMessageId: 'msg-reset' });
    const service = new EmailService(client);

    await service.sendPasswordResetEmail({
      to: { email: 'user@example.com' },
      siteCode: 'IN',
      resetUrl: 'http://localhost:3000/reset?token=abc',
      expiresInMinutes: 30,
    });

    const payload = (client.sendTransactionalEmail as jest.Mock).mock
      .calls[0][0] as BrevoSendPayload;

    expect(payload.tags).toEqual(['password-reset']);
    expect(payload.htmlContent).toContain('http://localhost:3000/reset?token=abc');
    expect(payload.htmlContent.toLowerCase()).not.toContain('your password is');
  });

  it('submits enquiry confirmation after validation', async () => {
    const client = mockClient({ submitted: true });
    const service = new EmailService(client);

    const result = await service.sendEnquiryConfirmationEmail({
      to: { email: 'enquirer@example.com' },
      siteCode: 'COM',
      enquiryReference: 'ENQ-1',
    });

    expect(result.submitted).toBe(true);
    const payload = (client.sendTransactionalEmail as jest.Mock).mock
      .calls[0][0] as BrevoSendPayload;
    expect(payload.tags).toEqual(['enquiry-confirmation']);
    expect(payload.subject).toContain('ENQ-1');
  });
});

describe('BrevoEmailClient', () => {
  const originalFetch = global.fetch;

  const testConfig: BrevoEmailConfig = {
    apiKey: 'secret-api-key-should-never-log',
    senderEmail: 'noreply@test.example.com',
    senderName: 'SkinDx Bioc Test',
    apiBaseUrl: 'https://api.brevo.com/v3',
    sendEmailPath: '/smtp/email',
    requestTimeoutMs: 5_000,
  };

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it('returns provider message id on successful submission', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ messageId: '<msg@brevo>' }),
    }) as unknown as typeof fetch;

    const client = new BrevoEmailClient(() => testConfig);
    const result = await client.sendTransactionalEmail({
      to: [{ email: 'user@example.com' }],
      subject: 'Hello',
      htmlContent: '<p>Hi</p>',
      textContent: 'Hi',
      tags: ['welcome'],
    });

    expect(result).toEqual({ submitted: true, providerMessageId: '<msg@brevo>' });

    const [, init] = (global.fetch as jest.Mock).mock.calls[0] as [string, RequestInit];
    const headers = init.headers as Record<string, string>;
    expect(headers['api-key']).toBe(testConfig.apiKey);

    const body = JSON.parse(String(init.body)) as Record<string, unknown>;
    expect(body.sender).toEqual({
      email: testConfig.senderEmail,
      name: testConfig.senderName,
    });
  });

  it('converts provider HTTP errors into a safe result (no API key leakage)', async () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);

    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ code: 'unauthorized', message: 'Key not valid' }),
    }) as unknown as typeof fetch;

    const client = new BrevoEmailClient(() => testConfig);
    const result = await client.sendTransactionalEmail({
      to: [{ email: 'user@example.com' }],
      subject: 'Hello',
      htmlContent: '<p>Hi</p>',
      textContent: 'Hi',
    });

    expect(result.submitted).toBe(false);
    expect(result.errorCode).toBe('unauthorized');
    expect(result.errorMessage).toBe('Email provider rejected the request');
    expect(JSON.stringify(result)).not.toContain(testConfig.apiKey);

    const logged = errorSpy.mock.calls.map((call) => JSON.stringify(call)).join(' ');
    expect(logged).not.toContain(testConfig.apiKey);
    expect(logged).not.toContain('<p>Hi</p>');
  });

  it('handles network failures safely', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    global.fetch = jest.fn().mockRejectedValue(new Error('ECONNRESET')) as unknown as typeof fetch;

    const client = new BrevoEmailClient(() => testConfig);
    const result = await client.sendTransactionalEmail({
      to: [{ email: 'user@example.com' }],
      subject: 'Hello',
      htmlContent: '<p>Hi</p>',
      textContent: 'Hi',
    });

    expect(result).toEqual({
      submitted: false,
      errorCode: 'network_error',
      errorMessage: 'Email provider request failed',
    });
  });

  it('throws EmailProviderError from sendOrThrow when submission fails', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ code: 'server_error' }),
    }) as unknown as typeof fetch;

    const client = new BrevoEmailClient(() => testConfig);

    await expect(
      client.sendOrThrow({
        to: [{ email: 'user@example.com' }],
        subject: 'Hello',
        htmlContent: '<p>Hi</p>',
        textContent: 'Hi',
      }),
    ).rejects.toBeInstanceOf(EmailProviderError);

    try {
      await client.sendOrThrow({
        to: [{ email: 'user@example.com' }],
        subject: 'Hello',
        htmlContent: '<p>Hi</p>',
        textContent: 'Hi',
      });
    } catch (error) {
      expect(error).toBeInstanceOf(EmailProviderError);
      const message = error instanceof Error ? error.message : '';
      expect(message).not.toContain(testConfig.apiKey);
      expect(message).toBe('Email provider rejected the request');
    }
  });
});
