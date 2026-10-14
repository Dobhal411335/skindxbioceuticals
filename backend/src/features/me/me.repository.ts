import type { Address, Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { authRepository, type UserWithMemberships } from '@/features/auth/auth.repository';

/**
 * Me repository — customer profile and address data access.
 */
export class MeRepository {
  protected readonly db = prisma;

  async findCustomerById(userId: string): Promise<UserWithMemberships | null> {
    return authRepository.findById(userId);
  }

  async updateProfile(
    userId: string,
    input: { firstName: string; lastName?: string | null },
  ): Promise<UserWithMemberships> {
    return this.db.user.update({
      where: { id: userId },
      data: {
        firstName: input.firstName,
        lastName: input.lastName ?? null,
      },
      include: {
        siteMemberships: { include: { site: true } },
        externalIdentities: true,
      },
    });
  }

  async updateImageUrl(
    userId: string,
    imageUrl: string | null,
  ): Promise<UserWithMemberships> {
    return this.db.user.update({
      where: { id: userId },
      data: { imageUrl },
      include: {
        siteMemberships: { include: { site: true } },
        externalIdentities: true,
      },
    });
  }

  async listAddresses(userId: string): Promise<Address[]> {
    return this.db.address.findMany({
      where: { userId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async findAddressForUser(userId: string, addressId: string): Promise<Address | null> {
    return this.db.address.findFirst({
      where: { id: addressId, userId },
    });
  }

  async createAddress(
    userId: string,
    data: Omit<Prisma.AddressUncheckedCreateInput, 'userId' | 'id'>,
  ): Promise<Address> {
    return this.db.$transaction(async (tx) => {
      if (data.isDefault) {
        await tx.address.updateMany({
          where: { userId, isDefault: true },
          data: { isDefault: false },
        });
      }

      return tx.address.create({
        data: {
          userId,
          label: data.label ?? null,
          line1: data.line1,
          line2: data.line2 ?? null,
          city: data.city,
          state: data.state,
          postalCode: data.postalCode,
          country: data.country ?? 'IN',
          isDefault: data.isDefault ?? false,
        },
      });
    });
  }

  async updateAddress(
    userId: string,
    addressId: string,
    data: Prisma.AddressUpdateInput,
  ): Promise<Address | null> {
    return this.db.$transaction(async (tx) => {
      const existing = await tx.address.findFirst({
        where: { id: addressId, userId },
      });

      if (!existing) {
        return null;
      }

      if (data.isDefault === true) {
        await tx.address.updateMany({
          where: { userId, isDefault: true, NOT: { id: addressId } },
          data: { isDefault: false },
        });
      }

      return tx.address.update({
        where: { id: addressId },
        data,
      });
    });
  }

  async deleteAddress(userId: string, addressId: string): Promise<boolean> {
    const result = await this.db.address.deleteMany({
      where: { id: addressId, userId },
    });
    return result.count > 0;
  }
}

export const meRepository = new MeRepository();
