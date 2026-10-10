import { apiClient } from "@/services/api/axios";
import { API_ENDPOINTS } from "@/services/api/endpoints";
import { tokenStore } from "@/services/api/token-store";
import type {
  AuthUser,
  RegisterPayload,
  RegisterPendingResult,
  ResendVerificationPayload,
  SessionAuthResult,
  VerifyEmailPayload,
} from "@/types/auth";

type Envelope<T> = {
  success: boolean;
  message?: string;
  data: T;
};

/**
 * Storefront authentication API callers.
 * Access token is kept in memory; refresh uses the HttpOnly cookie.
 */
export const authService = {
  async register(payload: RegisterPayload): Promise<RegisterPendingResult> {
    const response = await apiClient.post<Envelope<RegisterPendingResult>>(
      API_ENDPOINTS.AUTH.REGISTER,
      payload,
    );
    return response.data.data;
  },

  async verifyEmail(payload: VerifyEmailPayload): Promise<SessionAuthResult> {
    const response = await apiClient.post<Envelope<SessionAuthResult>>(
      API_ENDPOINTS.AUTH.VERIFY_EMAIL,
      payload,
    );
    const data = response.data.data;
    tokenStore.setAccessToken(data.accessToken);
    return data;
  },

  async resendVerification(payload: ResendVerificationPayload): Promise<void> {
    await apiClient.post(API_ENDPOINTS.AUTH.RESEND_VERIFICATION, payload);
  },

  async login(credentials: { email: string; password: string }): Promise<SessionAuthResult> {
    const response = await apiClient.post<Envelope<SessionAuthResult>>(
      API_ENDPOINTS.AUTH.LOGIN,
      credentials,
    );
    const data = response.data.data;
    tokenStore.setAccessToken(data.accessToken);
    return data;
  },

  async signInWithGoogle(credential: string): Promise<SessionAuthResult> {
    const response = await apiClient.post<Envelope<SessionAuthResult>>(
      API_ENDPOINTS.AUTH.GOOGLE,
      { credential },
    );

    const data = response.data.data;
    tokenStore.setAccessToken(data.accessToken);
    return data;
  },

  async refreshSession(): Promise<SessionAuthResult | null> {
    try {
      const response = await apiClient.post<Envelope<SessionAuthResult>>(
        API_ENDPOINTS.AUTH.REFRESH,
        {},
      );
      const data = response.data.data;
      if (!data?.accessToken || !data.user) {
        return null;
      }
      tokenStore.setAccessToken(data.accessToken);
      return data;
    } catch {
      tokenStore.clear();
      return null;
    }
  },

  async me(): Promise<{ user: AuthUser }> {
    const response = await apiClient.get<Envelope<{ user: AuthUser }>>(
      API_ENDPOINTS.AUTH.ME,
    );
    return response.data.data;
  },

  async logout(): Promise<{ serverRevoked: boolean }> {
    try {
      await apiClient.post(API_ENDPOINTS.AUTH.LOGOUT, {});
      return { serverRevoked: true };
    } catch {
      return { serverRevoked: false };
    } finally {
      tokenStore.clear();
    }
  },

  async changePassword(payload: {
    currentPassword?: string;
    newPassword: string;
    confirmPassword: string;
  }): Promise<SessionAuthResult> {
    const response = await apiClient.patch<Envelope<SessionAuthResult>>(
      API_ENDPOINTS.AUTH.PASSWORD,
      payload,
    );
    const data = response.data.data;
    tokenStore.setAccessToken(data.accessToken);
    return data;
  },
};
