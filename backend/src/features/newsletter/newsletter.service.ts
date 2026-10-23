import { env } from '@/config/env';
import { emailService } from '@/lib/email';
import { logger } from '@/lib/logger';
import { NotFoundError, ValidationError } from '@/utils/AppError';
import { newsletterRepository } from './newsletter.repository';
import type {
  NewsletterSubscriberDto,
  SendPromotionalEmailBody,
  SendPromotionalEmailResultDto,
} from './newsletter.types';

export class NewsletterService {
  constructor(private readonly repository = newsletterRepository) {}

  async subscribe(siteCode: 'IN' | 'COM', email: string): Promise<NewsletterSubscriberDto> {
    const site = await this.repository.findSiteByCode(siteCode);
    if (!site) {
      throw new NotFoundError(`Site "${siteCode}" not found`);
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check if this is a first-time subscriber or reactivating
    const existing = await this.repository.findSubscriber(site.id, normalizedEmail);
    const isFirstTime = !existing || !existing.isActive;

    const row = await this.repository.upsertSubscriber(site.id, normalizedEmail);

    logger.info(
      { event: 'newsletter.subscribed', siteCode, email: row.email, isFirstTime },
      'User subscribed to newsletter',
    );

    // Send welcome email with category links and greeting whenever a user subscribes
    const baseUrl = siteCode === 'COM' ? env.SITE_COM_URL : env.SITE_IN_URL;
    const unsubscribeUrl = `${baseUrl}/unsubscribe?token=${encodeURIComponent(row.unsubscribeToken)}`;

    try {
      const sendResult = await emailService.sendNewsletterWelcomeEmail({
        to: { email: normalizedEmail },
        siteCode,
        unsubscribeUrl,
      });

      if (sendResult.submitted) {
        logger.info(
          {
            event: 'newsletter.welcome_email_sent',
            siteCode,
            email: normalizedEmail,
            messageId: sendResult.providerMessageId,
          },
          'Welcome email sent to newsletter subscriber',
        );
      } else {
        logger.warn(
          {
            event: 'newsletter.welcome_email_provider_rejected',
            siteCode,
            email: normalizedEmail,
            code: sendResult.errorCode,
            error: sendResult.errorMessage,
          },
          'Brevo email provider rejected welcome email submission',
        );
      }
    } catch (emailErr) {
      logger.error(
        {
          err: emailErr instanceof Error ? { message: emailErr.message, stack: emailErr.stack } : emailErr,
          event: 'newsletter.welcome_email_failed',
          siteCode,
          email: normalizedEmail,
        },
        'Exception dispatching newsletter welcome email',
      );
    }

    return {
      id: row.id,
      email: row.email,
      isActive: row.isActive,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  async unsubscribe(token: string): Promise<{ success: boolean; email: string }> {
    const subscriber = await this.repository.findByToken(token);
    if (!subscriber) {
      throw new NotFoundError('Invalid or expired unsubscribe link');
    }

    await this.repository.unsubscribeByToken(token);

    logger.info(
      { event: 'newsletter.unsubscribed', email: subscriber.email },
      'User unsubscribed from newsletter',
    );

    return { success: true, email: subscriber.email };
  }

  async listSubscribers(siteCode: 'IN' | 'COM'): Promise<NewsletterSubscriberDto[]> {
    const site = await this.repository.findSiteByCode(siteCode);
    if (!site) {
      throw new NotFoundError(`Site "${siteCode}" not found`);
    }

    // Return only active subscribers (unsubscribed users excluded)
    const rows = await this.repository.listSubscribers(site.id, true);
    return rows.map((r) => ({
      id: r.id,
      email: r.email,
      isActive: r.isActive,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    }));
  }

  async sendPromotionalEmail(
    siteCode: 'IN' | 'COM',
    input: SendPromotionalEmailBody,
  ): Promise<SendPromotionalEmailResultDto> {
    const site = await this.repository.findSiteByCode(siteCode);
    if (!site) {
      throw new NotFoundError(`Site "${siteCode}" not found`);
    }

    const recipients = Array.from(new Set(input.recipients.map((e) => e.trim().toLowerCase())));
    if (recipients.length === 0) {
      throw new ValidationError('At least one recipient must be specified');
    }

    // Retrieve active subscribers to match their unsubscribe tokens
    const subscriberRows = await this.repository.findSubscribersByEmails(site.id, recipients);
    const tokenMap = new Map<string, string>();
    for (const sub of subscriberRows) {
      tokenMap.set(sub.email.toLowerCase(), sub.unsubscribeToken);
    }

    const baseUrl = siteCode === 'COM' ? env.SITE_COM_URL : env.SITE_IN_URL;

    let sentCount = 0;
    let failedCount = 0;

    for (const recipientEmail of recipients) {
      const token = tokenMap.get(recipientEmail);
      const unsubscribeUrl = token
        ? `${baseUrl}/unsubscribe?token=${encodeURIComponent(token)}`
        : `${baseUrl}/unsubscribe`;

      try {
        const result = await emailService.sendPromotionalEmail({
          to: recipientEmail,
          siteCode,
          subject: input.subject,
          htmlContent: input.messageHtml,
          unsubscribeUrl,
        });

        if (result.submitted) {
          sentCount++;
        } else {
          failedCount++;
          logger.warn(
            { event: 'promotional_email.send_failed', email: recipientEmail, error: result.errorMessage },
            'Failed to deliver promotional email to recipient',
          );
        }
      } catch (err) {
        failedCount++;
        logger.error(
          { event: 'promotional_email.exception', email: recipientEmail, err },
          'Exception delivering promotional email',
        );
      }
    }

    logger.info(
      {
        event: 'promotional_email.batch_completed',
        siteCode,
        totalRecipients: recipients.length,
        sentCount,
        failedCount,
      },
      'Promotional email batch completed',
    );

    return {
      sentCount,
      failedCount,
      totalRecipients: recipients.length,
    };
  }
}

export const newsletterService = new NewsletterService();
