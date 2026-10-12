import request from 'supertest';
import { createApp } from '@/app';
import { verifyAccessToken } from '@/lib/jwt';
import { prisma } from '@/lib/prisma';
import { categoryService } from '../category.service';

jest.mock('@/lib/jwt');
jest.mock('@/lib/prisma', () => ({
  prisma: {
    site: { findFirst: jest.fn() },
    siteMembership: { findUnique: jest.fn() },
  },
}));
jest.mock('../category.service', () => ({
  categoryService: {
    listRoots: jest.fn(),
    createRoot: jest.fn(),
    listActiveRoots: jest.fn(),
    getPublicBySlugOrName: jest.fn(),
    getSubcategory: jest.fn(),
    listSubcategories: jest.fn(),
    createSubcategory: jest.fn(),
  },
}));

const app = createApp();

describe('Category API routes', () => {
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

  it('rejects unauthenticated admin list', async () => {
    const response = await request(app).get('/api/v1/admin/sites/IN/categories');
    expect(response.status).toBe(401);
  });

  it('lists admin categories with site access', async () => {
    (categoryService.listRoots as jest.Mock).mockResolvedValue([
      { id: 'cat-1', name: 'Serums', slug: 'serums' },
    ]);

    const response = await request(app)
      .get('/api/v1/admin/sites/IN/categories')
      .set('Authorization', 'Bearer token');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data[0].name).toBe('Serums');
  });

  it('creates a category', async () => {
    (categoryService.createRoot as jest.Mock).mockResolvedValue({
      id: 'cat-1',
      name: 'Serums',
      bannerUrl: null,
    });

    const response = await request(app)
      .post('/api/v1/admin/sites/IN/categories')
      .set('Authorization', 'Bearer token')
      .send({
        name: 'Serums',
        active: true,
      });

    expect(response.status).toBe(201);
    expect(categoryService.createRoot).toHaveBeenCalled();
  });

  it('lists public categories without auth', async () => {
    (categoryService.listActiveRoots as jest.Mock).mockResolvedValue([
      { id: 'cat-1', name: 'Serums', slug: 'serums' },
    ]);

    const response = await request(app).get('/api/v1/sites/IN/categories');
    expect(response.status).toBe(200);
    expect(response.body.data[0].slug).toBe('serums');
  });

  it('returns public category detail by slug', async () => {
    (categoryService.getPublicBySlugOrName as jest.Mock).mockResolvedValue({
      id: 'cat-1',
      name: 'Serums',
      slug: 'serums',
      subcategories: [],
    });

    const response = await request(app).get('/api/v1/sites/IN/categories/serums');
    expect(response.status).toBe(200);
    expect(response.body.data.slug).toBe('serums');
  });

  it('returns a subcategory by id for admin', async () => {
    const subcategoryId = '33333333-3333-3333-3333-333333333333';
    (categoryService.getSubcategory as jest.Mock).mockResolvedValue({
      id: subcategoryId,
      name: 'Vitamin C',
      slug: 'vitamin-c',
      parentId: '11111111-1111-1111-1111-111111111111',
    });

    const response = await request(app)
      .get(`/api/v1/admin/sites/IN/subcategories/${subcategoryId}`)
      .set('Authorization', 'Bearer token');

    expect(response.status).toBe(200);
    expect(response.body.data.name).toBe('Vitamin C');
    expect(categoryService.getSubcategory).toHaveBeenCalled();
  });
});
