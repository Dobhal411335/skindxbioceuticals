import { BlogService, slugifyBlogName, toBlogDto } from '../blog.service';
import type { BlogRepository } from '../blog.repository';
import type { BlogRecord } from '../blog.types';
import { ConflictError, NotFoundError } from '@/utils/AppError';
import {
  deleteStoredCloudinaryAsset,
  deleteStoredCloudinaryAssetBestEffort,
} from '@/lib/cloudinary';

jest.mock('@/lib/cloudinary', () => ({
  deleteStoredCloudinaryAsset: jest.fn(),
  deleteStoredCloudinaryAssetBestEffort: jest.fn(),
}));

function makeRecord(overrides: Partial<BlogRecord> = {}): BlogRecord {
  return {
    id: '11111111-1111-1111-1111-111111111111',
    siteId: '22222222-2222-2222-2222-222222222222',
    name: 'Reading ingredients',
    slug: 'reading-ingredients',
    category: 'Education',
    title: 'How to read an ingredients list',
    publishedAt: new Date('2026-05-15T00:00:00.000Z'),
    createdBy: 'SkinDx Editorial',
    imageUrl: 'https://cdn.example.com/blog.jpg',
    imagePublicId: 'blog/post',
    description: '<p>Body</p>',
    blockquote: 'Clarity over jargon.',
    active: true,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  };
}

describe('BlogService', () => {
  const listBySiteId = jest.fn();
  const listDistinctCategories = jest.fn();
  const findByIdForSite = jest.fn();
  const findBySlugForSite = jest.fn();
  const listRelatedByCategory = jest.fn();
  const slugExists = jest.fn();
  const create = jest.fn();
  const update = jest.fn();
  const patch = jest.fn();
  const deleteFn = jest.fn();

  const repository = {
    listBySiteId,
    listDistinctCategories,
    findByIdForSite,
    findBySlugForSite,
    listRelatedByCategory,
    slugExists,
    create,
    update,
    patch,
    delete: deleteFn,
  } as unknown as BlogRepository;

  const service = new BlogService(repository);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('slugifies blog names', () => {
    expect(slugifyBlogName('Skin Care Tips!')).toBe('skin-care-tips');
  });

  it('lists and maps blogs for a site', async () => {
    const record = makeRecord();
    listBySiteId.mockResolvedValue([record]);

    const result = await service.listForSite(record.siteId, 'IN', 'Education');

    expect(listBySiteId).toHaveBeenCalledWith(record.siteId, { category: 'Education' });
    expect(result).toEqual([toBlogDto(record, 'IN')]);
  });

  it('creates with auto-generated unique slug from name', async () => {
    const record = makeRecord();
    slugExists.mockResolvedValueOnce(false);
    create.mockResolvedValue(record);

    const dto = await service.createForSite({
      siteId: record.siteId,
      siteCode: 'IN',
      userId: 'user-1',
      body: {
        name: 'Reading ingredients',
        category: 'Education',
        active: true,
      },
    });

    expect(create).toHaveBeenCalledWith(
      record.siteId,
      expect.objectContaining({
        name: 'Reading ingredients',
        slug: 'reading-ingredients',
        category: 'Education',
        title: 'Reading ingredients',
        active: true,
      }),
    );
    expect(dto.id).toBe(record.id);
  });

  it('rejects create when an explicit slug already exists', async () => {
    slugExists.mockResolvedValue(true);

    await expect(
      service.createForSite({
        siteId: 'site-1',
        siteCode: 'IN',
        userId: 'user-1',
        body: {
          name: 'Duplicate',
          category: 'Brand',
          slug: 'taken-slug',
          active: true,
        },
      }),
    ).rejects.toBeInstanceOf(ConflictError);
  });

  it('throws NotFoundError when updating a missing blog', async () => {
    findByIdForSite.mockResolvedValue(null);

    await expect(
      service.updateForSite({
        siteId: 'site-1',
        siteCode: 'IN',
        userId: 'user-1',
        blogId: 'missing',
        body: {
          name: 'Name',
          slug: 'name',
          category: 'Education',
          title: 'Title',
          publishedAt: new Date('2026-05-15T00:00:00.000Z'),
          createdBy: 'Editor',
          imageUrl: 'https://cdn.example.com/a.jpg',
          imagePublicId: 'blog/a',
          description: '<p>Hi</p>',
          blockquote: '',
          active: true,
        },
      }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it('returns public detail with related cards and cleans Cloudinary on delete', async () => {
    const record = makeRecord();
    const related = makeRecord({
      id: '33333333-3333-3333-3333-333333333333',
      slug: 'related-post',
      name: 'Related',
    });
    findBySlugForSite.mockResolvedValue(record);
    listRelatedByCategory.mockResolvedValue([related]);
    findByIdForSite.mockResolvedValue(record);
    deleteFn.mockResolvedValue(true);
    (deleteStoredCloudinaryAsset as jest.Mock).mockResolvedValue(undefined);

    const detail = await service.getPublicBySlug(record.siteId, 'IN', record.slug);
    expect(detail.slug).toBe(record.slug);
    expect(detail.related).toHaveLength(1);
    expect(detail.related[0]?.slug).toBe('related-post');

    await service.deleteForSite({
      siteId: record.siteId,
      siteCode: 'IN',
      userId: 'user-1',
      blogId: record.id,
    });
    expect(deleteStoredCloudinaryAsset).toHaveBeenCalledWith(record.imagePublicId);
    expect(deleteFn).toHaveBeenCalledWith(record.siteId, record.id);
  });

  it('cleans up the previous Cloudinary asset when the image is replaced', async () => {
    const existing = makeRecord({ imagePublicId: 'blog/old' });
    const updated = makeRecord({ imagePublicId: 'blog/new' });
    findByIdForSite.mockResolvedValue(existing);
    slugExists.mockResolvedValue(false);
    update.mockResolvedValue(updated);

    await service.updateForSite({
      siteId: existing.siteId,
      siteCode: 'COM',
      userId: 'user-1',
      blogId: existing.id,
      body: {
        name: existing.name,
        slug: existing.slug,
        category: existing.category,
        title: existing.title,
        publishedAt: existing.publishedAt,
        createdBy: existing.createdBy,
        imageUrl: 'https://cdn.example.com/new.jpg',
        imagePublicId: 'blog/new',
        description: existing.description,
        blockquote: existing.blockquote,
        active: true,
      },
    });

    expect(deleteStoredCloudinaryAssetBestEffort).toHaveBeenCalledWith('blog/old');
  });

  it('patches name without changing slug', async () => {
    const record = makeRecord({ name: 'Updated name' });
    patch.mockResolvedValue(record);

    const dto = await service.patchForSite({
      siteId: record.siteId,
      siteCode: 'IN',
      userId: 'user-1',
      blogId: record.id,
      body: { name: 'Updated name' },
    });

    expect(patch).toHaveBeenCalledWith(record.siteId, record.id, {
      name: 'Updated name',
    });
    expect(dto.name).toBe('Updated name');
  });
});
