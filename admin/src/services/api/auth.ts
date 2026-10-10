import { apiClient } from "@/services/api/axios";
import { endpoints } from "@/services/api/endpoints";
import type { AuthMe, AuthSite, AuthTokens } from "@/types/auth";

interface ApiSuccess<T> {
  success: true;
  message: string;
  data: T;
}

export async function adminLogin(email: string, password: string): Promise<AuthTokens> {
  const { data } = await apiClient.post<ApiSuccess<AuthTokens>>(endpoints.auth.adminLogin, {
    email,
    password,
  });
  return data.data;
}

export async function fetchMe(): Promise<AuthMe> {
  const { data } = await apiClient.get<ApiSuccess<AuthMe>>(endpoints.auth.me);
  return data.data;
}

export async function logout(refreshToken?: string | null): Promise<void> {
  await apiClient.post(endpoints.auth.logout, { refreshToken: refreshToken ?? undefined });
}

export async function fetchAuthorizedSites(): Promise<AuthSite[]> {
  const { data } = await apiClient.get<ApiSuccess<AuthSite[]>>(endpoints.admin.sites);
  return data.data;
}
