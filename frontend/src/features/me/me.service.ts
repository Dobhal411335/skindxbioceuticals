import { apiClient } from "@/services/api/axios";
import { API_ENDPOINTS } from "@/services/api/endpoints";
import type {
  Address,
  AddressInput,
  ProfileUpdateInput,
  ProfileUpdateResult,
} from "@/features/me/me.types";

type Envelope<T> = {
  success: boolean;
  message?: string;
  data: T;
};

export const meService = {
  async updateProfile(payload: ProfileUpdateInput): Promise<ProfileUpdateResult> {
    const response = await apiClient.patch<Envelope<ProfileUpdateResult>>(
      API_ENDPOINTS.ME.ROOT,
      payload,
    );
    return response.data.data;
  },

  async listAddresses(): Promise<Address[]> {
    const response = await apiClient.get<Envelope<{ addresses: Address[] }>>(
      API_ENDPOINTS.ME.ADDRESSES,
    );
    return response.data.data.addresses;
  },

  async createAddress(payload: AddressInput): Promise<Address> {
    const response = await apiClient.post<Envelope<{ address: Address }>>(
      API_ENDPOINTS.ME.ADDRESSES,
      payload,
    );
    return response.data.data.address;
  },

  async updateAddress(id: string, payload: Partial<AddressInput>): Promise<Address> {
    const response = await apiClient.patch<Envelope<{ address: Address }>>(
      API_ENDPOINTS.ME.ADDRESS(id),
      payload,
    );
    return response.data.data.address;
  },

  async deleteAddress(id: string): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.ME.ADDRESS(id));
  },
};
