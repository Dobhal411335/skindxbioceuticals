import type { Address } from '@prisma/client';
import { authService } from '@/features/auth/auth.service';
import { ForbiddenError, NotFoundError, UnauthorizedError } from '@/utils/AppError';
import { meRepository } from './me.repository';
import type { AddressDto, MeProfileUpdateDto } from './me.types';
import type {
  AddressBodyInput,
  UpdateAddressInput,
  UpdateProfileInput,
} from './me.validation';

/**
 * Me service — customer self-service profile and addresses.
 * Identity always comes from the authenticated session userId.
 */
export class MeService {
  constructor(private readonly repository = meRepository) {}

  async updateProfile(userId: string, input: UpdateProfileInput): Promise<MeProfileUpdateDto> {
    const user = await this.requireActiveCustomer(userId);
    const updated = await this.repository.updateProfile(user.id, {
      firstName: input.firstName,
      lastName: input.lastName,
    });
    return { user: authService.toUserDto(updated) };
  }

  async listAddresses(userId: string): Promise<AddressDto[]> {
    await this.requireActiveCustomer(userId);
    const addresses = await this.repository.listAddresses(userId);
    return addresses.map((address) => this.toAddressDto(address));
  }

  async createAddress(userId: string, input: AddressBodyInput): Promise<AddressDto> {
    await this.requireActiveCustomer(userId);
    const address = await this.repository.createAddress(userId, {
      label: input.label,
      line1: input.line1,
      line2: input.line2,
      city: input.city,
      state: input.state,
      postalCode: input.postalCode,
      country: input.country,
      isDefault: input.isDefault,
    });
    return this.toAddressDto(address);
  }

  async updateAddress(
    userId: string,
    addressId: string,
    input: UpdateAddressInput,
  ): Promise<AddressDto> {
    await this.requireActiveCustomer(userId);
    const updated = await this.repository.updateAddress(userId, addressId, {
      ...(input.label !== undefined ? { label: input.label } : {}),
      ...(input.line1 !== undefined ? { line1: input.line1 } : {}),
      ...(input.line2 !== undefined ? { line2: input.line2 } : {}),
      ...(input.city !== undefined ? { city: input.city } : {}),
      ...(input.state !== undefined ? { state: input.state } : {}),
      ...(input.postalCode !== undefined ? { postalCode: input.postalCode } : {}),
      ...(input.country !== undefined ? { country: input.country } : {}),
      ...(input.isDefault !== undefined ? { isDefault: input.isDefault } : {}),
    });

    if (!updated) {
      throw new NotFoundError('Address not found');
    }

    return this.toAddressDto(updated);
  }

  async deleteAddress(userId: string, addressId: string): Promise<void> {
    await this.requireActiveCustomer(userId);
    const deleted = await this.repository.deleteAddress(userId, addressId);
    if (!deleted) {
      throw new NotFoundError('Address not found');
    }
  }

  private async requireActiveCustomer(userId: string) {
    const user = await this.repository.findCustomerById(userId);
    if (!user) {
      throw new UnauthorizedError();
    }
    if (user.role !== 'CUSTOMER') {
      throw new ForbiddenError('Insufficient permissions');
    }
    if (user.status !== 'ACTIVE') {
      throw new ForbiddenError('Account is not active');
    }
    return user;
  }

  private toAddressDto(address: Address): AddressDto {
    return {
      id: address.id,
      label: address.label,
      line1: address.line1,
      line2: address.line2,
      city: address.city,
      state: address.state,
      postalCode: address.postalCode,
      country: address.country,
      isDefault: address.isDefault,
      createdAt: address.createdAt.toISOString(),
      updatedAt: address.updatedAt.toISOString(),
    };
  }
}

export const meService = new MeService();
