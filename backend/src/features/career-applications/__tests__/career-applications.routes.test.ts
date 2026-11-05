import request from 'supertest';

import { createApp } from '@/app';
import { verifyAccessToken } from '@/lib/jwt';
import { prisma } from '@/lib/prisma';
import { careerApplicationService } from '../career-applications.service';
import { careerApplicationCreateRateLimiter } from '../career-applications.public.routes';

jest.mock('@/lib/jwt');
jest.mock('@/lib/prisma', () => ({
  prisma: {
    site: { findFirst: jest.fn() },
    siteMembership: { findUnique: jest.fn() },
  },
}));
jest.mock('../career-applications.service', () => ({
  careerApplicationService: {
    createPublic: jest.fn(),
    listForSite: jest.fn(),
    getForSite: jest.fn(),
    patchForSite: jest.fn(),
    resumeAccessForSite: jest.fn(),
  },
}));

const app = createApp();

const fields = {
  firstName: 'Ada',
  lastName: 'Lovelace',
  birthMonth: '5',
  birthDay: '15',
  birthYear: '1990',
  streetAddress: '122 Bhogal Road',
  city: 'Delhi',
  state: 'Delhi',
  postalCode: '110014',
  email: 'ada@example.com',
  phone: '+91 9876543210',
  positionApplied: 'Research',
  heardAbout: 'LinkedIn',
  availableStartDate: '2099-01-15',
};

describe('Career application API routes', () => {
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

  it('rejects a public application without a résumé', async () => {
    const response = await request(app)
      .post('/api/v1/sites/IN/career-applications')
      .field(fields);

    expect(response.status).toBe(422);
    expect(careerApplicationService.createPublic).not.toHaveBeenCalled();
  });

  it('accepts a pdf résumé application', async () => {
    (careerApplicationService.createPublic as jest.Mock).mockResolvedValue({
      id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      status: 'PENDING',
    });

    const response = await request(app)
      .post('/api/v1/sites/IN/career-applications')
      .field(fields)
      .attach('resume', Buffer.from('%PDF-1.4'), {
        filename: 'cv.pdf',
        contentType: 'application/pdf',
      });

    expect(response.status).toBe(201);
    expect(careerApplicationService.createPublic).toHaveBeenCalledWith(
      expect.objectContaining({
        siteId: site.id,
        siteCode: 'IN',
        file: expect.objectContaining({ originalname: 'cv.pdf' }),
      }),
    );
  });

  it('rejects unauthenticated admin access', async () => {
    const response = await request(app).get('/api/v1/admin/sites/IN/career-applications');
    expect(response.status).toBe(401);
  });

  it('limits repeated public submissions', () => {
    const next = jest.fn();
    const req = { ip: '203.0.113.55', socket: { remoteAddress: '203.0.113.55' } };
    const res = {
      setHeader: jest.fn(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    for (let attempt = 0; attempt < 5; attempt += 1) {
      careerApplicationCreateRateLimiter(req as never, res as never, next);
    }
    careerApplicationCreateRateLimiter(req as never, res as never, next);

    expect(next).toHaveBeenCalledTimes(5);
    expect(res.status).toHaveBeenCalledWith(429);
  });
});
