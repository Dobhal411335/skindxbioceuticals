import { logger } from '@/lib/logger';
import { getBrevoEmailConfig } from './email.config';
import { EmailProviderError } from './email.errors';
import type {
  BrevoApiErrorBody,
  BrevoApiSuccessResponse,
  BrevoSendPayload,
  EmailSendResult,
} from './email.types';

/**
 * Thin Brevo transactional email client using Node fetch.
 * Callers should treat a successful response as "submitted", not "delivered".
 */
export class BrevoEmailClient {
  constructor(private readonly getConfig = getBrevoEmailConfig) {}

  async sendTransactionalEmail(payload: BrevoSendPayload): Promise<EmailSendResult> {
    const config = this.getConfig();
    const url = `${config.apiBaseUrl}${config.sendEmailPath}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), config.requestTimeoutMs);

    const body = {
      sender: {
        email: config.senderEmail,
        name: config.senderName,
      },
      to: payload.to.map((recipient) => ({
        email: recipient.email,
        ...(recipient.name ? { name: recipient.name } : {}),
      })),
      subject: payload.subject,
      htmlContent: payload.htmlContent,
      textContent: payload.textContent,
      ...(config.replyTo
        ? {
            replyTo: {
              email: config.replyTo,
            },
          }
        : {}),
      ...(payload.tags?.length ? { tags: payload.tags } : {}),
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          accept: 'application/json',
          'content-type': 'application/json',
          'api-key': config.apiKey,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorBody = await this.safeParseJson<BrevoApiErrorBody>(response);
        const providerCode = errorBody?.code ?? `http_${response.status}`;
        // Do not log API keys or full email payloads
        logger.error(
          {
            event: 'email.send.failure',
            context: 'EMAIL',
            status: response.status,
            providerCode,
          },
          'Brevo email submission failed',
        );
        return {
          submitted: false,
          errorCode: providerCode,
          errorMessage: 'Email provider rejected the request',
        };
      }

      const data = await this.safeParseJson<BrevoApiSuccessResponse>(response);
      return {
        submitted: true,
        providerMessageId: data?.messageId,
      };
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        logger.error(
          { event: 'email.send.failure', context: 'EMAIL', reason: 'timeout' },
          'Brevo email request timed out',
        );
        return {
          submitted: false,
          errorCode: 'timeout',
          errorMessage: 'Email provider request timed out',
        };
      }

      logger.error(
        {
          event: 'email.send.failure',
          context: 'EMAIL',
          reason: 'network_error',
          errorName: error instanceof Error ? error.name : 'UnknownError',
        },
        'Brevo email request failed',
      );
      return {
        submitted: false,
        errorCode: 'network_error',
        errorMessage: 'Email provider request failed',
      };
    } finally {
      clearTimeout(timeout);
    }
  }

  /**
   * Optional helper when a caller prefers an exception over a result object.
   */
  async sendOrThrow(payload: BrevoSendPayload): Promise<EmailSendResult> {
    const result = await this.sendTransactionalEmail(payload);
    if (!result.submitted) {
      throw new EmailProviderError(
        result.errorMessage ?? 'Failed to submit email to provider',
        result.errorCode,
      );
    }
    return result;
  }

  private async safeParseJson<T>(response: Response): Promise<T | undefined> {
    try {
      return (await response.json()) as T;
    } catch {
      return undefined;
    }
  }
}

export const brevoEmailClient = new BrevoEmailClient();
