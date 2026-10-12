import request from 'supertest';
import { createApp } from '@/app';
import { verifyAccessToken } from '@/lib/jwt';
import { prisma } from '@/lib/prisma';
import { productEditService } from '../product-edit.service';

jest.mock('@/lib/jwt');
jest.mock('@/lib/prisma', () => ({
  prisma: {
    site: { findFirst: jest.fn() },
    siteMembership: { findUnique: jest.fn() },
  },
}));
jest.mock('../product-edit.service', () => ({
  productEditService: {
    getEditPayload: jest.fn(),
    updateSizes: jest.fn(),
    updateColors: jest.fn(),
    updateVariants: jest.fn(),
    updateTax: jest.fn(),
    updateDescription: jest.fn(),
    createCatalogColor: jest.fn(),
    createCatalogTag: jest.fn(),
  },
}));

const app = createApp();
const productId = '55555555-5555-5555-5555-555555555555';

describe('Product edit API routes', () => {
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

  it('rejects unauthenticated edit payload', async () => {
    const response = await request(app).get(
      `/api/v1/admin/sites/IN/products/${productId}/edit`,
    );
    expect(response.status).toBe(401);
  });

  it('returns edit payload', async () => {
    (productEditService.getEditPayload as jest.Mock).mockResolvedValue({
      product: { id: productId, name: 'Vitamin C Serum' },
      sizes: [],
      colors: [],
    });

    const response = await request(app)
      .get(`/api/v1/admin/sites/IN/products/${productId}/edit`)
      .set('Authorization', 'Bearer token');

    expect(response.status).toBe(200);
    expect(response.body.data.product.name).toBe('Vitamin C Serum');
    expect(productEditService.getEditPayload).toHaveBeenCalled();
  });

  it('updates sizes section', async () => {
    (productEditService.updateSizes as jest.Mock).mockResolvedValue({
      sizes: [{ label: '30ml', active: true }],
    });

    const response = await request(app)
      .put(`/api/v1/admin/sites/IN/products/${productId}/sections/sizes`)
      .set('Authorization', 'Bearer token')
      .send({
        sizes: [{ label: '30ml', active: true }],
      });

    expect(response.status).toBe(200);
    expect(productEditService.updateSizes).toHaveBeenCalled();
  });

  it('updates tax section', async () => {
    (productEditService.updateTax as jest.Mock).mockResolvedValue({
      tax: { cgst: 9, sgst: 9 },
    });

    const response = await request(app)
      .put(`/api/v1/admin/sites/IN/products/${productId}/sections/tax`)
      .set('Authorization', 'Bearer token')
      .send({ cgst: 9, sgst: 9 });

    expect(response.status).toBe(200);
    expect(productEditService.updateTax).toHaveBeenCalled();
  });

  it('creates a catalog color', async () => {
    (productEditService.createCatalogColor as jest.Mock).mockResolvedValue({
      id: '66666666-6666-6666-6666-666666666666',
      name: 'Ivory',
      hex: '#FFFFF0',
    });

    const response = await request(app)
      .post(`/api/v1/admin/sites/IN/products/catalog-colors`)
      .set('Authorization', 'Bearer token')
      .send({ name: 'Ivory', hex: '#FFFFF0' });

    expect(response.status).toBe(201);
    expect(productEditService.createCatalogColor).toHaveBeenCalled();
  });

  it('creates a catalog tag', async () => {
    (productEditService.createCatalogTag as jest.Mock).mockResolvedValue({
      id: '77777777-7777-7777-7777-777777777777',
      name: 'Hydrating',
    });

    const response = await request(app)
      .post(`/api/v1/admin/sites/IN/products/catalog-tags`)
      .set('Authorization', 'Bearer token')
      .send({ name: 'Hydrating' });

    expect(response.status).toBe(201);
    expect(response.body.data.name).toBe('Hydrating');
    expect(productEditService.createCatalogTag).toHaveBeenCalled();
  });

  it('rejects empty catalog tag name', async () => {
    const response = await request(app)
      .post(`/api/v1/admin/sites/IN/products/catalog-tags`)
      .set('Authorization', 'Bearer token')
      .send({ name: '   ' });

    expect(response.status).toBe(422);
    expect(productEditService.createCatalogTag).not.toHaveBeenCalled();
  });
});
