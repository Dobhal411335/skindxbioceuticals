import { apiClient } from "@/services/api/axios";

export interface NewsletterSubscribeResult {
  success: boolean;
  message: string;
  data?: {
    id: string;
    email: string;
  };
}

export async function subscribeNewsletter(
  email: string,
  siteCode = "IN",
): Promise<NewsletterSubscribeResult> {
  const { data } = await apiClient.post<NewsletterSubscribeResult>(
    `/sites/${siteCode}/newsletter/subscribe`,
    { email },
  );
  return data;
}

export async function unsubscribeNewsletter(
  token: string,
): Promise<{ success: boolean; message: string; data?: { email: string } }> {
  try {
    const { data } = await apiClient.post<{
      success: boolean;
      message: string;
      data?: { email: string };
    }>(
      `/newsletter/unsubscribe`,
      { token },
      {
        params: { token },
        headers: { Accept: "application/json" },
      },
    );
    return data;
  } catch {
    const { data } = await apiClient.get<{
      success: boolean;
      message: string;
      data?: { email: string };
    }>(`/newsletter/unsubscribe`, {
      params: { token },
      headers: { Accept: "application/json" },
    });
    return data;
  }
}
