import { env } from '@/config/env';
import {
  BREVO_API_BASE_URL,
  BREVO_REQUEST_TIMEOUT_MS,
  BREVO_SEND_EMAIL_PATH,
} from './email.constants';

export interface BrevoEmailConfig {
  apiKey: string;
  senderEmail: string;
  senderName: string;
  replyTo?: string;
  apiBaseUrl: string;
  sendEmailPath: string;
  requestTimeoutMs: number;
}

/**
 * Centralized Brevo provider configuration sourced from validated env.
 * Never log the API key.
 */
export function getBrevoEmailConfig(): BrevoEmailConfig {
  return {
    apiKey: env.BREVO_API_KEY,
    senderEmail: env.BREVO_SENDER_EMAIL,
    senderName: env.BREVO_SENDER_NAME,
    replyTo: env.BREVO_REPLY_TO,
    apiBaseUrl: BREVO_API_BASE_URL,
    sendEmailPath: BREVO_SEND_EMAIL_PATH,
    requestTimeoutMs: BREVO_REQUEST_TIMEOUT_MS,
  };
}
