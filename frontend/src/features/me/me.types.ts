import type { AuthUser } from "@/types/auth";

export type Address = {
  id: string;
  label: string | null;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
};

export type AddressInput = {
  label?: string | null;
  line1: string;
  line2?: string | null;
  city: string;
  state: string;
  postalCode: string;
  country?: string;
  isDefault?: boolean;
};

export type ProfileUpdateInput = {
  firstName: string;
  lastName?: string | null;
};

export type ProfileUpdateResult = {
  user: AuthUser;
};
