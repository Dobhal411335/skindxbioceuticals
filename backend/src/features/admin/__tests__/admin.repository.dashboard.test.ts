import { AdminRepository } from '../admin.repository';

describe('AdminRepository.getInDashboardAggregates revenue filtering', () => {
  it('aggregates revenue only for non-cancelled orders with CAPTURED payment', async () => {
    const aggregate = jest.fn().mockResolvedValue({ _sum: { grandTotal: 2500 } });
    const count = jest.fn().mockResolvedValue(0);
    const groupBy = jest.fn().mockResolvedValue([]);
    const findMany = jest.fn().mockResolvedValue([]);
    const inventoryCount = jest.fn().mockResolvedValue(0);
    const queryRaw = jest.fn().mockResolvedValue([]);

    const repository = new AdminRepository();
    (repository as unknown as { db: unknown }).db = {
      order: { count, aggregate, groupBy, findMany },
      inventoryItem: { count: inventoryCount },
      $queryRaw: queryRaw,
    };

    const from = new Date('2026-10-01T00:00:00.000Z');
    const to = new Date('2026-10-15T23:59:59.999Z');
    const result = await repository.getInDashboardAggregates('site-1', from, to);

    expect(aggregate).toHaveBeenCalledWith({
      where: {
        siteId: 'site-1',
        createdAt: { gte: from, lte: to },
        status: { notIn: ['CANCELLED', 'REFUNDED'] },
        payments: { some: { status: 'CAPTURED' } },
      },
      _sum: { grandTotal: true },
    });
    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        take: 10,
        orderBy: { createdAt: 'desc' },
      }),
    );
    expect(result.revenue).toBe(2500);
  });
});
