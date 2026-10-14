import { ProductService, toCatalogProductDto } from '../product.service';
import type { ProductRepository } from '../product.repository';
import type { ProductRecord } from '../product.types';
import type { CategoryService } from '@/features/categories/category.service';
import { ConflictError, NotFoundError } from '@/utils/AppError';

function makeProduct(overrides: Partial<ProductRecord> = {}): ProductRecord {
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
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  };
}

describe('ProductService', () => {
  const listBySubcategory = jest.fn();
  const listActivePublicCards = jest.fn();
  const listActiveCatalogCandidates = jest.fn();
  const listPublicFacets = jest.fn();
  const listActivePublicByFlag = jest.fn();
  const findByIdForSite = jest.fn();
  const findActivePublicBySlug = jest.fn();
  const listRelatedActive = jest.fn();
  const productCodeExists = jest.fn();
  const slugExists = jest.fn();
  const create = jest.fn();
  const update = jest.fn();
  const patch = jest.fn();
  const deleteFn = jest.fn();
  const requireSubcategory = jest.fn();

  const repository = {
    listBySubcategory,
    listActivePublicCards,
    listActiveCatalogCandidates,
    listPublicFacets,
    listActivePublicByFlag,
    findByIdForSite,
    findActivePublicBySlug,
    listRelatedActive,
    productCodeExists,
    slugExists,
    create,
    update,
    patch,
    delete: deleteFn,
  } as unknown as ProductRepository;

  const categories = {
    requireSubcategory,
  } as unknown as CategoryService;

  const service = new ProductService(repository, categories);

  beforeEach(() => {
    jest.clearAllMocks();
    requireSubcategory.mockResolvedValue({
      id: '33333333-3333-3333-3333-333333333333',
      parentId: '11111111-1111-1111-1111-111111111111',
    });
    productCodeExists.mockResolvedValue(false);
    slugExists.mockResolvedValue(false);
  });

  it('maps active status onto DTO', () => {
    expect(toCatalogProductDto(makeProduct(), 'IN').active).toBe(true);
    expect(
      toCatalogProductDto(makeProduct({ status: 'DRAFT' }), 'IN').active,
    ).toBe(false);
  });

  it('lists products for a subcategory', async () => {
    const product = makeProduct();
    listBySubcategory.mockResolvedValue([product]);

    const result = await service.listForSubcategory({
      siteId: product.siteId,
      siteCode: 'IN',
      subcategoryId: product.subcategoryId!,
    });

    expect(requireSubcategory).toHaveBeenCalled();
    expect(result[0]?.productCode).toBe('VC-01');
  });

  it('preserves oldest-first product order from the repository', async () => {
    const older = makeProduct({
      id: '55555555-5555-5555-5555-555555555555',
      productCode: 'OLD-01',
      name: 'Older Product',
      slug: 'older-product',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
    });
    const newer = makeProduct({
      id: '66666666-6666-6666-6666-666666666666',
      productCode: 'NEW-01',
      name: 'Newer Product',
      slug: 'newer-product',
      createdAt: new Date('2026-10-12T12:00:00.000Z'),
    });
    listBySubcategory.mockResolvedValue([older, newer]);

    const result = await service.listForSubcategory({
      siteId: newer.siteId,
      siteCode: 'IN',
      subcategoryId: newer.subcategoryId!,
    });

    expect(result.map((row) => row.productCode)).toEqual(['OLD-01', 'NEW-01']);
  });

  it('creates a product under a subcategory', async () => {
    const product = makeProduct();
    create.mockResolvedValue(product);

    const result = await service.createForSubcategory({
      siteId: product.siteId,
      siteCode: 'IN',
      userId: 'user-1',
      subcategoryId: product.subcategoryId!,
      body: {
        productCode: 'VC-01',
        name: 'Vitamin C Serum',
        active: true,
        isFeatured: false,
        isRecent: false,
        isBestSeller: false,
      },
    });

    expect(create).toHaveBeenCalledWith(
      product.siteId,
      expect.objectContaining({
        productCode: 'VC-01',
        status: 'ACTIVE',
        subcategoryId: product.subcategoryId,
      }),
    );
    expect(result.id).toBe(product.id);
  });

  it('rejects duplicate product codes', async () => {
    productCodeExists.mockResolvedValue(true);

    await expect(
      service.createForSubcategory({
        siteId: 'site',
        siteCode: 'IN',
        userId: 'user-1',
        subcategoryId: '33333333-3333-3333-3333-333333333333',
        body: {
          productCode: 'VC-01',
          name: 'Dup',
          active: true,
          isFeatured: false,
          isRecent: false,
          isBestSeller: false,
        },
      }),
    ).rejects.toBeInstanceOf(ConflictError);
  });

  it('patches active flag', async () => {
    const product = makeProduct();
    findByIdForSite.mockResolvedValue(product);
    patch.mockResolvedValue({ ...product, status: 'DRAFT' });

    const result = await service.patchForSubcategory({
      siteId: product.siteId,
      siteCode: 'IN',
      userId: 'user-1',
      subcategoryId: product.subcategoryId!,
      productId: product.id,
      body: { active: false },
    });

    expect(result.active).toBe(false);
  });

  it('throws when product is missing on delete', async () => {
    findByIdForSite.mockResolvedValue(null);

    await expect(
      service.deleteForSubcategory({
        siteId: 'site',
        siteCode: 'IN',
        userId: 'user-1',
        subcategoryId: '33333333-3333-3333-3333-333333333333',
        productId: '55555555-5555-5555-5555-555555555555',
      }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it('returns a public product detail payload with related products', async () => {
    const product = makeProduct();
    findActivePublicBySlug.mockResolvedValue({
      ...product,
      bannerUrl: 'http://res.cloudinary.com/demo/image/upload/banner.jpg',
      bannerPublicId: 'banner',
      sizeChartUrl: null,
      sizeChartPublicId: null,
      sizes: [{ id: 's1', label: '30 ml', sortOrder: 0, active: true }],
      colors: [{ id: 'c1', name: 'Clear', hex: '#ffffff', sortOrder: 0, active: true }],
      galleryImages: [
        {
          id: 'g1',
          imageUrl: 'https://res.cloudinary.com/demo/image/upload/a.jpg',
          imagePublicId: 'a',
          isPrimary: true,
          sortOrder: 0,
        },
      ],
      videos: [],
      infoSections: [{ id: 'i1', title: 'Ingredients', body: '<p>Water</p>', sortOrder: 0 }],
      editorialReviews: [{ rating: 5 }],
      reviews: [{ rating: 3 }],
      highlights: [{ id: 'h1', text: 'Lightweight', sortOrder: 0 }],
      tax: { cgst: { toString: () => '9' }, sgst: { toString: () => '9' } },
      coupon: null,
      tags: [{ tag: { id: 't1', name: 'Serum' } }],
      variants: [
        {
          id: 'v1',
          sku: null,
          name: '30 ml / Clear',
          price: { toString: () => '1499' },
          sizeLabel: '30 ml',
          colorLabel: 'Clear',
          weightGrams: 200,
          profileImageUrl: null,
          profileImagePublicId: null,
          isActive: true,
          inventory: { quantityOnHand: 7 },
        },
      ],
    });
    listRelatedActive.mockResolvedValue([
      {
        id: '66666666-6666-6666-6666-666666666666',
        slug: 'hydra-cream',
        name: 'Hydra Cream',
        subcategory: { name: 'Serums' },
        galleryImages: [
          { imageUrl: 'https://res.cloudinary.com/demo/image/upload/b.jpg' },
        ],
        variants: [
          {
            id: 'rv1',
            price: { toString: () => '999' },
            inventory: { quantityOnHand: 5 },
          },
        ],
        editorialReviews: [{ rating: 4 }],
        reviews: [],
        coupon: null,
        tax: null,
      },
    ]);

    const result = await service.getPublicBySlug({
      siteId: product.siteId,
      siteCode: 'IN',
      slug: product.slug,
    });

    expect(result.slug).toBe('vitamin-c-serum');
    expect(result.banner?.url).toMatch(/^https:\/\//);
    expect(result.variants[0]?.quantity).toBe(7);
    expect(result.variants[0]?.price).toBe(1499);
    expect(result.variants[0]?.weightGrams).toBe(200);
    expect(result.infoSections[0]?.title).toBe('Ingredients');
    expect(result.relatedProducts).toHaveLength(1);
    expect(result.relatedProducts[0]?.slug).toBe('hydra-cream');
    expect(result.relatedProducts[0]?.categoryName).toBe('Serums');
    expect(result.relatedProducts[0]?.averageRating).toBe(4);
    expect(result.relatedProducts[0]?.reviewCount).toBe(1);
    expect(result.relatedProducts[0]?.defaultVariantId).toBe('rv1');
    expect(result.relatedProducts[0]?.quantity).toBe(5);
    expect(result.relatedProducts[0]?.coupon).toBeNull();
    expect(result.relatedProducts[0]?.tax).toBeNull();
    expect(result.averageRating).toBe(4);
    expect(result.reviewCount).toBe(2);
  });

  it('lists public product cards for the landing rail', async () => {
    listActivePublicCards.mockResolvedValue([
      {
        id: '55555555-5555-5555-5555-555555555555',
        slug: 'vitamin-c-serum',
        name: 'Vitamin C Serum',
        isFeatured: true,
        isRecent: false,
        isBestSeller: false,
        subcategory: { name: 'Serums' },
        galleryImages: [
          { imageUrl: 'http://res.cloudinary.com/demo/image/upload/a.jpg' },
        ],
        variants: [
          {
            id: 'v1',
            price: { toString: () => '1499' },
            compareAtPrice: { toString: () => '1799' },
            inventory: { quantityOnHand: 4 },
          },
        ],
        editorialReviews: [{ rating: 5 }],
        reviews: [],
        coupon: {
          couponId: 'c1',
          coupon: {
            code: 'SAVE10',
            type: 'PERCENTAGE',
            value: { toString: () => '10' },
            isActive: true,
          },
        },
      },
    ]);

    const result = await service.listPublic({
      siteId: 'site',
      siteCode: 'IN',
      limit: 15,
    });

    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.imageUrl).toMatch(/^https:\/\//);
    expect(result.items[0]?.categoryName).toBe('Serums');
    expect(result.items[0]?.averageRating).toBe(5);
    expect(result.items[0]?.defaultVariantId).toBe('v1');
    expect(result.items[0]?.compareAtPrice).toBe(1799);
    expect(result.items[0]?.coupon).toEqual({
      couponId: 'c1',
      code: 'SAVE10',
      type: 'PERCENTAGE',
      value: 10,
    });
    expect(result.meta).toEqual({
      page: 1,
      limit: 15,
      total: 1,
      totalPages: 1,
    });
  });

  it('filters, sorts, and paginates catalog products', async () => {
    listActiveCatalogCandidates.mockResolvedValue([
      {
        id: 'p1',
        slug: 'cheap',
        name: 'Cheap',
        isFeatured: false,
        isRecent: false,
        isBestSeller: false,
        subcategory: { name: 'Care' },
        galleryImages: [],
        variants: [
          {
            id: 'v1',
            price: { toString: () => '100' },
            compareAtPrice: null,
            inventory: { quantityOnHand: 2 },
          },
        ],
        editorialReviews: [{ rating: 3 }],
        reviews: [],
      },
      {
        id: 'p2',
        slug: 'pricey',
        name: 'Pricey',
        isFeatured: false,
        isRecent: false,
        isBestSeller: false,
        subcategory: { name: 'Care' },
        galleryImages: [],
        variants: [
          {
            id: 'v2',
            price: { toString: () => '500' },
            compareAtPrice: null,
            inventory: { quantityOnHand: 0 },
          },
        ],
        editorialReviews: [{ rating: 5 }],
        reviews: [],
      },
      {
        id: 'p3',
        slug: 'mid',
        name: 'Mid',
        isFeatured: false,
        isRecent: false,
        isBestSeller: false,
        subcategory: { name: 'Care' },
        galleryImages: [],
        variants: [
          {
            id: 'v3',
            price: { toString: () => '200' },
            compareAtPrice: null,
            inventory: { quantityOnHand: 5 },
          },
        ],
        editorialReviews: [{ rating: 4 }],
        reviews: [],
      },
    ]);

    const result = await service.listPublic({
      siteId: 'site',
      siteCode: 'IN',
      limit: 1,
      page: 1,
      availability: 'in_stock',
      priceMin: 100,
      priceMax: 300,
      sort: 'price_desc',
    });

    expect(result.meta.total).toBe(2);
    expect(result.meta.totalPages).toBe(2);
    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.slug).toBe('mid');
  });

  it('returns public facets with category counts and price range', async () => {
    listPublicFacets.mockResolvedValue({
      roots: [
        {
          id: 'root-1',
          name: 'Skincare',
          slug: 'skincare',
          children: [
            {
              id: 'child-1',
              catalogProducts: [
                {
                  id: 'p1',
                  galleryImages: [
                    { imageUrl: 'http://res.cloudinary.com/demo/image/upload/a.jpg' },
                  ],
                },
                { id: 'p2', galleryImages: [] },
              ],
            },
          ],
        },
      ],
      priceRows: [
        { productId: 'p1', price: { toString: () => '100' } },
        { productId: 'p1', price: { toString: () => '999' } },
        { productId: 'p2', price: { toString: () => '250' } },
      ],
    });

    const result = await service.getPublicFacets({
      siteId: 'site',
      siteCode: 'IN',
    });

    expect(result.categories[0]?.productCount).toBe(2);
    expect(result.categories[0]?.imageUrl).toMatch(/^https:\/\//);
    expect(result.price).toEqual({ min: 100, max: 250 });
  });

  it('returns highlight buckets by landing flags', async () => {
    listActivePublicByFlag.mockImplementation(
      async (
        _siteId: string,
        flag: 'isRecent' | 'isFeatured' | 'isBestSeller',
      ) => {
        if (flag === 'isFeatured') {
          return [
            {
              id: 'f1',
              slug: 'featured',
              name: 'Featured',
              isFeatured: true,
              isRecent: false,
              isBestSeller: false,
              subcategory: { name: 'Care' },
              galleryImages: [],
              variants: [
                {
                  id: 'v1',
                  price: 150,
                  compareAtPrice: null,
                  inventory: { quantityOnHand: 10 },
                },
              ],
              editorialReviews: [],
              reviews: [],
              coupon: {
                couponId: 'c1',
                coupon: {
                  code: 'SAVE50',
                  type: 'FIXED_AMOUNT',
                  value: 50,
                  isActive: true,
                },
              },
              tax: null,
            },
          ];
        }
        return [];
      },
    );

    const result = await service.listPublicHighlights({
      siteId: 'site',
      siteCode: 'IN',
    });

    expect(result.featured).toHaveLength(1);
    expect(result.featured[0]?.coupon).toEqual({
      couponId: 'c1',
      code: 'SAVE50',
      type: 'FIXED_AMOUNT',
      value: 50,
    });
    expect(result.recent).toEqual([]);
    expect(result.bestSellers).toEqual([]);
  });

  it('throws when public product slug is missing or inactive', async () => {
    findActivePublicBySlug.mockResolvedValue(null);

    await expect(
      service.getPublicBySlug({
        siteId: 'site',
        siteCode: 'IN',
        slug: 'missing',
      }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});
