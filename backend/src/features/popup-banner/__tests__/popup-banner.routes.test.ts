import request from 'supertest';
import { createApp } from '@/app';
import { verifyAccessToken } from '@/lib/jwt';
import { prisma } from '@/lib/prisma';
import { popupBannerService } from '../popup-banner.service';

jest.mock('@/lib/jwt');
jest.mock('@/lib/prisma', () => ({
  prisma: {
    site: { findFirst: jest.fn() },
    siteMembership: { findUnique: jest.fn() },
  },
}));
jest.mock('../popup-banner.service', () => ({
  popupBannerService: {
    getForSite: jest.fn(),
    upsertForSite: jest.fn(),
  },
}));

const app = createApp();

describe('Popup banner API routes', () => {
  const site = {
    id: '22222222-2222-2222-2222-222222222222',
    code: 'IN',
    name: 'SkinDx.in',
    isActive: true,
  };

  const dto = {
    id: '11111111-1111-1111-1111-111111111111',
    siteCode: 'IN' as const,
    imageUrl: 'https://res.cloudinary.com/demo/image/upload/v1/popup.jpg',
    imagePublicId: 'popup/main',
    miniHeading: 'SkinDx Bioc',
    heading: 'Explore the SkinDx range',
    subDescription: 'Clear product information.',
    buttonLabel: 'Shop now',
    buttonUrl: '/category',
    active: true,
    updatedAt: '2026-10-13T12:00:00.000Z',
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

  it('rejects unauthenticated admin GET', async () => {
    const response = await request(app).get('/api/v1/admin/sites/IN/popup-banner');
    expect(response.status).toBe(401);
  });

  it('returns admin config', async () => {
    (popupBannerService.getForSite as jest.Mock).mockResolvedValue(dto);

    const response = await request(app)
      .get('/api/v1/admin/sites/IN/popup-banner')
      .set('Authorization', 'Bearer token');

    expect(response.status).toBe(200);
    expect(response.body.data.heading).toBe('Explore the SkinDx range');
    expect(popupBannerService.getForSite).toHaveBeenCalledWith(site.id, 'IN');
  });

  it('upserts admin config', async () => {
    (popupBannerService.upsertForSite as jest.Mock).mockResolvedValue(dto);

    const response = await request(app)
      .put('/api/v1/admin/sites/IN/popup-banner')
      .set('Authorization', 'Bearer token')
      .send({
        imageUrl: dto.imageUrl,
        imagePublicId: dto.imagePublicId,
        miniHeading: dto.miniHeading,
        heading: dto.heading,
        subDescription: dto.subDescription,
        buttonLabel: dto.buttonLabel,
        buttonUrl: dto.buttonUrl,
        active: true,
      });

    expect(response.status).toBe(200);
    expect(popupBannerService.upsertForSite).toHaveBeenCalled();
    expect(response.body.data.active).toBe(true);
  });

  it('rejects active upsert without required fields', async () => {
    const response = await request(app)
      .put('/api/v1/admin/sites/IN/popup-banner')
      .set('Authorization', 'Bearer token')
      .send({ active: true, heading: '' });

    expect(response.status).toBe(422);
    expect(popupBannerService.upsertForSite).not.toHaveBeenCalled();
  });

  it('returns public active popup without auth', async () => {
    (popupBannerService.getForSite as jest.Mock).mockResolvedValue(dto);

    const response = await request(app).get('/api/v1/sites/IN/popup-banner');

    expect(response.status).toBe(200);
    expect(response.body.data.buttonLabel).toBe('Shop now');
    expect(popupBannerService.getForSite).toHaveBeenCalledWith(site.id, 'IN', {
      activeOnly: true,
    });
  });

  it('returns 404 for inactive public site', async () => {
    (prisma.site.findFirst as jest.Mock).mockResolvedValue(null);

    const response = await request(app).get('/api/v1/sites/IN/popup-banner');
    expect(response.status).toBe(404);
  });
});
