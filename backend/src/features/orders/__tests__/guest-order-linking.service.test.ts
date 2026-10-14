import { linkGuestOrdersByVerifiedEmail } from '../guest-order-linking.service';

const findUnique = jest.fn();
const updateMany = jest.fn();

jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: { findUnique: (...args: unknown[]) => findUnique(...args) },
    order: { updateMany: (...args: unknown[]) => updateMany(...args) },
  },
}));

jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

describe('linkGuestOrdersByVerifiedEmail', () => {
  beforeEach(() => {
    findUnique.mockReset();
    updateMany.mockReset();
  });

  it('links guest orders for a verified matching email', async () => {
    findUnique.mockResolvedValue({
      id: 'user-1',
      role: 'CUSTOMER',
      email: 'guest@example.com',
      emailVerifiedAt: new Date(),
    });
    updateMany.mockResolvedValue({ count: 2 });

    const count = await linkGuestOrdersByVerifiedEmail('user-1', 'Guest@Example.com');
    expect(count).toBe(2);
    expect(updateMany).toHaveBeenCalledWith({
      where: { userId: null, contactEmail: 'guest@example.com' },
      data: { userId: 'user-1' },
    });
  });

  it('does not link when the account email is unverified', async () => {
    findUnique.mockResolvedValue({
      id: 'user-1',
      role: 'CUSTOMER',
      email: 'guest@example.com',
      emailVerifiedAt: null,
    });

    const count = await linkGuestOrdersByVerifiedEmail('user-1', 'guest@example.com');
    expect(count).toBe(0);
    expect(updateMany).not.toHaveBeenCalled();
  });
});
