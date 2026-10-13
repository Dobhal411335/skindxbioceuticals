import {
  DoctorPageService,
  emptyDoctorPageConfigDto,
  toDoctorPageConfigDto,
} from '../doctor-page.service';
import type { DoctorPageRepository } from '../doctor-page.repository';
import type { DoctorPageConfigRecord } from '../doctor-page.types';
import { deleteStoredCloudinaryAssetBestEffort } from '@/lib/cloudinary';

jest.mock('@/lib/cloudinary', () => ({
  deleteStoredCloudinaryAssetBestEffort: jest.fn(),
}));

function makeRecord(
  overrides: Partial<DoctorPageConfigRecord> = {},
): DoctorPageConfigRecord {
  return {
    id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    siteId: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    aboutHeading: 'About heading',
    aboutDescription: 'About description',
    aboutHighlights: ['Highlight A'],
    aboutButtonLabel: 'About More',
    aboutButtonUrl: '/about',
    aboutImageUrl: 'https://cdn.example.com/about.jpg',
    aboutImagePublicId: 'doctors/about',
    aboutSecondaryImageUrl: '',
    aboutSecondaryImagePublicId: '',
    experienceYears: 20,
    servicesHeading: 'Services',
    servicesSubheading: 'Quality care',
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    services: [
      {
        id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
        iconKey: 'Stethoscope',
        name: 'Skin Care',
        description: 'Clinical support',
        readMoreUrl: '/skin',
        order: 0,
        active: true,
      },
      {
        id: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
        iconKey: 'Eye',
        name: 'Hidden',
        description: 'Inactive',
        readMoreUrl: '',
        order: 1,
        active: false,
      },
    ],
    ...overrides,
  };
}

describe('DoctorPageService', () => {
  const findBySiteId = jest.fn();
  const upsertBySiteId = jest.fn();

  const repository = {
    findBySiteId,
    upsertBySiteId,
  } as unknown as DoctorPageRepository;

  const service = new DoctorPageService(repository);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns empty defaults when no config exists', async () => {
    findBySiteId.mockResolvedValue(null);
    await expect(service.getForSite('site', 'IN')).resolves.toEqual(
      emptyDoctorPageConfigDto('IN'),
    );
  });

  it('filters inactive services for public reads', async () => {
    const record = makeRecord();
    findBySiteId.mockResolvedValue(record);

    const dto = await service.getPublicForSite(record.siteId, 'IN');
    expect(dto.services).toHaveLength(1);
    expect(dto.services[0]?.name).toBe('Skin Care');
  });

  it('maps https Cloudinary URLs', () => {
    const record = makeRecord({
      aboutImageUrl: 'http://res.cloudinary.com/demo/image/upload/v1/a.jpg',
    });
    const dto = toDoctorPageConfigDto(record, 'IN');
    expect(dto.aboutImageUrl).toBe(
      'https://res.cloudinary.com/demo/image/upload/v1/a.jpg',
    );
  });

  it('upserts and best-effort deletes replaced assets', async () => {
    const previous = makeRecord({ aboutImagePublicId: 'doctors/old' });
    const next = makeRecord({ aboutImagePublicId: 'doctors/new' });
    findBySiteId.mockResolvedValue(previous);
    upsertBySiteId.mockResolvedValue(next);

    const dto = await service.upsertForSite({
      siteId: previous.siteId,
      siteCode: 'IN',
      userId: 'user-1',
      body: {
        aboutHeading: next.aboutHeading,
        aboutDescription: next.aboutDescription,
        aboutHighlights: next.aboutHighlights,
        aboutButtonLabel: next.aboutButtonLabel,
        aboutButtonUrl: next.aboutButtonUrl,
        aboutImageUrl: next.aboutImageUrl,
        aboutImagePublicId: 'doctors/new',
        aboutSecondaryImageUrl: '',
        aboutSecondaryImagePublicId: '',
        experienceYears: 20,
        servicesHeading: next.servicesHeading,
        servicesSubheading: next.servicesSubheading,
        services: [
          {
            iconKey: 'Stethoscope',
            name: 'Skin Care',
            description: 'Clinical support',
            readMoreUrl: '/skin',
            active: true,
          },
        ],
      },
    });

    expect(upsertBySiteId).toHaveBeenCalled();
    expect(deleteStoredCloudinaryAssetBestEffort).toHaveBeenCalledWith('doctors/old');
    expect(dto.aboutImagePublicId).toBe('doctors/new');
  });
});
