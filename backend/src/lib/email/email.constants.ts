export const BREVO_API_BASE_URL = 'https://api.brevo.com/v3';
export const BREVO_SEND_EMAIL_PATH = '/smtp/email';

/** Reasonable timeout for provider HTTP calls (ms). */
export const BREVO_REQUEST_TIMEOUT_MS = 15_000;

export const EMAIL_TAGS = {
  OTP: 'otp',
  WELCOME: 'welcome',
  VERIFICATION: 'email-verification',
  PASSWORD_RESET: 'password-reset',
  PASSWORD_CHANGED: 'password-changed',
  ORDER_CONFIRMATION: 'order-confirmation',
  PAYMENT_SUCCESS: 'payment-success',
  PAYMENT_FAILED: 'payment-failed',
  ORDER_STATUS: 'order-status',
  ORDER_SHIPPED: 'order-shipped',
  ORDER_DELIVERED: 'order-delivered',
  ORDER_CANCELLED: 'order-cancelled',
  REFUND_STATUS: 'refund-status',
  ENQUIRY_CONFIRMATION: 'enquiry-confirmation',
  VENDOR_APPROVED: 'vendor-approved',
  DOCTOR_APPOINTMENT_REQUESTED: 'doctor-appointment-requested',
  DOCTOR_APPOINTMENT_CONFIRMED: 'doctor-appointment-confirmed',
  DOCTOR_APPOINTMENT_CANCELLED: 'doctor-appointment-cancelled',
  PROMOTIONAL: 'promotional',
  NEWSLETTER: 'newsletter',
} as const;

export type EmailTag = (typeof EMAIL_TAGS)[keyof typeof EMAIL_TAGS];
