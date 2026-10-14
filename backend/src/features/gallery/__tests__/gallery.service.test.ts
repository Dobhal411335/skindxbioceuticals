import { GalleryService, toGalleryItemDto } from '../gallery.service';
import type { GalleryRepository } from '../gallery.repository';
import type { GalleryItemRecord } from '../gallery.types';
import { NotFoundError } from '@/utils/AppError';
import {
  deleteStoredCloudinaryAsset,
  deleteStoredCloudinaryAssetBestEffort,
} from '@/lib/cloudinary';

jest.mock('@/lib/cloudinary', () => ({
  deleteStoredCloudinaryAsset: jest.fn(),
  deleteStoredCloudinaryAssetBestEffort: jest.fn(),
  mediaTypeToCloudinaryResourceType: jest.fn((mediaType: string) =>
    mediaType === 'VIDEO' || mediaType === 'video' ? 'video' : 'image',
  ),
}));

function makeRecord(overrides: Partial<GalleryItemRecord> = {}): GalleryItemRecord {
  return {
    id: '11111111-1111-1111-1111-111111111111',
    siteId: '22222222-2222-2222-2222-222222222222',
    mediaType: 'IMAGE',
    mediaUrl: 'https://cdn.example.com/gallery.jpg',
    mediaPublicId: 'gallery/item',
    clickUrl: '',
    heading: '',
    description: '',
    buttonLabel: '',
    buttonUrl: '',
    active: true,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  };
}

