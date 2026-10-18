import type { SiteCode } from '@/types/common';

export type { SiteCode };

export interface EmailRecipient {
  email: string;
  name?: string;
}

export interface RenderedEmail {
  subject: string;
  html: string;
  text: string;
}

/**
 * Result of submitting a message to Brevo.
 * `submitted` means the provider accepted the request — not that the inbox received it.
 */
export interface EmailSendResult {
  submitted: boolean;
  providerMessageId?: string;
  errorCode?: string;
  errorMessage?: string;
}

export interface EmailBrand {
  siteCode: SiteCode;
  companyName: string;
  siteName: string;
  siteUrl: string;
  supportEmail: string;
  logoUrl?: string;
  privacyPolicyUrl?: string;
  copyrightText: string;
}

export interface EmailLayoutOptions {
  brand: EmailBrand;
  title: string;
  contentHtml: string;
  contentText: string;
  preheader?: string;
  includeUnsubscribe?: boolean;
}

export interface OrderLineItemEmailData {
  name: string;
  quantity: number;
  unitPrice: string;
  lineTotal: string;
}

export interface MoneyBreakdownEmailData {
  subtotal?: string;
  discount?: string;
  shipping?: string;
  tax?: string;
  cgst?: string;
  sgst?: string;
  total: string;
  currency: string;
}

export interface ShippingAddressEmailData {
  name?: string;
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  postalCode?: string;
  country: string;
}

export interface OtpEmailInput {
  to: EmailRecipient;
  siteCode: SiteCode;
  otpCode: string;
  purpose: string;
  expiresInMinutes: number;
  displayName?: string;
}

export interface WelcomeEmailInput {
  to: EmailRecipient;
  siteCode: SiteCode;
  displayName?: string;
}

export interface VerificationEmailInput {
  to: EmailRecipient;
  siteCode: SiteCode;
  verificationUrl: string;
  expiresInMinutes: number;
}

export interface PasswordResetEmailInput {
  to: EmailRecipient;
  siteCode: SiteCode;
  resetUrl: string;
  expiresInMinutes: number;
}

export interface PasswordChangedEmailInput {
  to: EmailRecipient;
  siteCode: SiteCode;
  displayName?: string;
}

export interface OrderConfirmationEmailInput {
  to: EmailRecipient;
  siteCode: SiteCode;
  orderReference: string;
  items: OrderLineItemEmailData[];
  breakdown: MoneyBreakdownEmailData;
  shippingAddress?: ShippingAddressEmailData;
  orderDetailsUrl: string;
}

export interface PaymentSuccessEmailInput {
  to: EmailRecipient;
  siteCode: SiteCode;
  orderReference: string;
  amount: string;
  currency: string;
  paymentReference?: string;
  orderDetailsUrl?: string;
}

export interface PaymentFailedEmailInput {
  to: EmailRecipient;
  siteCode: SiteCode;
  orderReference: string;
  safeFailureMessage: string;
  retryUrl?: string;
}

export interface OrderStatusEmailInput {
  to: EmailRecipient;
  siteCode: SiteCode;
  orderReference: string;
  statusLabel: string;
  orderDetailsUrl: string;
}

export interface OrderShippedEmailInput {
  to: EmailRecipient;
  siteCode: SiteCode;
  orderReference: string;
  carrier?: string;
  trackingReference?: string;
  trackingUrl?: string;
  orderDetailsUrl: string;
}

export interface OrderDeliveredEmailInput {
  to: EmailRecipient;
  siteCode: SiteCode;
  orderReference: string;
  orderDetailsUrl: string;
}

export interface OrderCancelledEmailInput {
  to: EmailRecipient;
  siteCode: SiteCode;
  orderReference: string;
  refundConfirmed?: boolean;
  refundSummary?: string;
  orderDetailsUrl?: string;
}

export interface RefundStatusEmailInput {
  to: EmailRecipient;
  siteCode: SiteCode;
  orderReference: string;
  refundAmount: string;
  currency: string;
  statusLabel: string;
  expectedTimeline?: string;
}

export interface EnquiryConfirmationEmailInput {
  to: EmailRecipient;
  siteCode: SiteCode;
  enquiryReference?: string;
  expectedResponseTime?: string;
}

export interface VendorApprovedEmailInput {
  to: EmailRecipient;
  siteCode: SiteCode;
  contactPerson: string;
  username: string;
  password: string;
}

export interface BrevoSendPayload {
  to: EmailRecipient[];
  subject: string;
  htmlContent: string;
  textContent: string;
  tags?: string[];
}

export interface BrevoApiSuccessResponse {
  messageId?: string;
}

export interface BrevoApiErrorBody {
  message?: string;
  code?: string;
}
