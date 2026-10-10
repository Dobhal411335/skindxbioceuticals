import type { AuthUserDto } from '@/features/auth/auth.types';

export interface AddressDto {
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
}

export interface MeProfileUpdateDto {
  user: AuthUserDto;
}
