import request from 'supertest';
import { createApp } from '@/app';
import { verifyAccessToken } from '@/lib/jwt';
import { prisma } from '@/lib/prisma';
import { doctorAppointmentsService } from '../doctor-appointments.service';

jest.mock('@/lib/jwt');
jest.mock('@/lib/prisma', () => ({
  prisma: {
    site: { findFirst: jest.fn() },
    siteMembership: { findUnique: jest.fn() },
  },
}));
jest.mock('../doctor-appointments.service', () => ({
  doctorAppointmentsService: {
    listForSite: jest.fn(),
    getForSite: jest.fn(),
    patchForSite: jest.fn(),
    createPublic: jest.fn(),
  },
}));

const app = createApp();

describe('Doctor appointments admin API routes', () => {
  const site = {
    id: '22222222-2222-2222-2222-222222222222',
    code: 'IN',
    name: 'SkinDx.in',
    isActive: true,
  };
  const appointmentId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

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
    const response = await request(app).get(
      '/api/v1/admin/sites/IN/doctor-appointments',
    );
    expect(response.status).toBe(401);
  });

  it('lists admin appointments with site access', async () => {
    (doctorAppointmentsService.listForSite as jest.Mock).mockResolvedValue([
      {
        id: appointmentId,
        status: 'NEW',
        patientName: 'Jane Doe',
      },
    ]);

    const response = await request(app)
      .get('/api/v1/admin/sites/IN/doctor-appointments')
      .set('Authorization', 'Bearer token');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data[0].id).toBe(appointmentId);
    expect(doctorAppointmentsService.listForSite).toHaveBeenCalledWith(
      site.id,
      'IN',
      expect.any(Object),
    );
  });

  it('patches appointment status', async () => {
    (doctorAppointmentsService.patchForSite as jest.Mock).mockResolvedValue({
      id: appointmentId,
      status: 'CANCELLED',
    });

    const response = await request(app)
      .patch(`/api/v1/admin/sites/IN/doctor-appointments/${appointmentId}`)
      .set('Authorization', 'Bearer token')
      .send({ status: 'CANCELLED' });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.status).toBe('CANCELLED');
    expect(doctorAppointmentsService.patchForSite).toHaveBeenCalledWith(
      site.id,
      'IN',
      appointmentId,
      { status: 'CANCELLED' },
    );
  });

  it('rejects invalid status patch body', async () => {
    const response = await request(app)
      .patch(`/api/v1/admin/sites/IN/doctor-appointments/${appointmentId}`)
      .set('Authorization', 'Bearer token')
      .send({ status: 'PENDING' });

    expect(response.status).toBe(422);
    expect(doctorAppointmentsService.patchForSite).not.toHaveBeenCalled();
  });
});
