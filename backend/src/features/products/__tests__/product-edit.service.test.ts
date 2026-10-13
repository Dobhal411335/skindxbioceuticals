import { NotFoundError, ValidationError } from '@/utils/AppError';
import { ProductEditService } from '../product-edit.service';
import { deleteStoredCloudinaryAssetBestEffort } from '@/lib/cloudinary';

jest.mock('@/lib/cloudinary', () => ({
  deleteStoredCloudinaryAssetBestEffort: jest.fn(),
}));

const productRepository = {
  findByIdForSite: jest.fn(),
};

const productEditRepository = {
  findEditPayload: jest.fn(),
  listCatalogColors: jest.fn(),
  listCatalogTags: jest.fn(),
  listActiveCoupons: jest.fn(),
  replaceSizes: jest.fn(),
  replaceColors: jest.fn(),
  replaceVariants: jest.fn(),
  replaceCoupon: jest.fn(),
  upsertTax: jest.fn(),
  replaceGallery: jest.fn(),
  replaceVideos: jest.fn(),
  updateDescription: jest.fn(),
  replaceInfoSections: jest.fn(),
  createEditorialReview: jest.fn(),
  updateEditorialReview: jest.fn(),
  deleteEditorialReview: jest.fn(),
  replaceTags: jest.fn(),
  replaceHighlights: jest.fn(),
  findCouponById: jest.fn(),
  createCatalogColor: jest.fn(),
  createCatalogTag: jest.fn(),
};

function emptyEditRecord(overrides: Record<string, unknown> = {}) {
  return {
    id: '55555555-5555-5555-5555-555555555555',
    siteId: '22222222-2222-2222-2222-222222222222',
    subcategoryId: '33333333-3333-3333-3333-333333333333',
    productCode: 'VC-01',
    name: 'Vitamin C Serum',
    slug: 'vitamin-c-serum',
    description: null,
    status: 'ACTIVE',
    isFeatured: false,
    isRecent: false,
    isBestSeller: false,
    sizeChartUrl: null,
    sizeChartPublicId: null,
    bannerUrl: null,
    bannerPublicId: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    sizes: [],
    colors: [],
    galleryImages: [],
    videos: [],
    infoSections: [],
    editorialReviews: [],
    highlights: [],
    tax: null,
    coupon: null,
    tags: [],
    variants: [],
    ...overrides,
  };
}

