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
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  };
}

describe('ProductService', () => {
  const listBySubcategory = jest.fn();
  const findByIdForSite = jest.fn();
  const productCodeExists = jest.fn();
  const slugExists = jest.fn();
  const create = jest.fn();
  const update = jest.fn();
  const patch = jest.fn();
  const deleteFn = jest.fn();
  const requireSubcategory = jest.fn();

  const repository = {
    listBySubcategory,
    findByIdForSite,
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
        body: { productCode: 'VC-01', name: 'Dup', active: true },
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
});
