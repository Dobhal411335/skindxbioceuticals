import request from 'supertest';
import { createApp } from '@/app';
import { verifyAccessToken } from '@/lib/jwt';
import { prisma } from '@/lib/prisma';
import { couponService } from '../coupon.service';

jest.mock('@/lib/jwt');
jest.mock('@/lib/prisma', () => ({
  prisma: {
    site: { findFirst: jest.fn() },
    siteMembership: { findUnique: jest.fn() },
  },
}));
jest.mock('../coupon.service', () => ({
  couponService: {
    listForSite: jest.fn(),
    createForSite: jest.fn(),
    updateForSite: jest.fn(),
    patchForSite: jest.fn(),
    deleteForSite: jest.fn(),
  },
}));

const app = createApp();

describe('Coupon admin API routes', () => {
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
    const response = await request(app).get('/api/v1/admin/sites/IN/coupons');
    expect(response.status).toBe(401);
  });

  it('lists admin coupons with site access', async () => {
    (couponService.listForSite as jest.Mock).mockResolvedValue([
      {
        id: '11111111-1111-1111-1111-111111111111',
        code: 'SAVE10',
        percent: 10,
        amount: null,
      },
    ]);

    const response = await request(app)
      .get('/api/v1/admin/sites/IN/coupons')
      .set('Authorization', 'Bearer token');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data[0].code).toBe('SAVE10');
    expect(couponService.listForSite).toHaveBeenCalledWith(site.id, 'IN');
  });

  it('creates a coupon', async () => {
    (couponService.createForSite as jest.Mock).mockResolvedValue({
      id: '11111111-1111-1111-1111-111111111111',
      code: 'FLAT100',
      amount: 100,
      percent: null,
    });

    const response = await request(app)
      .post('/api/v1/admin/sites/IN/coupons')
      .set('Authorization', 'Bearer token')
      .send({
        code: 'FLAT100',
        amount: 100,
        percent: null,
        startsAt: '2026-01-01',
        endsAt: '2026-12-31',
        isActive: true,
      });

    expect(response.status).toBe(201);
    expect(couponService.createForSite).toHaveBeenCalled();
  });

  it('rejects create when both amount and percent are sent', async () => {
    const response = await request(app)
      .post('/api/v1/admin/sites/IN/coupons')
      .set('Authorization', 'Bearer token')
      .send({
        code: 'BOTH',
        amount: 50,
        percent: 10,
        startsAt: '2026-01-01',
        endsAt: '2026-12-31',
      });

    expect(response.status).toBe(422);
    expect(couponService.createForSite).not.toHaveBeenCalled();
  });

  it('patches coupon active flag', async () => {
    (couponService.patchForSite as jest.Mock).mockResolvedValue({
      id: '11111111-1111-1111-1111-111111111111',
      isActive: false,
    });

    const response = await request(app)
      .patch('/api/v1/admin/sites/IN/coupons/11111111-1111-1111-1111-111111111111')
      .set('Authorization', 'Bearer token')
      .send({ isActive: false });

    expect(response.status).toBe(200);
    expect(couponService.patchForSite).toHaveBeenCalled();
  });

  it('deletes a coupon', async () => {
    (couponService.deleteForSite as jest.Mock).mockResolvedValue(undefined);

    const response = await request(app)
      .delete('/api/v1/admin/sites/IN/coupons/11111111-1111-1111-1111-111111111111')
      .set('Authorization', 'Bearer token');

    expect(response.status).toBe(200);
    expect(couponService.deleteForSite).toHaveBeenCalled();
  });
});
