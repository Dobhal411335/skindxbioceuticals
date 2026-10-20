import { EMAIL_TAGS } from './email.constants';
import { brevoEmailClient, type BrevoEmailClient } from './email.client';
import { EmailValidationError } from './email.errors';
import { validateRecipient, validateSiteCode } from './email.validation';
import type {
  EmailSendResult,
  EnquiryConfirmationEmailInput,
  OrderCancelledEmailInput,
  OrderConfirmationEmailInput,
  OrderDeliveredEmailInput,
  OrderShippedEmailInput,
  OrderStatusEmailInput,
  OtpEmailInput,
  PasswordChangedEmailInput,
  PasswordResetEmailInput,
  PaymentFailedEmailInput,
  PaymentSuccessEmailInput,
  RefundStatusEmailInput,
  RenderedEmail,
  VendorApprovedEmailInput,
  VerificationEmailInput,
  WelcomeEmailInput,
  DoctorAppointmentRequestedEmailInput,
  DoctorAppointmentConfirmedEmailInput,
  DoctorAppointmentCancelledEmailInput,
} from './email.types';
import {
  renderDoctorAppointmentCancelledEmail,
  renderDoctorAppointmentConfirmedEmail,
  renderDoctorAppointmentRequestedEmail,
  renderEmailVerificationEmail,
  renderEnquiryConfirmationEmail,
  renderOrderCancelledEmail,
  renderOrderConfirmationEmail,
  renderOrderDeliveredEmail,
  renderOrderShippedEmail,
  renderOrderStatusEmail,
  renderOtpEmail,
  renderPasswordChangedEmail,
  renderPasswordResetEmail,
  renderPaymentFailedEmail,
  renderPaymentSuccessEmail,
  renderRefundStatusEmail,
  renderVendorApprovedEmail,
  renderWelcomeEmail,
} from './templates';

/**
 * Centralized transactional email service.
 *
 * Provider submission failures return an EmailSendResult with submitted=false
 * so callers can avoid rolling back completed business operations (orders/payments).
 * For reliable retries, prefer an outbox/queue rather than fire-and-forget.
 */
export class EmailService {
  constructor(private readonly client: BrevoEmailClient = brevoEmailClient) {}

  async sendOtpEmail(input: OtpEmailInput): Promise<EmailSendResult> {
    const to = validateRecipient(input.to);
    const siteCode = validateSiteCode(input.siteCode);
    const rendered = renderOtpEmail({ ...input, siteCode });
    return this.submit(to, rendered, EMAIL_TAGS.OTP);
  }

  async sendWelcomeEmail(input: WelcomeEmailInput): Promise<EmailSendResult> {
    const to = validateRecipient(input.to);
    const siteCode = validateSiteCode(input.siteCode);
    const rendered = renderWelcomeEmail({ ...input, siteCode });
    return this.submit(to, rendered, EMAIL_TAGS.WELCOME);
  }

  async sendVerificationEmail(input: VerificationEmailInput): Promise<EmailSendResult> {
    const to = validateRecipient(input.to);
    const siteCode = validateSiteCode(input.siteCode);
    const rendered = renderEmailVerificationEmail({ ...input, siteCode });
    return this.submit(to, rendered, EMAIL_TAGS.VERIFICATION);
  }

  async sendPasswordResetEmail(input: PasswordResetEmailInput): Promise<EmailSendResult> {
    const to = validateRecipient(input.to);
    const siteCode = validateSiteCode(input.siteCode);
    const rendered = renderPasswordResetEmail({ ...input, siteCode });
    return this.submit(to, rendered, EMAIL_TAGS.PASSWORD_RESET);
  }

  async sendPasswordChangedEmail(input: PasswordChangedEmailInput): Promise<EmailSendResult> {
    const to = validateRecipient(input.to);
    const siteCode = validateSiteCode(input.siteCode);
    const rendered = renderPasswordChangedEmail({ ...input, siteCode });
    return this.submit(to, rendered, EMAIL_TAGS.PASSWORD_CHANGED);
  }

  async sendOrderConfirmationEmail(
    input: OrderConfirmationEmailInput,
  ): Promise<EmailSendResult> {
    const to = validateRecipient(input.to);
    const siteCode = validateSiteCode(input.siteCode);
    const rendered = renderOrderConfirmationEmail({ ...input, siteCode });
    return this.submit(to, rendered, EMAIL_TAGS.ORDER_CONFIRMATION);
  }

  async sendPaymentSuccessEmail(input: PaymentSuccessEmailInput): Promise<EmailSendResult> {
    const to = validateRecipient(input.to);
    const siteCode = validateSiteCode(input.siteCode);
    const rendered = renderPaymentSuccessEmail({ ...input, siteCode });
    return this.submit(to, rendered, EMAIL_TAGS.PAYMENT_SUCCESS);
  }

