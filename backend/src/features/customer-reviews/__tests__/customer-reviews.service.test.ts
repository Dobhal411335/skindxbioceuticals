import { CustomerReviewsService, toCustomerReviewDto } from '../customer-reviews.service';
import type { CustomerReviewsRepository } from '../customer-reviews.repository';
import type { CustomerReviewRecord } from '../customer-reviews.types';
import { NotFoundError } from '@/utils/AppError';
import {
  deleteStoredCloudinaryAsset,
  deleteStoredCloudinaryAssetBestEffort,
} from '@/lib/cloudinary';

jest.mock('@/lib/cloudinary', () => ({
  deleteStoredCloudinaryAsset: jest.fn(),
  deleteStoredCloudinaryAssetBestEffort: jest.fn(),
}));

function makeRecord(overrides: Partial<CustomerReviewRecord> = {}): CustomerReviewRecord {
  return {
    id: '11111111-1111-1111-1111-111111111111',
    siteId: '22222222-2222-2222-2222-222222222222',
    customerName: 'Candace V. Miller',
    designation: 'From Florida',
    description: 'A clear, helpful shopping experience.',
    rating: 5,
    imageUrl: 'https://cdn.example.com/avatar.jpg',
    imagePublicId: 'reviews/avatar',
    active: true,
    order: 1,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  };
}

describe('CustomerReviewsService', () => {
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
  } as unknown as CustomerReviewsRepository;

  const service = new CustomerReviewsService(repository);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('lists and maps reviews for a site', async () => {
    const record = makeRecord();
    listBySiteId.mockResolvedValue([record]);

    const result = await service.listForSite(record.siteId, 'IN');

    expect(listBySiteId).toHaveBeenCalledWith(record.siteId);
    expect(result).toEqual([toCustomerReviewDto(record, 'IN')]);
    expect(result[0]?.rating).toBe(5);
  });

  it('prefers https Cloudinary URLs when mapping', async () => {
    const record = makeRecord({
      imageUrl: 'http://res.cloudinary.com/demo/image/upload/v1/avatar.jpg',
    });
    listActiveBySiteId.mockResolvedValue([record]);

    const result = await service.listActiveForSite(record.siteId, 'IN');
    expect(result[0]?.imageUrl).toBe(
      'https://res.cloudinary.com/demo/image/upload/v1/avatar.jpg',
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
        customerName: record.customerName,
        designation: record.designation,
        description: record.description,
        rating: 5,
        imageUrl: record.imageUrl,
        imagePublicId: record.imagePublicId,
        active: true,
      },
    });

    expect(create).toHaveBeenCalledWith(record.siteId, {
      customerName: record.customerName,
      designation: record.designation,
      description: record.description,
      rating: 5,
      imageUrl: record.imageUrl,
      imagePublicId: record.imagePublicId,
      active: true,
      order: 3,
    });
    expect(dto.id).toBe(record.id);
  });

  it('throws NotFoundError when updating a missing review', async () => {
    findByIdForSite.mockResolvedValue(null);

    await expect(
      service.updateForSite({
        siteId: 'site-1',
        siteCode: 'IN',
        userId: 'user-1',
        reviewId: 'missing',
        body: {
          customerName: 'Name',
          designation: 'From Texas',
          description: 'Great storefront layout.',
          rating: 4,
          imageUrl: 'https://cdn.example.com/a.jpg',
          imagePublicId: 'reviews/a',
          active: true,
        },
      }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it('throws NotFoundError when deleting a missing review', async () => {
    findByIdForSite.mockResolvedValue(null);

    await expect(
      service.deleteForSite({
        siteId: 'site-1',
        siteCode: 'IN',
        userId: 'user-1',
        reviewId: 'missing',
      }),
    ).rejects.toBeInstanceOf(NotFoundError);
    expect(deleteStoredCloudinaryAsset).not.toHaveBeenCalled();
  });

  it('deletes Cloudinary asset before removing a review', async () => {
    const record = makeRecord({ imagePublicId: 'reviews/avatar' });
    findByIdForSite.mockResolvedValue(record);
    deleteFn.mockResolvedValue(true);
    (deleteStoredCloudinaryAsset as jest.Mock).mockResolvedValue(undefined);

    await service.deleteForSite({
      siteId: record.siteId,
      siteCode: 'IN',
      userId: 'user-1',
      reviewId: record.id,
    });

    expect(deleteStoredCloudinaryAsset).toHaveBeenCalledWith('reviews/avatar');
    expect(deleteFn).toHaveBeenCalledWith(record.siteId, record.id);
  });

  it('cleans up the previous Cloudinary asset when image is replaced', async () => {
    const existing = makeRecord({ imagePublicId: 'reviews/old' });
    const updated = makeRecord({ imagePublicId: 'reviews/new' });
    findByIdForSite.mockResolvedValue(existing);
    update.mockResolvedValue(updated);
    (deleteStoredCloudinaryAssetBestEffort as jest.Mock).mockResolvedValue(undefined);

    await service.updateForSite({
      siteId: existing.siteId,
      siteCode: 'IN',
      userId: 'user-1',
      reviewId: existing.id,
      body: {
        customerName: existing.customerName,
        designation: existing.designation,
        description: existing.description,
        rating: 5,
        imageUrl: 'https://cdn.example.com/new.jpg',
        imagePublicId: 'reviews/new',
        active: true,
      },
    });

    expect(deleteStoredCloudinaryAssetBestEffort).toHaveBeenCalledWith('reviews/old');
  });
});
