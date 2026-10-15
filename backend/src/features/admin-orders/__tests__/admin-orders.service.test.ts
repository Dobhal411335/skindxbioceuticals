import {
  AdminOrdersService,
  toAdminOrderLogItemDto,
} from '../admin-orders.service';
import type { AdminOrdersRepository, AdminOrderLogRow } from '../admin-orders.repository';

function makeRow(overrides: Partial<AdminOrderLogRow> = {}): AdminOrderLogRow {
  return {
    id: '11111111-1111-1111-1111-111111111111',
    siteId: '22222222-2222-2222-2222-222222222222',
    orderNumber: 'IN-1001',
    userId: null,
    contactEmail: 'guest@example.com',
    status: 'CONFIRMED',
    currency: 'INR',
    subtotal: 1000 as never,
    discountTotal: 0 as never,
    shippingTotal: 0 as never,
    taxTotal: 180 as never,
    cgstTotal: 90 as never,
    sgstTotal: 90 as never,
    grandTotal: 1180 as never,
    couponId: null,
    shippingAddress: {},
    billingAddress: null,
    notes: null,
    confirmationEmailSentAt: null,
    placedAt: new Date('2026-10-15T08:00:00.000Z'),
    createdAt: new Date('2026-10-15T08:00:00.000Z'),
    updatedAt: new Date('2026-10-15T08:00:00.000Z'),
    user: null,
    payments: [{ status: 'CAPTURED', method: 'UPI' }],
    items: [{ quantity: 2 }],
    ...overrides,
  } as AdminOrderLogRow;
}

describe('AdminOrdersService', () => {
  const countForSite = jest.fn();
  const listForSite = jest.fn();
  const repository = {
    countForSite,
    listForSite,
  } as unknown as AdminOrdersRepository;
  const service = new AdminOrdersService(repository);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('maps order rows to log DTOs', () => {
    const row = makeRow();
    expect(toAdminOrderLogItemDto(row)).toEqual({
      id: row.id,
      orderNumber: 'IN-1001',
      status: 'CONFIRMED',
      currency: 'INR',
      grandTotal: 1180,
      taxTotal: 180,
      cgstTotal: 90,
      sgstTotal: 90,
      customerEmail: 'guest@example.com',
      paymentStatus: 'CAPTURED',
      paymentMethod: 'UPI',
      itemCount: 2,
      placedAt: '2026-10-15T08:00:00.000Z',
      createdAt: '2026-10-15T08:00:00.000Z',
      cancelledAt: null,
    });
  });

  it('lists online orders for a day with pagination metadata', async () => {
    const row = makeRow();
    countForSite.mockResolvedValue(11);
    listForSite.mockResolvedValue([row]);

    const result = await service.listForSite({
      siteId: row.siteId,
      siteCode: 'IN',
      kind: 'online',
      query: {
        page: 1,
        pageSize: 10,
        all: false,
        date: '2026-10-15',
        q: undefined,
      },
    });

    expect(countForSite).toHaveBeenCalledWith(
      row.siteId,
      'online',
      expect.objectContaining({
        range: expect.objectContaining({
          from: expect.any(Date),
          to: expect.any(Date),
        }),
      }),
    );
    expect(listForSite).toHaveBeenCalledWith(
      row.siteId,
      'online',
      expect.objectContaining({ page: 1, pageSize: 10 }),
    );
    expect(result.hasMore).toBe(true);
    expect(result.total).toBe(11);
    expect(result.orders).toHaveLength(1);
    expect(result.filter).toEqual({ mode: 'day', date: '2026-10-15' });
  });

  it('lists cancel-workspace orders across all days when all=true', async () => {
    const row = makeRow({
      status: 'PENDING',
      payments: [{ status: 'PENDING', method: 'UPI' }],
      updatedAt: new Date('2026-10-14T10:00:00.000Z'),
    });
    countForSite.mockResolvedValue(1);
    listForSite.mockResolvedValue([row]);

    const result = await service.listForSite({
      siteId: row.siteId,
      siteCode: 'IN',
      kind: 'cancelled',
      query: {
        page: 1,
        pageSize: 10,
        all: true,
        date: undefined,
        q: undefined,
      },
    });

    expect(countForSite).toHaveBeenCalledWith(
      row.siteId,
      'cancelled',
      expect.objectContaining({ range: undefined }),
    );
    expect(result.filter).toEqual({ mode: 'all', date: null });
    expect(result.orders[0]?.paymentStatus).toBe('PENDING');
    expect(result.orders[0]?.cancelledAt).toBeNull();
    expect(result.hasMore).toBe(false);
  });

  it('passes search query to the repository', async () => {
    const row = makeRow();
    countForSite.mockResolvedValue(1);
    listForSite.mockResolvedValue([row]);

    await service.listForSite({
      siteId: row.siteId,
      siteCode: 'IN',
      kind: 'online',
      query: {
        page: 1,
        pageSize: 10,
        all: false,
        date: '2026-10-15',
        q: 'IN-1001',
      },
    });

    expect(countForSite).toHaveBeenCalledWith(
      row.siteId,
      'online',
      expect.objectContaining({ q: 'IN-1001' }),
    );
    expect(listForSite).toHaveBeenCalledWith(
      row.siteId,
      'online',
      expect.objectContaining({ q: 'IN-1001' }),
    );
  });
});
