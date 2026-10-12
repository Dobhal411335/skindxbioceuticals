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
    listForSubcategory: jest.fn(),
    createForSubcategory: jest.fn(),
    patchForSubcategory: jest.fn(),
    deleteForSubcategory: jest.fn(),
  },
}));

const app = createApp();
const subcategoryId = '33333333-3333-3333-3333-333333333333';
const productId = '55555555-5555-5555-5555-555555555555';

describe('Catalog product API routes', () => {
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
    const response = await request(app).get(
      `/api/v1/admin/sites/IN/subcategories/${subcategoryId}/products`,
    );
    expect(response.status).toBe(401);
  });

  it('lists products for a subcategory', async () => {
    (productService.listForSubcategory as jest.Mock).mockResolvedValue([
      { id: productId, productCode: 'VC-01', name: 'Vitamin C Serum', active: true },
    ]);

    const response = await request(app)
      .get(`/api/v1/admin/sites/IN/subcategories/${subcategoryId}/products`)
      .set('Authorization', 'Bearer token');

    expect(response.status).toBe(200);
    expect(response.body.data[0].productCode).toBe('VC-01');
  });

  it('creates a product', async () => {
    (productService.createForSubcategory as jest.Mock).mockResolvedValue({
      id: productId,
      productCode: 'VC-01',
      name: 'Vitamin C Serum',
      active: true,
    });

    const response = await request(app)
      .post(`/api/v1/admin/sites/IN/subcategories/${subcategoryId}/products`)
      .set('Authorization', 'Bearer token')
      .send({ productCode: 'VC-01', name: 'Vitamin C Serum', active: true });

    expect(response.status).toBe(201);
    expect(productService.createForSubcategory).toHaveBeenCalled();
  });

  it('patches product active state', async () => {
    (productService.patchForSubcategory as jest.Mock).mockResolvedValue({
      id: productId,
      active: false,
    });

    const response = await request(app)
      .patch(`/api/v1/admin/sites/IN/subcategories/${subcategoryId}/products/${productId}`)
      .set('Authorization', 'Bearer token')
      .send({ active: false });

    expect(response.status).toBe(200);
    expect(productService.patchForSubcategory).toHaveBeenCalled();
  });
});
