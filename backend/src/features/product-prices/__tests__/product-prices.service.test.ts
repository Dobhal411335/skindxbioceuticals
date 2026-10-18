import { NotFoundError } from '@/utils/AppError';
import { applyPercentToAmount, ProductPricesService } from '../product-prices.service';

const repository = {
  listForPrices: jest.fn(),
  countForPrices: jest.fn(),
  listAllMatching: jest.fn(),
  findRootCategoryForSite: jest.fn(),
  findSubcategoryUnderParent: jest.fn(),
  findProductForSite: jest.fn(),
  applyVariantPriceUpdates: jest.fn(),
};

describe('applyPercentToAmount', () => {
  it('increases and decreases with 2-decimal rounding', () => {
    expect(applyPercentToAmount(100, 10)).toBe(110);
    expect(applyPercentToAmount(100, -10)).toBe(90);
    expect(applyPercentToAmount(99.99, 10)).toBe(109.99);
    expect(applyPercentToAmount(33.33, 10)).toBe(36.66);
  });
});

describe('ProductPricesService', () => {
  const service = new ProductPricesService(repository as never);
  const siteId = '22222222-2222-2222-2222-222222222222';
  const categoryId = '33333333-3333-3333-3333-333333333333';
  const productId = '55555555-5555-5555-5555-555555555555';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('lists products with projected prices when percent is provided', async () => {
    repository.findRootCategoryForSite.mockResolvedValue({ id: categoryId });
    repository.listForPrices.mockResolvedValue([
      {
        id: productId,
        productCode: 'VC-01',
        name: 'Vitamin C',
        status: 'ACTIVE',
        subcategoryId: 'sub-1',
        bannerUrl: null,
        updatedAt: new Date('2026-01-01T00:00:00.000Z'),
        subcategory: {
          id: 'sub-1',
          name: 'Serums',
          parentId: categoryId,
          parent: { id: categoryId, name: 'Skincare' },
        },
        galleryImages: [],
        variants: [
          {
            id: 'v1',
            name: 'Default',
            price: 200,
            compareAtPrice: 250,
            vendorPrice: 100,
            currency: 'INR',
            sizeLabel: null,
            colorLabel: null,
            isActive: true,
            profileImageUrl: null,
          },
        ],
      },
    ]);
    repository.countForPrices.mockResolvedValue(1);

    const result = await service.listForAdmin({
      siteId,
      siteCode: 'IN',
      query: {
        status: 'all',
        page: 1,
        limit: 10,
        categoryId,
        percent: 10,
      },
    });

    expect(result.items[0]?.price).toBe(200);
    expect(result.items[0]?.updatedPrice).toBe(220);
    expect(result.items[0]?.updatedVendorPrice).toBe(110);
    expect(result.items[0]?.variants[0]?.updatedCompareAtPrice).toBe(275);
    expect(result.items[0]?.isSimpleOffer).toBe(true);
  });

  it('applies percent to all variants under a category scope', async () => {
    repository.findRootCategoryForSite.mockResolvedValue({ id: categoryId });
    const row = {
      id: productId,
      productCode: 'VC-01',
      name: 'Vitamin C',
      status: 'ACTIVE',
      subcategoryId: 'sub-1',
      bannerUrl: null,
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
      subcategory: {
        id: 'sub-1',
        name: 'Serums',
        parentId: categoryId,
        parent: { id: categoryId, name: 'Skincare' },
      },
      galleryImages: [],
      variants: [
        {
          id: 'v1',
          name: 'Default',
          price: 100,
          compareAtPrice: null,
          vendorPrice: 40,
          currency: 'INR',
          sizeLabel: null,
          colorLabel: null,
          isActive: true,
          profileImageUrl: null,
        },
      ],
    };
    repository.listAllMatching.mockResolvedValueOnce([row]).mockResolvedValueOnce([
      {
        ...row,
        variants: [
          {
            ...row.variants[0]!,
            price: 110,
            vendorPrice: 44,
          },
        ],
      },
    ]);
    repository.applyVariantPriceUpdates.mockResolvedValue(undefined);

    const result = await service.applyPercent({
      siteId,
      siteCode: 'IN',
      userId: 'user-1',
      body: { percent: 10, categoryId, status: 'all' },
    });

    expect(repository.applyVariantPriceUpdates).toHaveBeenCalledWith([
      {
        id: 'v1',
        price: 110,
        vendorPrice: 44,
        compareAtPrice: null,
      },
    ]);
    expect(result.productsUpdated).toBe(1);
    expect(result.variantsUpdated).toBe(1);
    expect(result.items[0]?.price).toBe(110);
  });

  it('rejects apply when product is outside the site', async () => {
    repository.findProductForSite.mockResolvedValue(null);

    await expect(
      service.applyPercent({
        siteId,
        siteCode: 'IN',
        userId: 'user-1',
        body: {
          percent: 5,
          productId: '99999999-9999-9999-9999-999999999999',
          status: 'all',
        },
      }),
    ).rejects.toBeInstanceOf(NotFoundError);

    expect(repository.applyVariantPriceUpdates).not.toHaveBeenCalled();
  });

  it('rejects list when category is missing for the site', async () => {
    repository.findRootCategoryForSite.mockResolvedValue(null);

    await expect(
      service.listForAdmin({
        siteId,
        siteCode: 'IN',
        query: {
          status: 'all',
          page: 1,
          limit: 10,
          categoryId,
        },
      }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});
