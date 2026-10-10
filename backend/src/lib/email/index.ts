export { emailService, EmailService } from './email.service';
export { brevoEmailClient, BrevoEmailClient } from './email.client';
export { getBrevoEmailConfig } from './email.config';
export { getEmailBrand } from './company/company.config';
export { EmailProviderError, EmailValidationError } from './email.errors';
export {
  escapeHtml,
  assertSafeActionUrl,
  assertHttpUrl,
  validateRecipient,
  validateSiteCode,
} from './email.validation';
export type {
  EmailBrand,
  EmailRecipient,
  EmailSendResult,
  RenderedEmail,
  OtpEmailInput,
  WelcomeEmailInput,
  VerificationEmailInput,
  PasswordResetEmailInput,
  PasswordChangedEmailInput,
  OrderConfirmationEmailInput,
  PaymentSuccessEmailInput,
  PaymentFailedEmailInput,
  OrderStatusEmailInput,
  OrderShippedEmailInput,
  OrderDeliveredEmailInput,
  OrderCancelledEmailInput,
  RefundStatusEmailInput,
  EnquiryConfirmationEmailInput,
} from './email.types';
export * from './templates';