describe('GalleryService', () => {
  const listBySiteId = jest.fn();
  const listActiveBySiteId = jest.fn();
  const findByIdForSite = jest.fn();
  const create = jest.fn();
  const update = jest.fn();
  const patch = jest.fn();
  const deleteFn = jest.fn();

  const repository = {
    listBySiteId,
    listActiveBySiteId,
    findByIdForSite,
    create,
    update,
    patch,
    delete: deleteFn,
  } as unknown as GalleryRepository;

  const service = new GalleryService(repository);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('lists and maps items for a site', async () => {
    const record = makeRecord({ clickUrl: '/shop' });
    listBySiteId.mockResolvedValue([record]);

    const result = await service.listForSite(record.siteId, 'IN', 'image');

    expect(listBySiteId).toHaveBeenCalledWith(record.siteId, 'IMAGE');
    expect(result).toEqual([toGalleryItemDto(record, 'IN')]);
    expect(result[0]?.mediaType).toBe('image');
    expect(result[0]?.clickUrl).toBe('/shop');
  });

  it('prefers https Cloudinary URLs when mapping', async () => {
    const record = makeRecord({
      mediaUrl: 'http://res.cloudinary.com/demo/image/upload/v1/gallery.jpg',
    });
    listActiveBySiteId.mockResolvedValue([record]);

    const result = await service.listActiveForSite(record.siteId, 'IN');
    expect(result[0]?.mediaUrl).toBe(
      'https://res.cloudinary.com/demo/image/upload/v1/gallery.jpg',
    );
  });

  it('creates using siteId from context', async () => {
    const record = makeRecord();
    create.mockResolvedValue(record);

    const dto = await service.createForSite({
      siteId: record.siteId,
      siteCode: 'IN',
      userId: 'user-1',
      body: {
        mediaType: 'image',
        mediaUrl: record.mediaUrl,
        mediaPublicId: record.mediaPublicId,
        clickUrl: '/products',
        heading: '',
        description: '',
        buttonLabel: '',
        buttonUrl: '',
        active: true,
      },
    });

    expect(create).toHaveBeenCalledWith(record.siteId, {
      mediaType: 'IMAGE',
      mediaUrl: record.mediaUrl,
      mediaPublicId: record.mediaPublicId,
      clickUrl: '/products',
      heading: '',
      description: '',
      buttonLabel: '',
      buttonUrl: '',
      active: true,
    });
    expect(dto.id).toBe(record.id);
  });

  it('creates text cards without media fields', async () => {
    const record = makeRecord({
      mediaType: 'TEXT_CARD',
      mediaUrl: '',
      mediaPublicId: '',
      heading: 'HÄLLAN',
      description: 'Calm textures for daily rituals.',
      buttonLabel: 'Shop',
      buttonUrl: '/shop',
    });
    create.mockResolvedValue(record);

    await service.createForSite({
      siteId: record.siteId,
      siteCode: 'IN',
      userId: 'user-1',
      body: {
        mediaType: 'text_card',
        mediaUrl: 'https://cdn.example.com/ignored.jpg',
        mediaPublicId: 'ignored',
        clickUrl: '/ignored',
        heading: 'HÄLLAN',
        description: 'Calm textures for daily rituals.',
        buttonLabel: 'Shop',
        buttonUrl: '/shop',
        active: true,
      },
    });

    expect(create).toHaveBeenCalledWith(record.siteId, {
      mediaType: 'TEXT_CARD',
      mediaUrl: '',
      mediaPublicId: '',
      clickUrl: '',
      heading: 'HÄLLAN',
      description: 'Calm textures for daily rituals.',
      buttonLabel: 'Shop',
      buttonUrl: '/shop',
      active: true,
    });
  });

  it('throws NotFoundError when updating a missing item', async () => {
    findByIdForSite.mockResolvedValue(null);

    await expect(
      service.updateForSite({
        siteId: 'site-1',
        siteCode: 'IN',
        userId: 'user-1',
        itemId: 'missing',
        body: {
          mediaType: 'video',
          mediaUrl: 'https://cdn.example.com/clip.mp4',
          mediaPublicId: 'gallery/clip',
          clickUrl: '',
          heading: '',
          description: '',
          buttonLabel: '',
          buttonUrl: '',
          active: true,
        },
      }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it('throws NotFoundError when deleting a missing item', async () => {
    findByIdForSite.mockResolvedValue(null);

    await expect(
      service.deleteForSite({
        siteId: 'site-1',
        siteCode: 'IN',
        userId: 'user-1',
        itemId: 'missing',
      }),
    ).rejects.toBeInstanceOf(NotFoundError);
    expect(deleteStoredCloudinaryAsset).not.toHaveBeenCalled();
  });

  it('deletes Cloudinary asset before removing a gallery item', async () => {
    const record = makeRecord({ mediaType: 'VIDEO', mediaPublicId: 'gallery/clip' });
    findByIdForSite.mockResolvedValue(record);
    deleteFn.mockResolvedValue(true);
    (deleteStoredCloudinaryAsset as jest.Mock).mockResolvedValue(undefined);

    await service.deleteForSite({
      siteId: record.siteId,
      siteCode: 'IN',
      userId: 'user-1',
      itemId: record.id,
    });

    expect(deleteStoredCloudinaryAsset).toHaveBeenCalledWith('gallery/clip', {
      resourceType: 'video',
    });
    expect(deleteFn).toHaveBeenCalledWith(record.siteId, record.id);
  });

  it('skips Cloudinary delete for text cards', async () => {
    const record = makeRecord({
      mediaType: 'TEXT_CARD',
      mediaUrl: '',
      mediaPublicId: '',
      heading: 'Card',
      description: 'Copy',
      buttonLabel: 'Go',
      buttonUrl: '/go',
    });
    findByIdForSite.mockResolvedValue(record);
    deleteFn.mockResolvedValue(true);

    await service.deleteForSite({
      siteId: record.siteId,
      siteCode: 'IN',
      userId: 'user-1',
      itemId: record.id,
    });

    expect(deleteStoredCloudinaryAsset).not.toHaveBeenCalled();
    expect(deleteFn).toHaveBeenCalledWith(record.siteId, record.id);
  });

  it('cleans up the previous Cloudinary asset when media is replaced', async () => {
    const existing = makeRecord({ mediaPublicId: 'gallery/old' });
    const updated = makeRecord({ mediaPublicId: 'gallery/new' });
    findByIdForSite.mockResolvedValue(existing);
    update.mockResolvedValue(updated);
    (deleteStoredCloudinaryAssetBestEffort as jest.Mock).mockResolvedValue(undefined);

    await service.updateForSite({
      siteId: existing.siteId,
      siteCode: 'IN',
      userId: 'user-1',
      itemId: existing.id,
      body: {
        mediaType: 'image',
        mediaUrl: 'https://cdn.example.com/new.jpg',
        mediaPublicId: 'gallery/new',
        clickUrl: '',
        heading: '',
        description: '',
        buttonLabel: '',
        buttonUrl: '',
        active: true,
      },
    });

    expect(deleteStoredCloudinaryAssetBestEffort).toHaveBeenCalledWith('gallery/old', {
      resourceType: 'image',
    });
  });
});
