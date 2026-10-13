import { deleteStoredCloudinaryAssetBestEffort } from '@/lib/cloudinary';
import {
  collectOrphanedPopupPublicIds,
  emptyPopupBannerConfigDto,
  PopupBannerService,
  toPopupBannerConfigDto,
} from '../popup-banner.service';
import type { PopupBannerRepository } from '../popup-banner.repository';
import type { PopupBannerConfigRecord } from '../popup-banner.types';

jest.mock('@/lib/cloudinary', () => ({
  deleteStoredCloudinaryAssetBestEffort: jest.fn(),
}));

function makeRecord(
  overrides: Partial<PopupBannerConfigRecord> = {},
): PopupBannerConfigRecord {
  return {
    id: '11111111-1111-1111-1111-111111111111',
    siteId: '22222222-2222-2222-2222-222222222222',
    imageUrl: 'http://res.cloudinary.com/demo/image/upload/v1/popup.jpg',
    imagePublicId: 'popup/main',
    miniHeading: 'SkinDx Bioc',
    heading: 'Explore the SkinDx range',
    subDescription: 'Shop serums and essentials with clear product information.',
    buttonLabel: 'Shop now',
    buttonUrl: '/category',
    active: true,
    updatedAt: new Date('2026-10-13T12:00:00.000Z'),
    ...overrides,
  };
}

describe('PopupBannerService', () => {
  const findBySiteId = jest.fn();
  const upsertBySiteId = jest.fn();
  const repository = {
    findBySiteId,
    upsertBySiteId,
  } as unknown as PopupBannerRepository;

  const service = new PopupBannerService(repository);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns empty defaults when no record exists', async () => {
    findBySiteId.mockResolvedValue(null);
    const dto = await service.getForSite('site-1', 'IN');
    expect(dto).toEqual(emptyPopupBannerConfigDto('IN'));
  });

  it('maps an existing record and prefers https Cloudinary URLs', async () => {
    const record = makeRecord();
    findBySiteId.mockResolvedValue(record);
    const dto = await service.getForSite(record.siteId, 'IN');
    expect(dto).toEqual(toPopupBannerConfigDto(record, 'IN'));
    expect(dto.imageUrl).toBe(
      'https://res.cloudinary.com/demo/image/upload/v1/popup.jpg',
    );
    expect(dto.miniHeading).toBe('SkinDx Bioc');
    expect(dto.heading).toBe('Explore the SkinDx range');
  });

  it('returns empty defaults for public reads when inactive', async () => {
    findBySiteId.mockResolvedValue(makeRecord({ active: false }));
    const dto = await service.getForSite('site-1', 'IN', { activeOnly: true });
    expect(dto).toEqual(emptyPopupBannerConfigDto('IN'));
  });

  it('collects orphaned public IDs when the image is replaced', () => {
    const previous = makeRecord();
    const orphans = collectOrphanedPopupPublicIds(previous, {
      imageUrl: 'https://cdn.example.com/new.jpg',
      imagePublicId: 'popup/new',
      miniHeading: 'SkinDx Bioc',
      heading: 'Explore the SkinDx range',
      subDescription: 'Updated copy',
      buttonLabel: 'Shop now',
      buttonUrl: '/category',
      active: true,
    });
    expect(orphans).toEqual(['popup/main']);
  });

  it('upserts using siteId from context and cleans replaced images', async () => {
    const existing = makeRecord();
    const saved = makeRecord({
      imageUrl: 'https://cdn.example.com/new.jpg',
      imagePublicId: 'popup/new',
      heading: 'Updated heading',
    });
    findBySiteId.mockResolvedValue(existing);
    upsertBySiteId.mockResolvedValue(saved);
    (deleteStoredCloudinaryAssetBestEffort as jest.Mock).mockResolvedValue(undefined);

    const dto = await service.upsertForSite({
      siteId: existing.siteId,
      siteCode: 'IN',
      userId: 'user-1',
      body: {
        imageUrl: 'https://cdn.example.com/new.jpg',
        imagePublicId: 'popup/new',
        miniHeading: 'SkinDx Bioc',
        heading: 'Updated heading',
        subDescription: 'Shop serums and essentials with clear product information.',
        buttonLabel: 'Shop now',
        buttonUrl: '/category',
        active: true,
      },
    });

    expect(upsertBySiteId).toHaveBeenCalledWith(
      existing.siteId,
      expect.objectContaining({
        heading: 'Updated heading',
        imagePublicId: 'popup/new',
      }),
    );
    expect(deleteStoredCloudinaryAssetBestEffort).toHaveBeenCalledWith('popup/main');
    expect(dto.heading).toBe('Updated heading');
  });
});
