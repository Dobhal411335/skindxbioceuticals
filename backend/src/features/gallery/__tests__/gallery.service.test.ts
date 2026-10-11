import { GalleryService, toGalleryItemDto } from '../gallery.service';
import type { GalleryRepository } from '../gallery.repository';
import type { GalleryItemRecord } from '../gallery.types';
import { NotFoundError } from '@/utils/AppError';

function makeRecord(overrides: Partial<GalleryItemRecord> = {}): GalleryItemRecord {
  return {
    id: '11111111-1111-1111-1111-111111111111',
    siteId: '22222222-2222-2222-2222-222222222222',
    mediaType: 'IMAGE',
    mediaUrl: 'https://cdn.example.com/gallery.jpg',
    mediaPublicId: 'gallery/item',
    title: 'Lookbook',
    caption: 'Skin care moment',
    active: true,
    order: 1,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  };
}

describe('GalleryService', () => {
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
  } as unknown as GalleryRepository;

  const service = new GalleryService(repository);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('lists and maps items for a site', async () => {
    const record = makeRecord();
    listBySiteId.mockResolvedValue([record]);

    const result = await service.listForSite(record.siteId, 'IN', 'image');

    expect(listBySiteId).toHaveBeenCalledWith(record.siteId, 'IMAGE');
    expect(result).toEqual([toGalleryItemDto(record, 'IN')]);
    expect(result[0]?.mediaType).toBe('image');
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

  it('creates using siteId from context and next order when omitted', async () => {
    const record = makeRecord();
    nextOrder.mockResolvedValue(3);
    create.mockResolvedValue(record);

    const dto = await service.createForSite({
      siteId: record.siteId,
      siteCode: 'IN',
      userId: 'user-1',
      body: {
        mediaType: 'image',
        mediaUrl: record.mediaUrl,
        mediaPublicId: record.mediaPublicId,
        title: record.title,
        caption: record.caption,
        active: true,
      },
    });

    expect(nextOrder).toHaveBeenCalledWith(record.siteId);
    expect(create).toHaveBeenCalledWith(record.siteId, {
      mediaType: 'IMAGE',
      mediaUrl: record.mediaUrl,
      mediaPublicId: record.mediaPublicId,
      title: record.title,
      caption: record.caption,
      active: true,
      order: 3,
    });
    expect(dto.id).toBe(record.id);
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
          title: '',
          caption: '',
          active: true,
        },
      }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it('throws NotFoundError when deleting a missing item', async () => {
    deleteFn.mockResolvedValue(false);

    await expect(
      service.deleteForSite({
        siteId: 'site-1',
        siteCode: 'IN',
        userId: 'user-1',
        itemId: 'missing',
      }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});
