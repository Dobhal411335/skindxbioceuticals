import request from 'supertest';
import { createApp } from '@/app';
import { verifyAccessToken } from '@/lib/jwt';
import { prisma } from '@/lib/prisma';
import { inventoryService } from '../inventory.service';

jest.mock('@/lib/jwt');
jest.mock('@/lib/prisma', () => ({
  prisma: {
    site: { findFirst: jest.fn() },
    siteMembership: { findUnique: jest.fn() },
  },
}));
jest.mock('../inventory.service', () => ({
  inventoryService: {
    listForAdmin: jest.fn(),
    updateVariantQuantity: jest.fn(),
  },
}));

const app = createApp();
const variantId = '44444444-4444-4444-4444-444444444444';
const productId = '55555555-5555-5555-5555-555555555555';

describe('Admin Stock Management API routes', () => {
  const site = {
    id: '22222222-2222-2222-2222-222222222222',
    code: 'IN',
    name: 'SkinDx.in',
    isActive: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (verifyAccessToken as jest.Mock).mockReturnValue({
      sub: 'user-1',
      email: 'admin@test.com',
      role: 'ADMIN',
    });
    (prisma.site.findFirst as jest.Mock).mockResolvedValue(site);
    (prisma.siteMembership.findUnique as jest.Mock).mockResolvedValue({
      id: 'membership-1',
      userId: 'user-1',
      siteId: site.id,
    });
  });

  it('rejects unauthenticated stock list', async () => {
    const response = await request(app).get('/api/v1/admin/sites/IN/stock');
    expect(response.status).toBe(401);
  });

  it('lists stock with filters and meta', async () => {
    (inventoryService.listForAdmin as jest.Mock).mockResolvedValue({
      items: [
        {
          id: productId,
          productCode: 'VC-01',
          name: 'Vitamin C Serum',
          status: 'ACTIVE',
          isSimpleOffer: true,
          quantity: 12,
          variants: [],
        },
      ],
      meta: { page: 1, limit: 10, total: 1, totalPages: 1 },
    });

    const response = await request(app)
      .get('/api/v1/admin/sites/IN/stock?status=active&q=vitamin&limit=10')
      .set('Authorization', 'Bearer token');

    expect(response.status).toBe(200);
    expect(response.body.data[0].productCode).toBe('VC-01');
    expect(response.body.meta).toEqual({
      page: 1,
      limit: 10,
      total: 1,
      totalPages: 1,
    });
    expect(inventoryService.listForAdmin).toHaveBeenCalledWith(
      expect.objectContaining({
        siteId: site.id,
        siteCode: 'IN',
        query: expect.objectContaining({
          status: 'active',
          q: 'vitamin',
          limit: 10,
        }),
      }),
    );
  });

  it('rejects invalid quantity body', async () => {
    const response = await request(app)
      .patch(`/api/v1/admin/sites/IN/stock/variants/${variantId}`)
      .set('Authorization', 'Bearer token')
      .send({ quantity: -3 });

    expect(response.status).toBe(422);
    expect(inventoryService.updateVariantQuantity).not.toHaveBeenCalled();
  });

  it('patches absolute variant quantity', async () => {
    (inventoryService.updateVariantQuantity as jest.Mock).mockResolvedValue({
      productId,
      variantId,
      quantity: 9,
    });

    const response = await request(app)
      .patch(`/api/v1/admin/sites/IN/stock/variants/${variantId}`)
      .set('Authorization', 'Bearer token')
      .send({ quantity: 9 });

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual({
      productId,
      variantId,
      quantity: 9,
    });
    expect(inventoryService.updateVariantQuantity).toHaveBeenCalledWith(
      expect.objectContaining({
        siteId: site.id,
        siteCode: 'IN',
        userId: 'user-1',
        variantId,
        quantity: 9,
      }),
    );
  });
});
