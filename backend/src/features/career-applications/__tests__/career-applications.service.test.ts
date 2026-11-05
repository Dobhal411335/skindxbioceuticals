import { CareerApplicationService, toCareerApplicationDto } from '../career-applications.service';
import type { CareerApplicationRepository } from '../career-applications.repository';
import type { CareerApplicationRecord } from '../career-applications.types';
import type { CareerApplicationCreateBody } from '../career-applications.validation';

function makeRecord(overrides: Partial<CareerApplicationRecord> = {}): CareerApplicationRecord {
  return {
    id: '11111111-1111-1111-1111-111111111111',
    siteId: '22222222-2222-2222-2222-222222222222',
    firstName: 'Ada',
    middleName: '',
    lastName: 'Lovelace',
    birthMonth: 5,
    birthDay: 15,
    birthYear: 1990,
    streetAddress: '122 Bhogal Road',
    streetAddressLine2: '',
    city: 'Delhi',
    state: 'Delhi',
    postalCode: '110014',
    email: 'ada@example.com',
    phone: '+91 9876543210',
    linkedIn: '',
    positionApplied: 'Research',
    heardAbout: 'LinkedIn',
    availableStartDate: new Date('2099-01-15T00:00:00.000Z'),
    resumeUrl: 'https://res.cloudinary.com/demo/raw/upload/cv.pdf',
    resumePublicId: 'skindx/in/documents/careers/cv.pdf',
    resumeFileName: 'cv.pdf',
    resumeMimeType: 'application/pdf',
    status: 'PENDING',
    createdAt: new Date('2026-11-05T10:00:00.000Z'),
    updatedAt: new Date('2026-11-05T10:00:00.000Z'),
    ...overrides,
  };
}

const body: CareerApplicationCreateBody = {
  firstName: 'Ada',
  middleName: '',
  lastName: 'Lovelace',
  birthMonth: 5,
  birthDay: 15,
  birthYear: 1990,
  streetAddress: '122 Bhogal Road',
  streetAddressLine2: '',
  city: 'Delhi',
  state: 'Delhi',
  postalCode: '110014',
  email: 'ada@example.com',
  phone: '+91 9876543210',
  linkedIn: '',
  positionApplied: 'Research',
  heardAbout: 'LinkedIn',
  availableStartDate: new Date('2099-01-15T00:00:00.000Z'),
  companyWebsite: '',
};

const file = {
  originalname: 'cv.pdf',
  mimetype: 'application/pdf',
  size: 1200,
  buffer: Buffer.from('%PDF'),
} as Express.Multer.File;

describe('CareerApplicationService', () => {
  const create = jest.fn();
  const listBySiteId = jest.fn();
  const findByIdForSite = jest.fn();
  const updateStatusForSite = jest.fn();
  const uploadResume = jest.fn();
  const resumeUrl = jest.fn();

  const repository = {
    create,
    listBySiteId,
    findByIdForSite,
    updateStatusForSite,
  } as unknown as CareerApplicationRepository;

  const service = new CareerApplicationService(repository, uploadResume, resumeUrl);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('stores a pending application after the résumé upload', async () => {
    uploadResume.mockResolvedValue({
      url: 'https://cdn.example/cv.pdf',
      publicId: 'skindx/in/documents/careers/cv.pdf',
    });
    create.mockResolvedValue(makeRecord());

    const result = await service.createPublic({
      siteId: 'site-1',
      siteCode: 'IN',
      body,
      file,
    });

    expect(uploadResume).toHaveBeenCalledWith(file, 'IN');
    expect(create).toHaveBeenCalledWith(
      'site-1',
      expect.objectContaining({
        resumePublicId: 'skindx/in/documents/careers/cv.pdf',
        resumeFileName: 'cv.pdf',
      }),
    );
    expect(result?.status).toBe('PENDING');
    expect(result?.fullName).toBe('Ada Lovelace');
  });

  it('drops honeypot submissions before upload', async () => {
    const result = await service.createPublic({
      siteId: 'site-1',
      siteCode: 'IN',
      body: { ...body, companyWebsite: 'https://spam.test' },
      file,
    });

    expect(result).toBeNull();
    expect(uploadResume).not.toHaveBeenCalled();
    expect(create).not.toHaveBeenCalled();
  });

  it('returns a signed résumé link without exposing the stored URL in the DTO', async () => {
    const row = makeRecord();
    findByIdForSite.mockResolvedValue(row);
    resumeUrl.mockReturnValue('https://signed.example/cv.pdf');

    expect(toCareerApplicationDto(row, 'IN')).not.toHaveProperty('resumeUrl');
    await expect(
      service.resumeAccessForSite('site-1', 'IN', row.id),
    ).resolves.toEqual({
      url: 'https://signed.example/cv.pdf',
      fileName: 'cv.pdf',
      mimeType: 'application/pdf',
    });
  });

  it('updates status for an application in the same site', async () => {
    updateStatusForSite.mockResolvedValue(makeRecord({ status: 'SHORTLISTED' }));
    const result = await service.patchForSite('site-1', 'IN', '11111111-1111-1111-1111-111111111111', {
      status: 'SHORTLISTED',
    });
    expect(result.status).toBe('SHORTLISTED');
  });
});
