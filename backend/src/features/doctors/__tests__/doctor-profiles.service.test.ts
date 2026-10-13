import { DoctorProfilesService, toDoctorProfileDto } from '../doctor-profiles.service';
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
    specialization: 'Dermatology',
    about: 'Experienced clinician focused on clear, evidence-led care.',
    experienceYears: 12,
    consultancyType: 'BY_APPOINTMENT',
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
});

describe('DoctorProfilesService', () => {
  const listBySiteId = jest.fn();
  const listActiveBySiteId = jest.fn();
  const findByIdForSite = jest.fn();
  const nextOrder = jest.fn();
  const create = jest.fn();
  const update = jest.fn();
  const patch = jest.fn();
  const deleteFn = jest.fn();

  const repository = {
    listBySiteId,
    listActiveBySiteId,
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
  });

  it('prefers https Cloudinary URLs when mapping', async () => {
    const record = makeRecord({
      photoUrl: 'http://res.cloudinary.com/demo/image/upload/v1/doctor.jpg',
    });
    listActiveBySiteId.mockResolvedValue([record]);

    const result = await service.listActiveForSite(record.siteId, 'IN');
    expect(result[0]?.photoUrl).toBe(
      'https://res.cloudinary.com/demo/image/upload/v1/doctor.jpg',
    );
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
        specialization: record.specialization,
        about: record.about,
        experienceYears: 12,
        consultancyType: 'BY_APPOINTMENT',
        photoUrl: record.photoUrl,
        photoPublicId: record.photoPublicId,
        active: true,
      },
    });

    expect(create).toHaveBeenCalledWith(
      record.siteId,
      expect.objectContaining({ order: 3, name: record.name }),
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
        specialization: updated.specialization,
        about: updated.about,
        experienceYears: updated.experienceYears,
        consultancyType: updated.consultancyType,
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
          specialization: 'Derm',
          about: 'About',
          experienceYears: 1,
          consultancyType: 'ONLINE',
          photoUrl: 'https://cdn.example.com/a.jpg',
          photoPublicId: '',
          active: true,
        },
      }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});
