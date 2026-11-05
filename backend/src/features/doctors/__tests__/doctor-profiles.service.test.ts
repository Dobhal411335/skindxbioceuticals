import {
  buildDoctorProfileFacets,
  DoctorProfilesService,
  toDoctorProfileDto,
  toDoctorProfilePublicDto,
} from '../doctor-profiles.service';
import type { DoctorProfilesRepository } from '../doctor-profiles.repository';
import type { DoctorProfileRecord } from '../doctor-profiles.types';
import { NotFoundError } from '@/utils/AppError';
import {
  deleteStoredCloudinaryAsset,
  deleteStoredCloudinaryAssetBestEffort,
} from '@/lib/cloudinary';
import { normalizeDoctorName } from '../doctors.constants';

jest.mock('@/lib/cloudinary', () => ({
  deleteStoredCloudinaryAsset: jest.fn(),
  deleteStoredCloudinaryAssetBestEffort: jest.fn(),
}));

function makeRecord(overrides: Partial<DoctorProfileRecord> = {}): DoctorProfileRecord {
  return {
    id: '11111111-1111-1111-1111-111111111111',
    siteId: '22222222-2222-2222-2222-222222222222',
    name: 'Dr. Daisy Bins',
    specializations: ['Dermatology'],
    about: 'Experienced clinician focused on clear, evidence-led care.',
    experienceYears: 12,
    state: 'Maharashtra',
    city: 'Mumbai',
    phone: '+91 9876543210',
    email: 'daisy@example.com',
    location: 'Bandra West, Mumbai',
    education: 'MBBS',
    degree: 'MD Dermatology',
    workHistory: 'Consultant dermatologist',
    workDays: 'Mon–Sat',
    photoUrl: 'https://cdn.example.com/doctor.jpg',
    photoPublicId: 'doctors/photo',
    active: true,
    order: 1,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  };
}

describe('normalizeDoctorName', () => {
  it('prefixes Dr. when missing', () => {
    expect(normalizeDoctorName('Daisy Bins')).toBe('Dr. Daisy Bins');
  });

  it('normalizes existing Dr prefixes', () => {
    expect(normalizeDoctorName('dr Daisy')).toBe('Dr. Daisy');
    expect(normalizeDoctorName('Dr. Daisy')).toBe('Dr. Daisy');
    expect(normalizeDoctorName('DR.  Daisy')).toBe('Dr. Daisy');
  });

  it('normalizes other recognized doctor prefixes', () => {
    expect(normalizeDoctorName('MD Daisy')).toBe('MD Daisy');
    expect(normalizeDoctorName('md.  Daisy')).toBe('MD Daisy');
    expect(normalizeDoctorName('Prof. Daisy')).toBe('Prof. Daisy');
    expect(normalizeDoctorName('Prof. Dr. Daisy')).toBe('Prof. Dr. Daisy');
    expect(normalizeDoctorName('Surgeon Daisy')).toBe('Surgeon Daisy');
  });
});

describe('buildDoctorProfileFacets', () => {
  it('returns unique sorted specialities, states, and cities by state', () => {
    expect(
      buildDoctorProfileFacets([
        { specializations: ['Dermatology'], state: 'Maharashtra', city: 'Mumbai' },
        { specializations: ['dermatology'], state: 'Maharashtra', city: 'Pune' },
        { specializations: ['Cosmetology'], state: 'Karnataka', city: 'Bengaluru' },
        { specializations: ['Dermatology', 'Trichology'], state: 'Maharashtra', city: 'Mumbai' },
        { specializations: ['  '], state: '', city: 'Ignored' },
      ]),
    ).toEqual({
      specialities: ['Cosmetology', 'Dermatology', 'dermatology', 'Trichology'],
      states: ['Karnataka', 'Maharashtra'],
      citiesByState: {
        Karnataka: ['Bengaluru'],
        Maharashtra: ['Mumbai', 'Pune'],
      },
    });
  });
});

