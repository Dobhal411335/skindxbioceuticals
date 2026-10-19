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
    listDirect: jest.fn(),
    createDirect: jest.fn(),
    updateDirect: jest.fn(),
    patchDirect: jest.fn(),
    deleteDirect: jest.fn(),
  },
}));

const app = createApp();
const productId = '55555555-5555-5555-5555-555555555555';

describe('Direct product API routes', () => {
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

  it('rejects unauthenticated direct product list', async () => {
    const response = await request(app).get('/api/v1/admin/sites/IN/products/direct');
    expect(response.status).toBe(401);
  });

  it('lists direct products', async () => {
    (productService.listDirect as jest.Mock).mockResolvedValue([
      {
        id: productId,
        productCode: 'DIR-01',
        name: 'Direct Serum',
        productType: 'DIRECT',
        active: true,
      },
    ]);

    const response = await request(app)
      .get('/api/v1/admin/sites/IN/products/direct')
      .set('Authorization', 'Bearer token');

    expect(response.status).toBe(200);
    expect(response.body.data[0].productType).toBe('DIRECT');
    expect(productService.listDirect).toHaveBeenCalled();
  });

  it('creates a direct product', async () => {
    (productService.createDirect as jest.Mock).mockResolvedValue({
      id: productId,
      productCode: 'DIR-01',
      name: 'Direct Serum',
      productType: 'DIRECT',
      subcategoryId: null,
      active: true,
    });

    const response = await request(app)
      .post('/api/v1/admin/sites/IN/products/direct')
      .set('Authorization', 'Bearer token')
      .send({ productCode: 'DIR-01', name: 'Direct Serum', active: true });

    expect(response.status).toBe(201);
    expect(productService.createDirect).toHaveBeenCalled();
    expect(response.body.data.subcategoryId).toBeNull();
  });

  it('patches a direct product', async () => {
    (productService.patchDirect as jest.Mock).mockResolvedValue({
      id: productId,
      active: false,
      productType: 'DIRECT',
    });

    const response = await request(app)
      .patch(`/api/v1/admin/sites/IN/products/direct/${productId}`)
      .set('Authorization', 'Bearer token')
      .send({ active: false });

    expect(response.status).toBe(200);
    expect(productService.patchDirect).toHaveBeenCalled();
  });

  it('deletes a direct product', async () => {
    (productService.deleteDirect as jest.Mock).mockResolvedValue(undefined);

    const response = await request(app)
      .delete(`/api/v1/admin/sites/IN/products/direct/${productId}`)
      .set('Authorization', 'Bearer token');

    expect(response.status).toBe(200);
    expect(productService.deleteDirect).toHaveBeenCalled();
  });
});
