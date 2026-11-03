import request from 'supertest';
import { createApp } from '@/app';
import { verifyAccessToken } from '@/lib/jwt';
import { prisma } from '@/lib/prisma';
import { enquiryService } from '../enquiry.service';

jest.mock('@/lib/jwt');
jest.mock('@/lib/prisma', () => ({
  prisma: {
    site: { findFirst: jest.fn() },
    siteMembership: { findUnique: jest.fn() },
  },
}));
jest.mock('../enquiry.service', () => ({
  enquiryService: {
    listForSite: jest.fn(),
    getForSite: jest.fn(),
    patchForSite: jest.fn(),
    createPublic: jest.fn(),
  },
}));

const app = createApp();

describe('Enquiry API routes', () => {
  const site = {
    id: '22222222-2222-2222-2222-222222222222',
    code: 'IN',
    name: 'SkinDx.in',
    isActive: true,
  };
  const enquiryId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

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

  it('creates a public contact enquiry', async () => {
    (enquiryService.createPublic as jest.Mock).mockResolvedValue({
      id: enquiryId,
      siteCode: 'IN',
      name: 'Ada',
      email: 'ada@example.com',
      phone: '+91 9876543210',
      subject: 'Contact Us',
      message: 'Hello',
      source: 'WEBSITE_IN',
      status: 'NEW',
      createdAt: '2026-11-03T10:00:00.000Z',
      updatedAt: '2026-11-03T10:00:00.000Z',
    });

    const response = await request(app)
      .post('/api/v1/sites/IN/enquiries')
      .send({
        name: 'Ada',
        email: 'ada@example.com',
        phone: '+91 9876543210',
        message: 'Hello',
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(enquiryService.createPublic).toHaveBeenCalledWith(
      expect.objectContaining({
        siteId: site.id,
        siteCode: 'IN',
        body: expect.objectContaining({
          name: 'Ada',
          email: 'ada@example.com',
          phone: '+91 9876543210',
          message: 'Hello',
        }),
      }),
    );
  });

  it('rejects unauthenticated admin list', async () => {
    const response = await request(app).get('/api/v1/admin/sites/IN/enquiries');
    expect(response.status).toBe(401);
  });

  it('lists enquiries for admins with site access', async () => {
    (enquiryService.listForSite as jest.Mock).mockResolvedValue([]);

    const response = await request(app)
      .get('/api/v1/admin/sites/IN/enquiries')
      .query({ name: 'Ada', email: 'ada', phone: '9876', from: '2026-11-01' })
      .set('Authorization', 'Bearer token');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(enquiryService.listForSite).toHaveBeenCalledWith(
      site.id,
      'IN',
      expect.objectContaining({
        name: 'Ada',
        email: 'ada',
        phone: '9876',
      }),
    );
  });

  it('patches enquiry status', async () => {
    (enquiryService.patchForSite as jest.Mock).mockResolvedValue({
      id: enquiryId,
      status: 'RESOLVED',
    });

    const response = await request(app)
      .patch(`/api/v1/admin/sites/IN/enquiries/${enquiryId}`)
      .set('Authorization', 'Bearer token')
      .send({ status: 'RESOLVED' });

    expect(response.status).toBe(200);
    expect(enquiryService.patchForSite).toHaveBeenCalledWith(
      site.id,
      'IN',
      enquiryId,
      { status: 'RESOLVED' },
    );
  });

  it('rejects invalid create body', async () => {
    const response = await request(app)
      .post('/api/v1/sites/IN/enquiries')
      .send({ name: '', email: 'bad', phone: '', message: '' });

    expect(response.status).toBe(422);
    expect(enquiryService.createPublic).not.toHaveBeenCalled();
  });
});
