import request from 'supertest';
import { createApp } from '@/app';
import { verifyAccessToken } from '@/lib/jwt';
import { prisma } from '@/lib/prisma';
import { productService } from '../product.service';

jest.mock('@/lib/jwt');
jest.mock('@/lib/prisma', () => ({
  prisma: {
    site: { findFirst: jest.fn() },
    siteMembership: { findUnique: jest.fn() },
  },
}));
jest.mock('../product.service', () => ({
  productService: {
    listForAdmin: jest.fn(),
    deleteForSite: jest.fn(),
    listForSubcategory: jest.fn(),
    createForSubcategory: jest.fn(),
    patchForSubcategory: jest.fn(),
    deleteForSubcategory: jest.fn(),
  },
}));

const app = createApp();
const productId = '55555555-5555-5555-5555-555555555555';

describe('Admin View All Products API routes', () => {
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

  it('rejects unauthenticated product list', async () => {
    const response = await request(app).get('/api/v1/admin/sites/IN/products');
    expect(response.status).toBe(401);
  });

  it('lists products with filters and meta', async () => {
    (productService.listForAdmin as jest.Mock).mockResolvedValue({
      items: [
        {
          id: productId,
          productCode: 'VC-01',
          name: 'Vitamin C Serum',
          active: true,
        },
      ],
      meta: { page: 1, limit: 10, total: 1, totalPages: 1 },
    });

    const response = await request(app)
      .get('/api/v1/admin/sites/IN/products?period=all&status=active&limit=10')
      .set('Authorization', 'Bearer token');

    expect(response.status).toBe(200);
    expect(response.body.data[0].productCode).toBe('VC-01');
    expect(response.body.meta).toEqual({
      page: 1,
      limit: 10,
      total: 1,
      totalPages: 1,
    });
    expect(productService.listForAdmin).toHaveBeenCalledWith(
      expect.objectContaining({
        siteId: site.id,
        siteCode: 'IN',
        query: expect.objectContaining({
          period: 'all',
          status: 'active',
          limit: 10,
        }),
      }),
    );
  });

  it('rejects period=day without date', async () => {
    const response = await request(app)
      .get('/api/v1/admin/sites/IN/products?period=day')
      .set('Authorization', 'Bearer token');

    expect(response.status).toBe(422);
    expect(productService.listForAdmin).not.toHaveBeenCalled();
  });

  it('deletes a product for the site', async () => {
    (productService.deleteForSite as jest.Mock).mockResolvedValue(undefined);

    const response = await request(app)
      .delete(`/api/v1/admin/sites/IN/products/${productId}`)
      .set('Authorization', 'Bearer token');

    expect(response.status).toBe(200);
    expect(productService.deleteForSite).toHaveBeenCalledWith(
      expect.objectContaining({
        siteId: site.id,
        siteCode: 'IN',
        productId,
      }),
    );
  });
});
