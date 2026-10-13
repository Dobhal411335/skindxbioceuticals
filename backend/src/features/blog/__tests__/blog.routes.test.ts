import request from 'supertest';
import { createApp } from '@/app';
import { verifyAccessToken } from '@/lib/jwt';
import { prisma } from '@/lib/prisma';
import { blogService } from '../blog.service';

jest.mock('@/lib/jwt');
jest.mock('@/lib/prisma', () => ({
  prisma: {
    site: { findFirst: jest.fn() },
    siteMembership: { findUnique: jest.fn() },
  },
}));
jest.mock('../blog.service', () => ({
  blogService: {
    listForSite: jest.fn(),
    getForSite: jest.fn(),
    createForSite: jest.fn(),
    updateForSite: jest.fn(),
    patchForSite: jest.fn(),
    deleteForSite: jest.fn(),
    listPublicForSite: jest.fn(),
    listPublicCategories: jest.fn(),
    getPublicBySlug: jest.fn(),
  },
}));

const app = createApp();

describe('Blog API routes', () => {
  const site = {
    id: '22222222-2222-2222-2222-222222222222',
    code: 'IN',
    name: 'SkinDx.in',
    isActive: true,
  };

  const blogId = '11111111-1111-1111-1111-111111111111';

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
    const response = await request(app).get('/api/v1/admin/sites/IN/blogs');
    expect(response.status).toBe(401);
  });

  it('lists admin blogs with site access', async () => {
    (blogService.listForSite as jest.Mock).mockResolvedValue([
      { id: blogId, name: 'Reading ingredients', slug: 'reading-ingredients' },
    ]);

    const response = await request(app)
      .get('/api/v1/admin/sites/IN/blogs')
      .set('Authorization', 'Bearer token');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data[0].slug).toBe('reading-ingredients');
  });

  it('creates a blog', async () => {
    (blogService.createForSite as jest.Mock).mockResolvedValue({
      id: blogId,
      name: 'Reading ingredients',
      slug: 'reading-ingredients',
      category: 'Education',
    });

    const response = await request(app)
      .post('/api/v1/admin/sites/IN/blogs')
      .set('Authorization', 'Bearer token')
      .send({
        name: 'Reading ingredients',
        category: 'Education',
      });

    expect(response.status).toBe(201);
    expect(blogService.createForSite).toHaveBeenCalled();
  });

  it('updates a blog', async () => {
    (blogService.updateForSite as jest.Mock).mockResolvedValue({
      id: blogId,
      title: 'Updated title',
    });

    const response = await request(app)
      .put(`/api/v1/admin/sites/IN/blogs/${blogId}`)
      .set('Authorization', 'Bearer token')
      .send({
        name: 'Reading ingredients',
        slug: 'reading-ingredients',
        category: 'Education',
        title: 'Updated title',
        publishedAt: '2026-05-15T00:00:00.000Z',
        createdBy: 'SkinDx Editorial',
        imageUrl: 'https://cdn.example.com/blog.jpg',
        imagePublicId: 'blog/post',
        description: '<p>Body</p>',
        blockquote: 'Quote',
        active: true,
      });

    expect(response.status).toBe(200);
    expect(blogService.updateForSite).toHaveBeenCalled();
  });

  it('patches blog name', async () => {
    (blogService.patchForSite as jest.Mock).mockResolvedValue({
      id: blogId,
      name: 'Renamed',
    });

    const response = await request(app)
      .patch(`/api/v1/admin/sites/IN/blogs/${blogId}`)
      .set('Authorization', 'Bearer token')
      .send({ name: 'Renamed' });

    expect(response.status).toBe(200);
    expect(blogService.patchForSite).toHaveBeenCalled();
  });

  it('deletes a blog', async () => {
    (blogService.deleteForSite as jest.Mock).mockResolvedValue(undefined);

    const response = await request(app)
      .delete(`/api/v1/admin/sites/IN/blogs/${blogId}`)
      .set('Authorization', 'Bearer token');

    expect(response.status).toBe(200);
    expect(blogService.deleteForSite).toHaveBeenCalled();
  });

  it('lists public blogs without auth', async () => {
    (blogService.listPublicForSite as jest.Mock).mockResolvedValue([
      { id: blogId, slug: 'reading-ingredients', title: 'How to read' },
    ]);
    (blogService.listPublicCategories as jest.Mock).mockResolvedValue(['Education']);

    const response = await request(app).get('/api/v1/sites/IN/blogs');
    expect(response.status).toBe(200);
    expect(response.body.data.blogs[0].slug).toBe('reading-ingredients');
    expect(response.body.data.categories).toEqual(['Education']);
  });

  it('returns public blog detail by slug', async () => {
    (blogService.getPublicBySlug as jest.Mock).mockResolvedValue({
      id: blogId,
      slug: 'reading-ingredients',
      title: 'How to read',
      related: [],
    });

    const response = await request(app).get(
      '/api/v1/sites/IN/blogs/reading-ingredients',
    );
    expect(response.status).toBe(200);
    expect(response.body.data.slug).toBe('reading-ingredients');
  });
});
