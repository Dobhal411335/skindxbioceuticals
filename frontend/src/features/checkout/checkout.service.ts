import { apiClient } from "@/services/api/axios";
import { API_ENDPOINTS } from "@/services/api/endpoints";
import type {
  CheckoutShippingAddress,
  CreatePaymentOrderResult,
  OrderConfirmationResult,
  PaymentStatusResult,
  VerifyPaymentResult,
} from "@/features/checkout/checkout.types";

type Envelope<T> = {
  success: boolean;
  message?: string;
  data: T;
};

export const checkoutService = {
  async startGuestSession(email: string): Promise<{
    sessionToken: string;
    email: string;
    expiresAt: string;
  }> {
    const response = await apiClient.post<
      Envelope<{ sessionToken: string; email: string; expiresAt: string }>
    >(API_ENDPOINTS.CHECKOUT.GUEST_SESSION, { email });
    return response.data.data;
  },

  async sendGuestOtp(
    sessionToken: string,
  ): Promise<{ accepted: true; resendAvailableAt?: string }> {
    const response = await apiClient.post<
      Envelope<{ accepted: true; resendAvailableAt?: string }>
    >(API_ENDPOINTS.CHECKOUT.GUEST_SEND_OTP, { sessionToken });
    return response.data.data;
  },

  async verifyGuestOtp(
    sessionToken: string,
    otp: string,
  ): Promise<{ email: string; emailVerified: true; verifiedAt: string }> {
    const response = await apiClient.post<
      Envelope<{ email: string; emailVerified: true; verifiedAt: string }>
    >(API_ENDPOINTS.CHECKOUT.GUEST_VERIFY_OTP, { sessionToken, otp });
    return response.data.data;
  },

  async createPaymentOrder(input: {
    items: Array<{ variantId: string; quantity: number }>;
    shippingAddress: CheckoutShippingAddress;
    notes?: string;
    guestSessionToken?: string;
    idempotencyKey: string;
  }): Promise<CreatePaymentOrderResult> {
    const response = await apiClient.post<Envelope<CreatePaymentOrderResult>>(
      API_ENDPOINTS.PAYMENTS.CREATE_ORDER,
      {
        items: input.items,
        shippingAddress: input.shippingAddress,
        notes: input.notes,
        guestSessionToken: input.guestSessionToken,
      },
      {
        headers: { "Idempotency-Key": input.idempotencyKey },
      },
    );
    return response.data.data;
  },

  async verifyPayment(input: {
    orderId: string;
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
    guestSessionToken?: string;
  }): Promise<VerifyPaymentResult> {
    const response = await apiClient.post<Envelope<VerifyPaymentResult>>(
      API_ENDPOINTS.PAYMENTS.VERIFY,
      input,
    );
    return response.data.data;
  },

  async getPaymentStatus(input: {
    orderId: string;
    guestSessionToken?: string;
  }): Promise<PaymentStatusResult> {
    const response = await apiClient.get<Envelope<PaymentStatusResult>>(
      API_ENDPOINTS.PAYMENTS.STATUS(input.orderId),
      {
        params: input.guestSessionToken
          ? { guestSessionToken: input.guestSessionToken }
          : undefined,
      },
    );
    return response.data.data;
  },

  async getConfirmation(input: {
    orderId?: string;
    confirmationToken?: string;
  }): Promise<OrderConfirmationResult> {
    const response = await apiClient.get<Envelope<OrderConfirmationResult>>(
      API_ENDPOINTS.PAYMENTS.CONFIRMATION,
      { params: input },
    );
    return response.data.data;
  },
};