  async sendPaymentFailedEmail(input: PaymentFailedEmailInput): Promise<EmailSendResult> {
    const to = validateRecipient(input.to);
    const siteCode = validateSiteCode(input.siteCode);
    const rendered = renderPaymentFailedEmail({ ...input, siteCode });
    return this.submit(to, rendered, EMAIL_TAGS.PAYMENT_FAILED);
  }

  async sendOrderStatusEmail(input: OrderStatusEmailInput): Promise<EmailSendResult> {
    const to = validateRecipient(input.to);
    const siteCode = validateSiteCode(input.siteCode);
    const rendered = renderOrderStatusEmail({ ...input, siteCode });
    return this.submit(to, rendered, EMAIL_TAGS.ORDER_STATUS);
  }

  async sendOrderShippedEmail(input: OrderShippedEmailInput): Promise<EmailSendResult> {
    const to = validateRecipient(input.to);
    const siteCode = validateSiteCode(input.siteCode);
    const rendered = renderOrderShippedEmail({ ...input, siteCode });
    return this.submit(to, rendered, EMAIL_TAGS.ORDER_SHIPPED);
  }

  async sendOrderDeliveredEmail(input: OrderDeliveredEmailInput): Promise<EmailSendResult> {
    const to = validateRecipient(input.to);
    const siteCode = validateSiteCode(input.siteCode);
    const rendered = renderOrderDeliveredEmail({ ...input, siteCode });
    return this.submit(to, rendered, EMAIL_TAGS.ORDER_DELIVERED);
  }

  async sendOrderCancelledEmail(input: OrderCancelledEmailInput): Promise<EmailSendResult> {
    const to = validateRecipient(input.to);
    const siteCode = validateSiteCode(input.siteCode);
    const rendered = renderOrderCancelledEmail({ ...input, siteCode });
    return this.submit(to, rendered, EMAIL_TAGS.ORDER_CANCELLED);
  }

  async sendRefundStatusEmail(input: RefundStatusEmailInput): Promise<EmailSendResult> {
    const to = validateRecipient(input.to);
    const siteCode = validateSiteCode(input.siteCode);
    const rendered = renderRefundStatusEmail({ ...input, siteCode });
    return this.submit(to, rendered, EMAIL_TAGS.REFUND_STATUS);
  }

  async sendEnquiryConfirmationEmail(
    input: EnquiryConfirmationEmailInput,
  ): Promise<EmailSendResult> {
    const to = validateRecipient(input.to);
    const siteCode = validateSiteCode(input.siteCode);
    const rendered = renderEnquiryConfirmationEmail({ ...input, siteCode });
    return this.submit(to, rendered, EMAIL_TAGS.ENQUIRY_CONFIRMATION);
  }

  async sendVendorApprovedEmail(input: VendorApprovedEmailInput): Promise<EmailSendResult> {
    const to = validateRecipient(input.to);
    const siteCode = validateSiteCode(input.siteCode);
    const rendered = renderVendorApprovedEmail({ ...input, siteCode });
    return this.submit(to, rendered, EMAIL_TAGS.VENDOR_APPROVED);
  }

  async sendDoctorAppointmentRequestedEmail(
    input: DoctorAppointmentRequestedEmailInput,
  ): Promise<EmailSendResult> {
    const to = validateRecipient(input.to);
    const siteCode = validateSiteCode(input.siteCode);
    const rendered = renderDoctorAppointmentRequestedEmail({ ...input, siteCode });
    return this.submit(to, rendered, EMAIL_TAGS.DOCTOR_APPOINTMENT_REQUESTED);
  }

  async sendDoctorAppointmentConfirmedEmail(
    input: DoctorAppointmentConfirmedEmailInput,
  ): Promise<EmailSendResult> {
    const to = validateRecipient(input.to);
    const siteCode = validateSiteCode(input.siteCode);
    const rendered = renderDoctorAppointmentConfirmedEmail({ ...input, siteCode });
    return this.submit(to, rendered, EMAIL_TAGS.DOCTOR_APPOINTMENT_CONFIRMED);
  }

  async sendDoctorAppointmentCancelledEmail(
    input: DoctorAppointmentCancelledEmailInput,
  ): Promise<EmailSendResult> {
    const to = validateRecipient(input.to);
    const siteCode = validateSiteCode(input.siteCode);
    const rendered = renderDoctorAppointmentCancelledEmail({ ...input, siteCode });
    return this.submit(to, rendered, EMAIL_TAGS.DOCTOR_APPOINTMENT_CANCELLED);
  }

  private async submit(
    to: { email: string; name?: string },
    rendered: RenderedEmail,
    tag: string,
  ): Promise<EmailSendResult> {
    if (!rendered.subject || !rendered.html || !rendered.text) {
      throw new EmailValidationError('Rendered email is incomplete');
    }

    return this.client.sendTransactionalEmail({
      to: [to],
      subject: rendered.subject,
      htmlContent: rendered.html,
      textContent: rendered.text,
      tags: [tag],
    });
  }
}

export const emailService = new EmailService();
