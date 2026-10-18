import type { Address } from '@prisma/client';
import { authService } from '@/features/auth/auth.service';
import {
  CloudinaryError,
  uploadSingleImage,
} from '@/lib/cloudinary';
import { logger } from '@/lib/logger';
import {
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from '@/utils/AppError';
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
    const user = await this.requireActiveStorefrontUser(userId);
    const updated = await this.repository.updateProfile(user.id, {
      firstName: input.firstName,
      lastName: input.lastName,
    });
    return { user: authService.toUserDto(updated) };
  }

  async uploadAvatar(
    userId: string,
    file: Express.Multer.File | undefined,
  ): Promise<MeProfileUpdateDto> {
    const user = await this.requireActiveStorefrontUser(userId);
    if (!file) {
      throw new ValidationError('No file uploaded');
    }

    let uploaded;
    try {
      uploaded = await uploadSingleImage(file, {
        siteCode: 'SHARED',
        feature: 'profile',
        entityId: user.id,
      });
    } catch (error) {
      logger.error(
        {
          event: 'me.avatar.upload.failure',
          context: 'ME',
          userId: user.id,
          errorName: error instanceof Error ? error.name : 'UnknownError',
        },
        'Customer avatar upload failed',
      );
      if (error instanceof CloudinaryError) {
        throw new ValidationError(error.message);
      }
      throw error;
    }

    const updated = await this.repository.updateImageUrl(user.id, uploaded.url);
    logger.info(
      { event: 'me.avatar.upload.success', context: 'ME', userId: user.id },
      'Customer avatar updated',
    );
    return { user: authService.toUserDto(updated) };
  }

  async clearAvatar(userId: string): Promise<MeProfileUpdateDto> {
    const user = await this.requireActiveStorefrontUser(userId);
    const updated = await this.repository.updateImageUrl(user.id, null);
    return { user: authService.toUserDto(updated) };
  }

  async listAddresses(userId: string): Promise<AddressDto[]> {
    await this.requireActiveStorefrontUser(userId);
    const addresses = await this.repository.listAddresses(userId);
    return addresses.map((address) => this.toAddressDto(address));
  }

  async createAddress(userId: string, input: AddressBodyInput): Promise<AddressDto> {
    await this.requireActiveStorefrontUser(userId);
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
    await this.requireActiveStorefrontUser(userId);
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
    await this.requireActiveStorefrontUser(userId);
    const deleted = await this.repository.deleteAddress(userId, addressId);
    if (!deleted) {
      throw new NotFoundError('Address not found');
    }
  }

  private async requireActiveStorefrontUser(userId: string) {
    const user = await this.repository.findCustomerById(userId);
    if (!user) {
      throw new UnauthorizedError();
    }
    if (user.role !== 'CUSTOMER' && user.role !== 'VENDOR') {
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
