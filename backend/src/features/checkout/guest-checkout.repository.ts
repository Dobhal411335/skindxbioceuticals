import type { GuestCheckoutSession, Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';

export class GuestCheckoutRepository {
  constructor(private readonly db = prisma) {}

  create(data: {
    tokenHash: string;
    email: string;
    expiresAt: Date;
  }): Promise<GuestCheckoutSession> {
    return this.db.guestCheckoutSession.create({ data });
  }

  findByTokenHash(tokenHash: string): Promise<GuestCheckoutSession | null> {
    return this.db.guestCheckoutSession.findUnique({ where: { tokenHash } });
  }

  findById(id: string): Promise<GuestCheckoutSession | null> {
    return this.db.guestCheckoutSession.findUnique({ where: { id } });
  }

  findByConfirmationTokenHash(
    confirmationTokenHash: string,
  ): Promise<GuestCheckoutSession | null> {
    return this.db.guestCheckoutSession.findFirst({
      where: { confirmationTokenHash },
    });
  }

  update(
    id: string,
    data: Prisma.GuestCheckoutSessionUpdateInput,
  ): Promise<GuestCheckoutSession> {
    return this.db.guestCheckoutSession.update({ where: { id }, data });
  }
}

export const guestCheckoutRepository = new GuestCheckoutRepository();
