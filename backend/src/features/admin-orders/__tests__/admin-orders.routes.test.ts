import request from 'supertest';
import { createApp } from '@/app';
import { verifyAccessToken } from '@/lib/jwt';
import { prisma } from '@/lib/prisma';
import { adminOrdersService } from '../admin-orders.service';

jest.mock('@/lib/jwt');
jest.mock('@/lib/prisma', () => ({
  prisma: {
    site: { findFirst: jest.fn() },
    siteMembership: { findUnique: jest.fn() },
  },
}));
jest.mock('../admin-orders.service', () => ({
  adminOrdersService: {
    listForSite: jest.fn(),
  },
}));

const app = createApp();

describe('Admin orders API routes', () => {
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

  it('rejects unauthenticated online order log', async () => {
    const response = await request(app).get(
      '/api/v1/admin/sites/IN/orders/online-log',
    );
    expect(response.status).toBe(401);
  });

  it('lists online order log with site access', async () => {
    (adminOrdersService.listForSite as jest.Mock).mockResolvedValue({
      siteCode: 'IN',
      kind: 'online',
      filter: { mode: 'day', date: '2026-10-15' },
      orders: [],
      page: 1,
      pageSize: 10,
      total: 0,
      totalPages: 1,
      hasMore: false,
    });

    const response = await request(app)
      .get('/api/v1/admin/sites/IN/orders/online-log')
      .query({ date: '2026-10-15' })
      .set('Authorization', 'Bearer token');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(adminOrdersService.listForSite).toHaveBeenCalledWith({
      siteId: site.id,
      siteCode: 'IN',
      kind: 'online',
      query: expect.objectContaining({
        page: 1,
        pageSize: 10,
        all: false,
        date: '2026-10-15',
      }),
    });
  });

  it('lists cancel-workspace (pending payment) orders with all=true', async () => {
    (adminOrdersService.listForSite as jest.Mock).mockResolvedValue({
      siteCode: 'IN',
      kind: 'cancelled',
      filter: { mode: 'all', date: null },
      orders: [],
      page: 1,
      pageSize: 10,
      total: 0,
      totalPages: 1,
      hasMore: false,
    });

    const response = await request(app)
      .get('/api/v1/admin/sites/IN/orders/cancelled')
      .query({ all: 'true' })
      .set('Authorization', 'Bearer token');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(adminOrdersService.listForSite).toHaveBeenCalledWith({
      siteId: site.id,
      siteCode: 'IN',
      kind: 'cancelled',
      query: expect.objectContaining({
        all: true,
        date: undefined,
      }),
    });
  });

  it('rejects invalid date query', async () => {
    const response = await request(app)
      .get('/api/v1/admin/sites/IN/orders/online-log')
      .query({ date: 'not-a-date' })
      .set('Authorization', 'Bearer token');

    expect(response.status).toBe(422);
    expect(adminOrdersService.listForSite).not.toHaveBeenCalled();
  });
});
