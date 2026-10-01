/**
 * Auth feature types.
 * Domain DTOs and response shapes for customer and admin auth.
 */

import type { UserRole, TokenPair } from '@/types/common';

export interface AuthUserDto {
  id: string;
  email: string;
  role: UserRole;
  firstName?: string | null;
  lastName?: string | null;
}

export interface AuthTokensDto extends TokenPair {
  user: AuthUserDto;
}
