import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';

/**
 * Links eligible guest orders (userId IS NULL) to a verified customer account
 * when contactEmail matches the verified account email.
 * Safe to run repeatedly; never steals orders owned by another user.
 */
export async function linkGuestOrdersByVerifiedEmail(
  userId: string,
  email: string,
): Promise<number> {
  const normalized = email.trim().toLowerCase();
  if (!normalized || !userId) return 0;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.role !== 'CUSTOMER' || !user.emailVerifiedAt) {
    return 0;
  }
  if (user.email.toLowerCase() !== normalized) {
    return 0;
  }

  const result = await prisma.order.updateMany({
    where: {
      userId: null,
      contactEmail: normalized,
    },
    data: { userId },
  });

  if (result.count > 0) {
    logger.info(
      {
        event: 'orders.guest_link.success',
        context: 'ORDERS',
        userId,
        linkedCount: result.count,
      },
      'Linked guest orders to verified account',
    );
  }

  return result.count;
}
