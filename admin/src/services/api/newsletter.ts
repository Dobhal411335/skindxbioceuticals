import { apiClient } from "@/services/api/axios";
import { endpoints } from "@/services/api/endpoints";
import type { SiteCode } from "@/types/auth";

export interface NewsletterSubscriber {
  id: string;
  email: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SendPromotionalEmailPayload {
  recipients: string[];
  subject: string;
  messageHtml: string;
}

export interface SendPromotionalEmailResponse {
  sentCount: number;
  failedCount: number;
  totalRecipients: number;
}

interface ApiSuccess<T> {
  success: true;
  message: string;
  data: T;
}

export async function fetchNewsletterSubscribers(
  siteCode: SiteCode,
): Promise<NewsletterSubscriber[]> {
  const { data } = await apiClient.get<ApiSuccess<NewsletterSubscriber[]>>(
    endpoints.admin.newsletterSubscribers(siteCode),
  );
  return data.data;
}

export async function sendPromotionalEmail(
  siteCode: SiteCode,
  payload: SendPromotionalEmailPayload,
): Promise<SendPromotionalEmailResponse> {
  const { data } = await apiClient.post<ApiSuccess<SendPromotionalEmailResponse>>(
    endpoints.admin.newsletterSend(siteCode),
    payload,
  );
  return data.data;
}
