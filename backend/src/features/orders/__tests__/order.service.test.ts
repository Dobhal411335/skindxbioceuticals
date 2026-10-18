import { OrderService } from '../order.service';
import type { OrderRepository } from '../order.repository';

const USER_ID = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const ORDER_ID = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

describe('OrderService.getOrder tax snapshots', () => {
  const findById = jest.fn();
  const findForUser = jest.fn();
  const countForUser = jest.fn();
  const listForUser = jest.fn();

  const repository = {
    findForUser,
    countForUser,
    listForUser,
  } as unknown as OrderRepository;

  const users = { findById } as { findById: typeof findById };
  const service = new OrderService(repository, users as never);

  beforeEach(() => {
    jest.clearAllMocks();
    findById.mockResolvedValue({
      id: USER_ID,
      role: 'CUSTOMER',
      status: 'ACTIVE',
    });
  });

  it('returns persisted CGST/SGST totals and line tax snapshots', async () => {
    findForUser.mockResolvedValue({
      id: ORDER_ID,
      orderNumber: 'IN-TEST1',
      status: 'CONFIRMED',
      currency: 'INR',
      subtotal: { toString: () => '450.00' },
      discountTotal: { toString: () => '300.00' },
      shippingTotal: { toString: () => '0.00' },
      taxTotal: { toString: () => '81.00' },
      cgstTotal: { toString: () => '40.50' },
      sgstTotal: { toString: () => '40.50' },
      grandTotal: { toString: () => '231.00' },
      placedAt: new Date('2026-10-14T00:00:00.000Z'),
      createdAt: new Date('2026-10-14T00:00:00.000Z'),
      payments: [{ status: 'CAPTURED' }],
      items: [
        {
          id: 'item-1',
          productName: 'ACEVIT PLUS Caps',
          variantName: 'Default',
          sku: 'SKU-1',
          unitPrice: { toString: () => '50.00' },
          originalUnitPrice: { toString: () => '150.00' },
          quantity: 3,
          lineTotal: { toString: () => '150.00' },
          cgstPercent: { toString: () => '9.00' },
          sgstPercent: { toString: () => '9.00' },
          cgstAmount: { toString: () => '40.50' },
          sgstAmount: { toString: () => '40.50' },
        },
      ],
    });

    const result = await service.getOrder(USER_ID, ORDER_ID);

    expect(result.cgstTotal).toBe('40.50');
    expect(result.sgstTotal).toBe('40.50');
    expect(result.taxTotal).toBe('81.00');
    expect(result.items[0]).toMatchObject({
      cgstPercent: '9.00',
      sgstPercent: '9.00',
      cgstAmount: '40.50',
      sgstAmount: '40.50',
    });
  });

  it('allows VENDOR to load owned order detail', async () => {
    findById.mockResolvedValue({
      id: USER_ID,
      role: 'VENDOR',
      status: 'ACTIVE',
    });
    findForUser.mockResolvedValue({
      id: ORDER_ID,
      orderNumber: 'IN-VENDOR1',
      status: 'CONFIRMED',
      currency: 'INR',
      subtotal: { toString: () => '800.00' },
      discountTotal: { toString: () => '0.00' },
      shippingTotal: { toString: () => '0.00' },
      taxTotal: { toString: () => '144.00' },
      cgstTotal: { toString: () => '72.00' },
      sgstTotal: { toString: () => '72.00' },
      grandTotal: { toString: () => '944.00' },
      placedAt: new Date('2026-10-14T00:00:00.000Z'),
      createdAt: new Date('2026-10-14T00:00:00.000Z'),
      payments: [{ status: 'CAPTURED' }],
      items: [],
    });

    const result = await service.getOrder(USER_ID, ORDER_ID);
    expect(result.orderNumber).toBe('IN-VENDOR1');
    expect(result.grandTotal).toBe('944.00');
  });

});
