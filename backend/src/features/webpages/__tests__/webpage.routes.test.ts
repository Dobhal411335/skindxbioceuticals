import request from 'supertest';
import { createApp } from '@/app';
import { verifyAccessToken } from '@/lib/jwt';
import { prisma } from '@/lib/prisma';
import { webpageService } from '../webpage.service';

jest.mock('@/lib/jwt');
jest.mock('@/lib/prisma', () => ({
  prisma: {
    site: { findFirst: jest.fn() },
    siteMembership: { findUnique: jest.fn() },
  },
}));
jest.mock('../webpage.service', () => ({
  webpageService: {
    listForSite: jest.fn(),
    getForSite: jest.fn(),
    createForSite: jest.fn(),
    updateContentForSite: jest.fn(),
    patchMetaForSite: jest.fn(),
    deleteForSite: jest.fn(),
    listPublicForSite: jest.fn(),
    getPublicBySlug: jest.fn(),
  },
}));

const app = createApp();

describe('Webpage API routes', () => {
  const site = {
    id: '22222222-2222-2222-2222-222222222222',
    code: 'IN',
    name: 'SkinDx.in',
    isActive: true,
  };

  const webpageId = '11111111-1111-1111-1111-111111111111';

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
    const response = await request(app).get('/api/v1/admin/sites/IN/webpages');
    expect(response.status).toBe(401);
  });

  it('lists admin webpages with site access', async () => {
    (webpageService.listForSite as jest.Mock).mockResolvedValue([
      { id: webpageId, title: 'Our Story', slug: 'our-story', templateType: 'design1' },
    ]);

    const response = await request(app)
      .get('/api/v1/admin/sites/IN/webpages')
      .set('Authorization', 'Bearer token');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data[0].slug).toBe('our-story');
  });

  it('creates a webpage', async () => {
    (webpageService.createForSite as jest.Mock).mockResolvedValue({
      id: webpageId,
      title: 'Our Story',
      slug: 'our-story',
      templateType: 'design1',
    });

    const response = await request(app)
      .post('/api/v1/admin/sites/IN/webpages')
      .set('Authorization', 'Bearer token')
      .send({
        title: 'Our Story',
        templateType: 'design1',
        active: true,
      });

    expect(response.status).toBe(201);
    expect(webpageService.createForSite).toHaveBeenCalled();
  });

  it('rejects design8 template type', async () => {
    const response = await request(app)
      .post('/api/v1/admin/sites/IN/webpages')
      .set('Authorization', 'Bearer token')
      .send({
        title: 'Amenities',
        templateType: 'design8',
      });

    expect([400, 422]).toContain(response.status);
    expect(webpageService.createForSite).not.toHaveBeenCalled();
  });

  it('updates webpage content', async () => {
    (webpageService.updateContentForSite as jest.Mock).mockResolvedValue({
      id: webpageId,
      firstTitle: 'Hello',
    });

    const response = await request(app)
      .put(`/api/v1/admin/sites/IN/webpages/${webpageId}`)
      .set('Authorization', 'Bearer token')
      .send({
        firstTitle: 'Hello',
        secondTitle: 'World',
      });

    expect(response.status).toBe(200);
    expect(webpageService.updateContentForSite).toHaveBeenCalled();
  });

  it('patches webpage meta', async () => {
    (webpageService.patchMetaForSite as jest.Mock).mockResolvedValue({
      id: webpageId,
      title: 'Renamed',
      active: false,
    });

    const response = await request(app)
      .patch(`/api/v1/admin/sites/IN/webpages/${webpageId}`)
      .set('Authorization', 'Bearer token')
      .send({ title: 'Renamed', active: false });

    expect(response.status).toBe(200);
    expect(webpageService.patchMetaForSite).toHaveBeenCalled();
  });

  it('deletes a webpage', async () => {
    (webpageService.deleteForSite as jest.Mock).mockResolvedValue(undefined);

    const response = await request(app)
      .delete(`/api/v1/admin/sites/IN/webpages/${webpageId}`)
      .set('Authorization', 'Bearer token');

    expect(response.status).toBe(200);
    expect(webpageService.deleteForSite).toHaveBeenCalled();
  });

  it('lists public webpages without auth', async () => {
    (webpageService.listPublicForSite as jest.Mock).mockResolvedValue([
      { id: webpageId, slug: 'our-story', title: 'Our Story' },
    ]);

    const response = await request(app).get('/api/v1/sites/IN/webpages');
    expect(response.status).toBe(200);
    expect(response.body.data[0].slug).toBe('our-story');
  });

  it('gets public webpage by slug', async () => {
    (webpageService.getPublicBySlug as jest.Mock).mockResolvedValue({
      id: webpageId,
      slug: 'our-story',
      title: 'Our Story',
      templateType: 'design1',
    });

    const response = await request(app).get('/api/v1/sites/IN/webpages/by-slug/our-story');
    expect(response.status).toBe(200);
    expect(response.body.data.slug).toBe('our-story');
  });
});