describe('DoctorProfilesService', () => {
  const listBySiteId = jest.fn();
  const listActiveBySiteId = jest.fn();
  const listActiveFilterValues = jest.fn();
  const findByIdForSite = jest.fn();
  const nextOrder = jest.fn();
  const create = jest.fn();
  const update = jest.fn();
  const patch = jest.fn();
  const deleteFn = jest.fn();

  const repository = {
    listBySiteId,
    listActiveBySiteId,
    listActiveFilterValues,
    findByIdForSite,
    nextOrder,
    create,
    update,
    patch,
    delete: deleteFn,
  } as unknown as DoctorProfilesRepository;

  const service = new DoctorProfilesService(repository);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('lists and maps doctor profiles for a site', async () => {
    const record = makeRecord();
    listBySiteId.mockResolvedValue([record]);

    const result = await service.listForSite(record.siteId, 'IN');

    expect(listBySiteId).toHaveBeenCalledWith(record.siteId);
    expect(result).toEqual([toDoctorProfileDto(record, 'IN')]);
    expect(result[0]?.state).toBe('Maharashtra');
    expect(result[0]?.city).toBe('Mumbai');
  });

  it('maps public doctor profiles without admin/media internals', async () => {
    const record = makeRecord({
      photoUrl: 'http://res.cloudinary.com/demo/image/upload/v1/doctor.jpg',
    });
    listActiveBySiteId.mockResolvedValue([record]);

    const result = await service.listActiveForSite(record.siteId, 'IN');
    expect(result).toEqual([toDoctorProfilePublicDto(record, 'IN')]);
    expect(result[0]?.photoUrl).toBe(
      'https://res.cloudinary.com/demo/image/upload/v1/doctor.jpg',
    );
    expect(result[0]).not.toHaveProperty('photoPublicId');
    expect(result[0]).not.toHaveProperty('createdAt');
    expect(result[0]).not.toHaveProperty('updatedAt');
  });

  it('builds public facets from active filter values', async () => {
    listActiveFilterValues.mockResolvedValue([
      { specializations: ['Dermatology'], state: 'Maharashtra', city: 'Mumbai' },
      { specializations: ['Cosmetology'], state: 'Karnataka', city: 'Bengaluru' },
    ]);

    const result = await service.getPublicFacets('site-1');

    expect(listActiveFilterValues).toHaveBeenCalledWith('site-1');
    expect(result).toEqual({
      specialities: ['Cosmetology', 'Dermatology'],
      states: ['Karnataka', 'Maharashtra'],
      citiesByState: {
        Karnataka: ['Bengaluru'],
        Maharashtra: ['Mumbai'],
      },
    });
  });

  it('creates using siteId from context and next order', async () => {
    const record = makeRecord();
    nextOrder.mockResolvedValue(3);
    create.mockResolvedValue(record);

    const dto = await service.createForSite({
      siteId: record.siteId,
      siteCode: 'IN',
      userId: 'user-1',
      body: {
        name: record.name,
        specializations: record.specializations,
        about: record.about,
        phone: record.phone,
        email: record.email,
        location: record.location,
        education: record.education,
        degree: record.degree,
        workHistory: record.workHistory,
        workDays: record.workDays,
        experienceYears: 12,
        state: 'Maharashtra',
        city: 'Mumbai',
        photoUrl: record.photoUrl,
        photoPublicId: record.photoPublicId,
        active: true,
      },
    });

    expect(create).toHaveBeenCalledWith(
      record.siteId,
      expect.objectContaining({
        order: 3,
        name: record.name,
        state: 'Maharashtra',
        city: 'Mumbai',
      }),
    );
    expect(dto.id).toBe(record.id);
  });

  it('deletes Cloudinary photo on delete', async () => {
    const record = makeRecord({ photoPublicId: 'doctors/photo' });
    findByIdForSite.mockResolvedValue(record);
    deleteFn.mockResolvedValue(true);

    await service.deleteForSite({
      siteId: record.siteId,
      siteCode: 'IN',
      userId: 'user-1',
      doctorId: record.id,
    });

    expect(deleteStoredCloudinaryAsset).toHaveBeenCalledWith('doctors/photo');
  });

  it('best-effort deletes previous photo on update when publicId changes', async () => {
    const existing = makeRecord({ photoPublicId: 'doctors/old' });
    const updated = makeRecord({ photoPublicId: 'doctors/new' });
    findByIdForSite.mockResolvedValue(existing);
    update.mockResolvedValue(updated);

    await service.updateForSite({
      siteId: existing.siteId,
      siteCode: 'IN',
      userId: 'user-1',
      doctorId: existing.id,
      body: {
        name: updated.name,
        specializations: updated.specializations,
        about: updated.about,
        phone: updated.phone,
        email: updated.email,
        location: updated.location,
        education: updated.education,
        degree: updated.degree,
        workHistory: updated.workHistory,
        workDays: updated.workDays,
        experienceYears: updated.experienceYears,
        state: 'Maharashtra',
        city: 'Mumbai',
        photoUrl: updated.photoUrl,
        photoPublicId: 'doctors/new',
        active: true,
      },
    });

    expect(deleteStoredCloudinaryAssetBestEffort).toHaveBeenCalledWith('doctors/old');
  });

  it('throws NotFound when updating a missing doctor', async () => {
    findByIdForSite.mockResolvedValue(null);

    await expect(
      service.updateForSite({
        siteId: 'site',
        siteCode: 'IN',
        userId: 'user-1',
        doctorId: 'missing',
        body: {
          name: 'Dr. Test',
          specializations: ['Derm'],
          about: 'About',
          phone: '+91 9876543210',
          email: 'test@example.com',
          location: 'Clinic',
          education: '',
          degree: '',
          workHistory: '',
          workDays: '',
          experienceYears: 1,
          state: 'Karnataka',
          city: 'Bengaluru',
          photoUrl: 'https://cdn.example.com/a.jpg',
          photoPublicId: '',
          active: true,
        },
      }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});
