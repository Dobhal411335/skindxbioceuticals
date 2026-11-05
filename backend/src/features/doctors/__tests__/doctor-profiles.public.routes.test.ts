import request from 'supertest';
import { createApp } from '@/app';
import { prisma } from '@/lib/prisma';
import { doctorProfilesService } from '../doctor-profiles.service';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    site: { findFirst: jest.fn() },
  },
}));
jest.mock('../doctor-profiles.service', () => ({
  doctorProfilesService: {
    listActiveForSite: jest.fn(),
    getPublicFacets: jest.fn(),
    listForSite: jest.fn(),
    createForSite: jest.fn(),
    updateForSite: jest.fn(),
    patchForSite: jest.fn(),
    deleteForSite: jest.fn(),
  },
}));

const app = createApp();

describe('Public doctor profile API routes', () => {
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

  it('lists active doctor profiles without auth', async () => {
    (doctorProfilesService.listActiveForSite as jest.Mock).mockResolvedValue([
      {
        id: '11111111-1111-1111-1111-111111111111',
        siteCode: 'IN',
        name: 'Dr. Daisy Bins',
        specializations: ['Dermatology'],
        about: 'About',
        experienceYears: 12,
        state: 'Maharashtra',
        city: 'Mumbai',
        photoUrl: 'https://cdn.example.com/doctor.jpg',
        active: true,
        order: 1,
      },
    ]);

    const response = await request(app).get('/api/v1/sites/IN/doctors');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveLength(1);
    expect(doctorProfilesService.listActiveForSite).toHaveBeenCalledWith(site.id, 'IN');
  });

  it('returns doctor facets without auth', async () => {
    (doctorProfilesService.getPublicFacets as jest.Mock).mockResolvedValue({
      specialities: ['Dermatology'],
      states: ['Maharashtra'],
      citiesByState: { Maharashtra: ['Mumbai'] },
    });

    const response = await request(app).get('/api/v1/sites/IN/doctors/facets');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toEqual({
      specialities: ['Dermatology'],
      states: ['Maharashtra'],
      citiesByState: { Maharashtra: ['Mumbai'] },
    });
    expect(doctorProfilesService.getPublicFacets).toHaveBeenCalledWith(site.id);
  });

  it('returns 404 when site is inactive or missing', async () => {
    (prisma.site.findFirst as jest.Mock).mockResolvedValue(null);

    const response = await request(app).get('/api/v1/sites/IN/doctors/facets');

    expect(response.status).toBe(404);
    expect(doctorProfilesService.getPublicFacets).not.toHaveBeenCalled();
  });
});
