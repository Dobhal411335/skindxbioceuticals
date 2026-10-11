import { SocialPostsService, toSocialPostDto } from '../social-posts.service';
import type { SocialPostsRepository } from '../social-posts.repository';
import type { SocialPostRecord } from '../social-posts.types';
import { NotFoundError } from '@/utils/AppError';
import {
  deleteStoredCloudinaryAsset,
  deleteStoredCloudinaryAssetBestEffort,
} from '@/lib/cloudinary';

jest.mock('@/lib/cloudinary', () => ({
  deleteStoredCloudinaryAsset: jest.fn(),
  deleteStoredCloudinaryAssetBestEffort: jest.fn(),
}));

function makeRecord(overrides: Partial<SocialPostRecord> = {}): SocialPostRecord {
  return {
    id: '11111111-1111-1111-1111-111111111111',
    siteId: '22222222-2222-2222-2222-222222222222',
    postType: 'INSTAGRAM',
    imageUrl: 'https://cdn.example.com/post.jpg',
    imagePublicId: 'social/post',
    postUrl: 'https://www.instagram.com/p/abc/',
    active: true,
    order: 1,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  };
}

describe('SocialPostsService', () => {
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
  } as unknown as SocialPostsRepository;

  const service = new SocialPostsService(repository);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('lists and maps posts for a site', async () => {
    const record = makeRecord();
    listBySiteId.mockResolvedValue([record]);

    const result = await service.listForSite(record.siteId, 'IN', 'instagram');

    expect(listBySiteId).toHaveBeenCalledWith(record.siteId, 'INSTAGRAM');
    expect(result).toEqual([toSocialPostDto(record, 'IN')]);
    expect(result[0]?.postType).toBe('instagram');
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
        postType: 'instagram',
        imageUrl: record.imageUrl,
        imagePublicId: record.imagePublicId,
        postUrl: record.postUrl,
        active: true,
      },
    });

    expect(nextOrder).toHaveBeenCalledWith(record.siteId, 'INSTAGRAM');
    expect(create).toHaveBeenCalledWith(record.siteId, {
      postType: 'INSTAGRAM',
      imageUrl: record.imageUrl,
      imagePublicId: record.imagePublicId,
      postUrl: record.postUrl,
      active: true,
      order: 3,
    });
    expect(dto.id).toBe(record.id);
  });

  it('throws NotFoundError when updating a missing post', async () => {
    findByIdForSite.mockResolvedValue(null);

    await expect(
      service.updateForSite({
        siteId: 'site-1',
        siteCode: 'IN',
        userId: 'user-1',
        postId: 'missing',
        body: {
          postType: 'facebook',
          imageUrl: 'https://cdn.example.com/fb.jpg',
          imagePublicId: 'social/fb',
          postUrl: 'https://www.facebook.com/posts/1',
          active: true,
        },
      }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it('patches active/order and deletes Cloudinary asset with the post', async () => {
    const record = makeRecord({ active: false, order: 5 });
    patch.mockResolvedValue(record);
    findByIdForSite.mockResolvedValue(record);
    deleteFn.mockResolvedValue(true);
    (deleteStoredCloudinaryAsset as jest.Mock).mockResolvedValue(undefined);

    const patched = await service.patchForSite({
      siteId: record.siteId,
      siteCode: 'COM',
      userId: 'user-1',
      postId: record.id,
      body: { active: false, order: 5 },
    });
    expect(patched.active).toBe(false);
    expect(patched.order).toBe(5);

    await service.deleteForSite({
      siteId: record.siteId,
      siteCode: 'COM',
      userId: 'user-1',
      postId: record.id,
    });
    expect(deleteStoredCloudinaryAsset).toHaveBeenCalledWith(record.imagePublicId);
    expect(deleteFn).toHaveBeenCalledWith(record.siteId, record.id);
  });

  it('cleans up the previous Cloudinary asset when the image is replaced', async () => {
    const existing = makeRecord({ imagePublicId: 'social/old' });
    const updated = makeRecord({ imagePublicId: 'social/new' });
    findByIdForSite.mockResolvedValue(existing);
    update.mockResolvedValue(updated);
    (deleteStoredCloudinaryAssetBestEffort as jest.Mock).mockResolvedValue(undefined);

    await service.updateForSite({
      siteId: existing.siteId,
      siteCode: 'IN',
      userId: 'user-1',
      postId: existing.id,
      body: {
        postType: 'instagram',
        imageUrl: 'https://cdn.example.com/new.jpg',
        imagePublicId: 'social/new',
        postUrl: existing.postUrl,
        active: true,
      },
    });

    expect(deleteStoredCloudinaryAssetBestEffort).toHaveBeenCalledWith('social/old');
  });
});
