import {
  CategoryService,
  slugifyName,
  toCategoryDto,
} from '../category.service';
import type { CategoryRepository } from '../category.repository';
import type { CategoryRecord } from '../category.types';
import type { ProductRepository } from '@/features/products/product.repository';
import { ConflictError, NotFoundError } from '@/utils/AppError';
import {
  deleteStoredCloudinaryAsset,
  deleteStoredCloudinaryAssetBestEffort,
} from '@/lib/cloudinary';

jest.mock('@/lib/cloudinary', () => ({
  deleteStoredCloudinaryAsset: jest.fn(),
  deleteStoredCloudinaryAssetBestEffort: jest.fn(),
}));

function makeCategory(overrides: Partial<CategoryRecord> = {}): CategoryRecord {
  return {
    id: '11111111-1111-1111-1111-111111111111',
    siteId: '22222222-2222-2222-2222-222222222222',
    name: 'Serums',
    slug: 'serums',
    description: null,
    parentId: null,
    bannerUrl: 'https://cdn.example.com/banner.jpg',
    bannerPublicId: 'categories/banner',
    isActive: true,
    sortOrder: 1,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  };
}

describe('CategoryService', () => {
  const listRootsBySiteId = jest.fn();
  const listActiveRootsBySiteId = jest.fn();
  const listChildrenByParentId = jest.fn();
  const listActiveChildrenByParentId = jest.fn();
  const findByIdForSite = jest.fn();
  const findRootBySlugOrName = jest.fn();
  const nextRootOrder = jest.fn();
  const nextChildOrder = jest.fn();
  const slugExists = jest.fn();
  const create = jest.fn();
  const update = jest.fn();
  const patch = jest.fn();
  const countProductsForCategory = jest.fn();
  const countChildren = jest.fn();
  const deleteFn = jest.fn();
  const listActiveBySubcategory = jest.fn();

  const repository = {
    listRootsBySiteId,
    listActiveRootsBySiteId,
    listChildrenByParentId,
    listActiveChildrenByParentId,
    findByIdForSite,
    findRootBySlugOrName,
    nextRootOrder,
    nextChildOrder,
    slugExists,
    create,
    update,
    patch,
    countProductsForCategory,
    countChildren,
    delete: deleteFn,
  } as unknown as CategoryRepository;

  const products = {
    listActiveBySubcategory,
  } as unknown as ProductRepository;

  const service = new CategoryService(repository, products);

  beforeEach(() => {
    jest.clearAllMocks();
    slugExists.mockResolvedValue(false);
  });

  it('slugifies category names', () => {
    expect(slugifyName('Skin Care!')).toBe('skin-care');
  });

  it('prefers https Cloudinary URLs when mapping', () => {
    const record = makeCategory({
      bannerUrl: 'http://res.cloudinary.com/demo/image/upload/v1/banner.jpg',
    });
    expect(toCategoryDto(record, 'IN').bannerUrl).toBe(
      'https://res.cloudinary.com/demo/image/upload/v1/banner.jpg',
    );
  });

  it('lists root categories for a site', async () => {
    const record = makeCategory();
    listRootsBySiteId.mockResolvedValue([record]);

    const result = await service.listRoots(record.siteId, 'IN');
    expect(listRootsBySiteId).toHaveBeenCalledWith(record.siteId);
    expect(result[0]?.name).toBe('Serums');
  });

  it('creates a root category with generated slug', async () => {
    const record = makeCategory();
    nextRootOrder.mockResolvedValue(1);
    create.mockResolvedValue(record);

    const result = await service.createRoot({
      siteId: record.siteId,
      siteCode: 'IN',
      userId: 'user-1',
      body: {
        name: 'Serums',
        bannerUrl: 'https://cdn.example.com/banner.jpg',
        bannerPublicId: 'categories/banner',
        active: true,
      },
    });

    expect(create).toHaveBeenCalledWith(
      record.siteId,
      expect.objectContaining({
        name: 'Serums',
        slug: 'serums',
        parentId: null,
      }),
    );
    expect(result.id).toBe(record.id);
  });

  it('creates a subcategory under a root category', async () => {
    const parent = makeCategory();
    const child = makeCategory({
      id: '33333333-3333-3333-3333-333333333333',
      name: 'Vitamin C',
      slug: 'vitamin-c',
      parentId: parent.id,
      bannerUrl: null,
      bannerPublicId: null,
    });
    findByIdForSite.mockResolvedValue(parent);
    nextChildOrder.mockResolvedValue(1);
    create.mockResolvedValue(child);

    const result = await service.createSubcategory({
      siteId: parent.siteId,
      siteCode: 'IN',
      userId: 'user-1',
      categoryId: parent.id,
      body: { name: 'Vitamin C', active: true },
    });

    expect(result.parentId).toBe(parent.id);
    expect(create).toHaveBeenCalledWith(
      parent.siteId,
      expect.objectContaining({ parentId: parent.id, name: 'Vitamin C' }),
    );
  });

  it('blocks deleting a category that still has subcategories', async () => {
    const record = makeCategory();
    findByIdForSite.mockResolvedValue(record);
    countChildren.mockResolvedValue(2);

    await expect(
      service.deleteRoot({
        siteId: record.siteId,
        siteCode: 'IN',
        userId: 'user-1',
        categoryId: record.id,
      }),
    ).rejects.toBeInstanceOf(ConflictError);
  });

  it('blocks deleting a subcategory that still has products', async () => {
    const parent = makeCategory();
    const child = makeCategory({
      id: '33333333-3333-3333-3333-333333333333',
      parentId: parent.id,
    });
    findByIdForSite.mockResolvedValue(child);
    countProductsForCategory.mockResolvedValue(1);

    await expect(
      service.deleteSubcategory({
        siteId: parent.siteId,
        siteCode: 'IN',
        userId: 'user-1',
        categoryId: parent.id,
        subcategoryId: child.id,
      }),
    ).rejects.toBeInstanceOf(ConflictError);
  });

  it('returns public category detail with subcategory products', async () => {
    const root = makeCategory();
    const sub = makeCategory({
      id: '33333333-3333-3333-3333-333333333333',
      name: 'Vitamin C',
      slug: 'vitamin-c',
      parentId: root.id,
    });
    findRootBySlugOrName.mockResolvedValue(root);
    listActiveChildrenByParentId.mockResolvedValue([sub]);
    listActiveBySubcategory.mockResolvedValue([
      {
        id: '44444444-4444-4444-4444-444444444444',
        siteId: root.siteId,
        subcategoryId: sub.id,
        productCode: 'VC-01',
        name: 'Vitamin C Serum',
        slug: 'vitamin-c-serum',
        description: null,
        status: 'ACTIVE',
        isFeatured: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    const result = await service.getPublicBySlugOrName(root.siteId, 'IN', 'serums');
    expect(result.subcategories).toHaveLength(1);
    expect(result.subcategories[0]?.products[0]?.productCode).toBe('VC-01');
  });

  it('throws when public category is missing', async () => {
    findRootBySlugOrName.mockResolvedValue(null);
    await expect(
      service.getPublicBySlugOrName('site', 'IN', 'missing'),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it('deletes Cloudinary banner when removing a category', async () => {
    const record = makeCategory();
    findByIdForSite.mockResolvedValue(record);
    countChildren.mockResolvedValue(0);
    deleteFn.mockResolvedValue(true);

    await service.deleteRoot({
      siteId: record.siteId,
      siteCode: 'IN',
      userId: 'user-1',
      categoryId: record.id,
    });

    expect(deleteStoredCloudinaryAsset).toHaveBeenCalledWith('categories/banner');
  });

  it('best-effort deletes previous banner on update', async () => {
    const existing = makeCategory({ bannerPublicId: 'categories/old' });
    const updated = makeCategory({ bannerPublicId: 'categories/new' });
    findByIdForSite.mockResolvedValue(existing);
    update.mockResolvedValue(updated);

    await service.updateRoot({
      siteId: existing.siteId,
      siteCode: 'IN',
      userId: 'user-1',
      categoryId: existing.id,
      body: {
        name: 'Serums',
        bannerUrl: 'https://cdn.example.com/new.jpg',
        bannerPublicId: 'categories/new',
        active: true,
      },
    });

    expect(deleteStoredCloudinaryAssetBestEffort).toHaveBeenCalledWith('categories/old');
  });
});
