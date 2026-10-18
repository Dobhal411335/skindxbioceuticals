import request from 'supertest';
import { createApp } from '@/app';
import { verifyAccessToken } from '@/lib/jwt';
import { prisma } from '@/lib/prisma';
import { productPricesService } from '../product-prices.service';

jest.mock('@/lib/jwt');
jest.mock('@/lib/prisma', () => ({
  prisma: {
    site: { findFirst: jest.fn() },
    siteMembership: { findUnique: jest.fn() },
  },
}));
jest.mock('../product-prices.service', () => ({
  productPricesService: {
    listForAdmin: jest.fn(),
    applyPercent: jest.fn(),
  },
}));

const app = createApp();
const categoryId = '33333333-3333-3333-3333-333333333333';
const productId = '55555555-5555-5555-5555-555555555555';

describe('Admin Product Prices API routes', () => {
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

  it('rejects unauthenticated price list', async () => {
    const response = await request(app).get(
      '/api/v1/admin/sites/IN/product-prices',
    );
    expect(response.status).toBe(401);
  });

  it('lists price preview with percent and meta', async () => {
    (productPricesService.listForAdmin as jest.Mock).mockResolvedValue({
      items: [
        {
          id: productId,
          productCode: 'VC-01',
          name: 'Vitamin C Serum',
          price: 200,
          updatedPrice: 220,
          variants: [],
        },
      ],
      meta: { page: 1, limit: 10, total: 1, totalPages: 1 },
    });

    const response = await request(app)
      .get(
        `/api/v1/admin/sites/IN/product-prices?categoryId=${categoryId}&percent=10&limit=10`,
      )
      .set('Authorization', 'Bearer token');

    expect(response.status).toBe(200);
    expect(response.body.data[0].updatedPrice).toBe(220);
    expect(response.body.meta).toEqual({
      page: 1,
      limit: 10,
      total: 1,
      totalPages: 1,
    });
    expect(productPricesService.listForAdmin).toHaveBeenCalledWith(
      expect.objectContaining({
        siteId: site.id,
        siteCode: 'IN',
        query: expect.objectContaining({
          categoryId,
          percent: 10,
          limit: 10,
        }),
      }),
    );
  });

  it('rejects apply with zero percent', async () => {
    const response = await request(app)
      .post('/api/v1/admin/sites/IN/product-prices/apply')
      .set('Authorization', 'Bearer token')
      .send({ percent: 0, categoryId });

    expect(response.status).toBe(422);
    expect(productPricesService.applyPercent).not.toHaveBeenCalled();
  });

  it('applies percent by category', async () => {
    (productPricesService.applyPercent as jest.Mock).mockResolvedValue({
      percent: 10,
      productsUpdated: 2,
      variantsUpdated: 3,
      items: [],
    });

    const response = await request(app)
      .post('/api/v1/admin/sites/IN/product-prices/apply')
      .set('Authorization', 'Bearer token')
      .send({ percent: 10, categoryId });

    expect(response.status).toBe(200);
    expect(response.body.data.productsUpdated).toBe(2);
    expect(productPricesService.applyPercent).toHaveBeenCalledWith(
      expect.objectContaining({
        siteId: site.id,
        siteCode: 'IN',
        userId: 'user-1',
        body: expect.objectContaining({
          percent: 10,
          categoryId,
        }),
      }),
    );
  });

  it('applies percent for a single product', async () => {
    (productPricesService.applyPercent as jest.Mock).mockResolvedValue({
      percent: -5,
      productsUpdated: 1,
      variantsUpdated: 1,
      items: [],
    });

    const response = await request(app)
      .post('/api/v1/admin/sites/IN/product-prices/apply')
      .set('Authorization', 'Bearer token')
      .send({ percent: -5, productId });

    expect(response.status).toBe(200);
    expect(productPricesService.applyPercent).toHaveBeenCalledWith(
      expect.objectContaining({
        body: expect.objectContaining({
          percent: -5,
          productId,
        }),
      }),
    );
  });
});
