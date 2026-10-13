import request from 'supertest';
import { createApp } from '@/app';
import { prisma } from '@/lib/prisma';
import { productService } from '../product.service';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    site: { findFirst: jest.fn() },
  },
}));
jest.mock('../product.service', () => ({
  productService: {
    getPublicBySlug: jest.fn(),
    listPublic: jest.fn(),
    listPublicHighlights: jest.fn(),
    listForSubcategory: jest.fn(),
    createForSubcategory: jest.fn(),
    patchForSubcategory: jest.fn(),
    deleteForSubcategory: jest.fn(),
  },
}));

const app = createApp();

describe('Public product API routes', () => {
  const site = {
    id: '22222222-2222-2222-2222-222222222222',
    code: 'IN',
    name: 'SkinDx.in',
    isActive: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (prisma.site.findFirst as jest.Mock).mockResolvedValue(site);
  });

  it('lists active products without auth', async () => {
    (productService.listPublic as jest.Mock).mockResolvedValue([
      {
        id: '55555555-5555-5555-5555-555555555555',
        siteCode: 'IN',
        slug: 'vitamin-c-serum',
        name: 'Vitamin C Serum',
        categoryName: 'Serums',
        price: 1499,
        imageUrl: 'https://res.cloudinary.com/demo/image/upload/a.jpg',
        averageRating: 4.5,
        reviewCount: 2,
        defaultVariantId: 'v1',
        quantity: 10,
        isFeatured: true,
        isRecent: false,
        isBestSeller: false,
      },
    ]);

    const response = await request(app).get('/api/v1/sites/IN/products?limit=15');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveLength(1);
    expect(productService.listPublic).toHaveBeenCalledWith({
      siteId: site.id,
      siteCode: 'IN',
      limit: 15,
    });
  });

  it('returns highlight columns without auth', async () => {
    (productService.listPublicHighlights as jest.Mock).mockResolvedValue({
      recent: [],
      featured: [{ id: 'f1', slug: 'featured', name: 'Featured' }],
      bestSellers: [],
    });

    const response = await request(app).get('/api/v1/sites/IN/products/highlights');

    expect(response.status).toBe(200);
    expect(response.body.data.featured[0].slug).toBe('featured');
    expect(productService.listPublicHighlights).toHaveBeenCalledWith({
      siteId: site.id,
      siteCode: 'IN',
    });
  });

  it('returns an active product by slug without auth', async () => {
    (productService.getPublicBySlug as jest.Mock).mockResolvedValue({
      id: '55555555-5555-5555-5555-555555555555',
      siteCode: 'IN',
      slug: 'vitamin-c-serum',
      name: 'Vitamin C Serum',
      description: '<p>Overview</p>',
      gallery: [],
      sizes: [],
      colors: [],
      variants: [{ id: 'v1', price: 1499, quantity: 10, isActive: true }],
      relatedProducts: [],
    });

    const response = await request(app).get('/api/v1/sites/IN/products/vitamin-c-serum');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.slug).toBe('vitamin-c-serum');
    expect(productService.getPublicBySlug).toHaveBeenCalledWith({
      siteId: site.id,
      siteCode: 'IN',
      slug: 'vitamin-c-serum',
    });
  });

  it('rejects invalid product slugs', async () => {
    const response = await request(app).get('/api/v1/sites/IN/products/Bad%20Slug!');
    expect(response.status).toBe(422);
    expect(productService.getPublicBySlug).not.toHaveBeenCalled();
  });

  it('rejects an invalid list limit', async () => {
    const response = await request(app).get('/api/v1/sites/IN/products?limit=99');
    expect(response.status).toBe(422);
    expect(productService.listPublic).not.toHaveBeenCalled();
  });

  it('returns 404 when the site is missing', async () => {
    (prisma.site.findFirst as jest.Mock).mockResolvedValue(null);

    const response = await request(app).get('/api/v1/sites/IN/products/vitamin-c-serum');
    expect(response.status).toBe(404);
    expect(productService.getPublicBySlug).not.toHaveBeenCalled();
  });
});