describe('ProductEditService', () => {
  const service = new ProductEditService(
    productRepository as never,
    productEditRepository as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    productRepository.findByIdForSite.mockResolvedValue({
      id: '55555555-5555-5555-5555-555555555555',
      siteId: '22222222-2222-2222-2222-222222222222',
      subcategoryId: '33333333-3333-3333-3333-333333333333',
      productCode: 'VC-01',
      name: 'Vitamin C Serum',
      slug: 'vitamin-c-serum',
      description: null,
      status: 'ACTIVE',
      isFeatured: false,
      isRecent: false,
      isBestSeller: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    productEditRepository.findEditPayload.mockResolvedValue(emptyEditRecord());
    productEditRepository.listCatalogColors.mockResolvedValue([]);
    productEditRepository.listCatalogTags.mockResolvedValue([]);
    productEditRepository.listActiveCoupons.mockResolvedValue([]);
  });

  it('throws when product is missing', async () => {
    productRepository.findByIdForSite.mockResolvedValue(null);
    await expect(
      service.updateDescription({
        siteId: 'site',
        siteCode: 'IN',
        userId: 'user',
        productId: '55555555-5555-5555-5555-555555555555',
        body: { description: 'Overview' },
      }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it('updates sizes and cleans previous chart asset', async () => {
    productEditRepository.findEditPayload
      .mockResolvedValueOnce(
        emptyEditRecord({ sizeChartPublicId: 'products/old-chart' }),
      )
      .mockResolvedValue(emptyEditRecord());

    await service.updateSizes({
      siteId: 'site',
      siteCode: 'IN',
      userId: 'user',
      productId: '55555555-5555-5555-5555-555555555555',
      body: {
        sizeChartUrl: 'https://res.cloudinary.com/demo/chart.png',
        sizeChartPublicId: 'products/new-chart',
        sizes: [{ label: '30ml', active: true }],
      },
    });

    expect(productEditRepository.replaceSizes).toHaveBeenCalled();
    expect(deleteStoredCloudinaryAssetBestEffort).toHaveBeenCalledWith(
      'products/old-chart',
    );
  });

  it('rejects inactive coupon assignment', async () => {
    productEditRepository.findCouponById.mockResolvedValue({
      id: '77777777-7777-7777-7777-777777777777',
      isActive: false,
    });

    await expect(
      service.updateCoupon({
        siteId: 'site',
        siteCode: 'IN',
        userId: 'user',
        productId: '55555555-5555-5555-5555-555555555555',
        body: { couponId: '77777777-7777-7777-7777-777777777777' },
      }),
    ).rejects.toBeInstanceOf(ValidationError);
    expect(productEditRepository.findCouponById).toHaveBeenCalledWith(
      'site',
      '77777777-7777-7777-7777-777777777777',
    );
  });

  it('returns edit payload with product core fields', async () => {
    const result = await service.getEditPayload({
      siteId: 'site',
      siteCode: 'IN',
      productId: '55555555-5555-5555-5555-555555555555',
    });
    expect(result.product.productCode).toBe('VC-01');
    expect(result.sizes).toEqual([]);
    expect(result.banner).toBeNull();
    expect(productEditRepository.listActiveCoupons).toHaveBeenCalledWith('site');
  });

  it('updates gallery and cleans removed banner/gallery assets', async () => {
    productEditRepository.replaceGallery.mockResolvedValue({
      removedPublicIds: ['products/old-banner', 'products/old-g1'],
    });
    productEditRepository.findEditPayload.mockResolvedValue(emptyEditRecord());

    await service.updateGallery({
      siteId: 'site',
      siteCode: 'IN',
      userId: 'user',
      productId: '55555555-5555-5555-5555-555555555555',
      body: {
        bannerUrl: 'http://res.cloudinary.com/demo/image/upload/banner.png',
        bannerPublicId: 'products/new-banner',
        images: [
          {
            imageUrl: 'http://res.cloudinary.com/demo/image/upload/g1.png',
            imagePublicId: 'products/g1',
            isPrimary: true,
          },
        ],
      },
    });

    expect(productEditRepository.replaceGallery).toHaveBeenCalledWith(
      '55555555-5555-5555-5555-555555555555',
      expect.objectContaining({
        bannerUrl: 'https://res.cloudinary.com/demo/image/upload/banner.png',
        bannerPublicId: 'products/new-banner',
        images: [
          expect.objectContaining({
            imageUrl: 'https://res.cloudinary.com/demo/image/upload/g1.png',
          }),
        ],
      }),
    );
    expect(deleteStoredCloudinaryAssetBestEffort).toHaveBeenCalledWith(
      'products/old-banner',
    );
    expect(deleteStoredCloudinaryAssetBestEffort).toHaveBeenCalledWith(
      'products/old-g1',
    );
  });

  it('rejects variant size labels not configured on the product', async () => {
    productEditRepository.findEditPayload.mockResolvedValue(
      emptyEditRecord({
        sizes: [{ id: 'size-1', label: '30ml', sortOrder: 0, active: true }],
        colors: [{ id: 'color-1', colorId: null, name: 'Blue', hex: null, sortOrder: 0, active: true }],
      }),
    );

    await expect(
      service.updateVariants({
        siteId: 'site',
        siteCode: 'IN',
        userId: 'user',
        productId: '55555555-5555-5555-5555-555555555555',
        body: {
          variants: [
            {
              sizeLabel: 'XXL',
              colorLabel: 'Blue',
              price: 499,
              quantity: 10,
              isActive: true,
              subImages: [],
            },
          ],
        },
      }),
    ).rejects.toBeInstanceOf(ValidationError);

    expect(productEditRepository.replaceVariants).not.toHaveBeenCalled();
  });

  it('rejects variant color labels not configured on the product', async () => {
    productEditRepository.findEditPayload.mockResolvedValue(
      emptyEditRecord({
        sizes: [{ id: 'size-1', label: '30ml', sortOrder: 0, active: true }],
        colors: [{ id: 'color-1', colorId: null, name: 'Blue', hex: null, sortOrder: 0, active: true }],
      }),
    );

    await expect(
      service.updateVariants({
        siteId: 'site',
        siteCode: 'IN',
        userId: 'user',
        productId: '55555555-5555-5555-5555-555555555555',
        body: {
          variants: [
            {
              sizeLabel: '30ml',
              colorLabel: 'Neon',
              price: 499,
              quantity: 10,
              isActive: true,
              subImages: [],
            },
          ],
        },
      }),
    ).rejects.toBeInstanceOf(ValidationError);

    expect(productEditRepository.replaceVariants).not.toHaveBeenCalled();
  });

  it('accepts a base-price variant with no size or color labels', async () => {
    productEditRepository.findEditPayload
      .mockResolvedValueOnce(emptyEditRecord({ sizes: [], colors: [] }))
      .mockResolvedValue(emptyEditRecord());
    productEditRepository.replaceVariants.mockResolvedValue({ removedPublicIds: [] });

    await service.updateVariants({
      siteId: 'site',
      siteCode: 'IN',
      userId: 'user',
      productId: '55555555-5555-5555-5555-555555555555',
      body: {
        variants: [
          {
            sizeLabel: null,
            colorLabel: null,
            price: 899,
            quantity: 25,
            isActive: true,
            subImages: [],
          },
        ],
      },
    });

    expect(productEditRepository.replaceVariants).toHaveBeenCalledWith(
      '55555555-5555-5555-5555-555555555555',
      expect.objectContaining({
        variants: [
          expect.objectContaining({
            sizeLabel: null,
            colorLabel: null,
            price: 899,
            quantity: 25,
          }),
        ],
      }),
    );
  });

  it('updates variants when size and color labels match product config', async () => {
    productEditRepository.findEditPayload
      .mockResolvedValueOnce(
        emptyEditRecord({
          sizes: [{ id: 'size-1', label: '30ml', sortOrder: 0, active: true }],
          colors: [
            { id: 'color-1', colorId: null, name: 'Blue', hex: null, sortOrder: 0, active: true },
          ],
        }),
      )
      .mockResolvedValue(emptyEditRecord());
    productEditRepository.replaceVariants.mockResolvedValue({ removedPublicIds: [] });

    await service.updateVariants({
      siteId: 'site',
      siteCode: 'IN',
      userId: 'user',
      productId: '55555555-5555-5555-5555-555555555555',
      body: {
        variants: [
          {
            sizeLabel: '30ml',
            colorLabel: 'Blue',
            price: 499,
            quantity: 10,
            isActive: true,
            subImages: [],
          },
        ],
      },
    });

    expect(productEditRepository.replaceVariants).toHaveBeenCalledWith(
      '55555555-5555-5555-5555-555555555555',
      expect.objectContaining({
        variants: [
          expect.objectContaining({
            sizeLabel: '30ml',
            colorLabel: 'Blue',
            price: 499,
            quantity: 10,
          }),
        ],
      }),
    );
  });

  it('accepts two variants with the same size and color labels', async () => {
    productEditRepository.findEditPayload
      .mockResolvedValueOnce(
        emptyEditRecord({
          sizes: [{ id: 'size-1', label: 'S', sortOrder: 0, active: true }],
          colors: [
            { id: 'color-1', colorId: null, name: 'Beige', hex: null, sortOrder: 0, active: true },
          ],
        }),
      )
      .mockResolvedValue(emptyEditRecord());
    productEditRepository.replaceVariants.mockResolvedValue({ removedPublicIds: [] });

    await service.updateVariants({
      siteId: 'site',
      siteCode: 'IN',
      userId: 'user',
      productId: '55555555-5555-5555-5555-555555555555',
      body: {
        variants: [
          {
            sizeLabel: 'S',
            colorLabel: 'Beige',
            price: 499,
            quantity: 10,
            isActive: true,
            subImages: [],
          },
          {
            sizeLabel: 'S',
            colorLabel: 'Beige',
            price: 599,
            quantity: 5,
            isActive: true,
            subImages: [],
          },
        ],
      },
    });

    expect(productEditRepository.replaceVariants).toHaveBeenCalledWith(
      '55555555-5555-5555-5555-555555555555',
      expect.objectContaining({
        variants: [
          expect.objectContaining({
            sizeLabel: 'S',
            colorLabel: 'Beige',
            price: 499,
            quantity: 10,
          }),
          expect.objectContaining({
            sizeLabel: 'S',
            colorLabel: 'Beige',
            price: 599,
            quantity: 5,
          }),
        ],
      }),
    );
  });

  it('deletes editorial review and cleans Cloudinary image when present', async () => {
    productEditRepository.deleteEditorialReview.mockResolvedValue({
      id: '99999999-9999-9999-9999-999999999999',
      imagePublicId: 'products/review-photo',
    });
    productEditRepository.findEditPayload.mockResolvedValue(emptyEditRecord());

    await service.deleteEditorialReview({
      siteId: 'site',
      siteCode: 'IN',
      userId: 'user',
      productId: '55555555-5555-5555-5555-555555555555',
      reviewId: '99999999-9999-9999-9999-999999999999',
    });

    expect(productEditRepository.deleteEditorialReview).toHaveBeenCalledWith(
      '55555555-5555-5555-5555-555555555555',
      '99999999-9999-9999-9999-999999999999',
    );
    expect(deleteStoredCloudinaryAssetBestEffort).toHaveBeenCalledWith(
      'products/review-photo',
    );
  });

  it('accepts HTML overview description payloads', async () => {
    productEditRepository.findEditPayload.mockResolvedValue(emptyEditRecord());
    await service.updateDescription({
      siteId: 'site',
      siteCode: 'IN',
      userId: 'user',
      productId: '55555555-5555-5555-5555-555555555555',
      body: { description: '<h2>Overview</h2><p><strong>Hydrating</strong> serum.</p>' },
    });
    expect(productEditRepository.updateDescription).toHaveBeenCalledWith(
      '55555555-5555-5555-5555-555555555555',
      {
        description: '<h2>Overview</h2><p><strong>Hydrating</strong> serum.</p>',
      },
    );
  });

  it('creates a site-scoped catalog tag', async () => {
    productEditRepository.createCatalogTag.mockResolvedValue({
      id: '88888888-8888-8888-8888-888888888888',
      name: 'Hydrating',
    });

    const result = await service.createCatalogTag({
      siteId: 'site',
      siteCode: 'IN',
      userId: 'user',
      body: { name: 'Hydrating' },
    });

    expect(result).toEqual({
      id: '88888888-8888-8888-8888-888888888888',
      name: 'Hydrating',
    });
    expect(productEditRepository.createCatalogTag).toHaveBeenCalledWith('site', {
      name: 'Hydrating',
    });
  });
});
