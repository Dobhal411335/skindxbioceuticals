import {
  deleteStoredCloudinaryAsset,
  deleteStoredCloudinaryAssetBestEffort,
} from '@/lib/cloudinary';
import { logger } from '@/lib/logger';
import type { SiteCode } from '@/types/common';
import { ConflictError, NotFoundError } from '@/utils/AppError';
import { blogRepository } from './blog.repository';
import type {
  BlogCardDto,
  BlogDetailPublicDto,
  BlogDto,
  BlogPublicDto,
  BlogRecord,
} from './blog.types';
import type {
  BlogCreateBody,
  BlogPatchBody,
  BlogUpdateBody,
} from './blog.validation';

function preferHttpsUrl(url: string): string {
  if (url.startsWith('http://res.cloudinary.com/')) {
    return `https://${url.slice('http://'.length)}`;
  }
  return url;
}

export function slugifyBlogName(name: string): string {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 160);
  return slug || 'blog';
}

export function toBlogDto(record: BlogRecord, siteCode: SiteCode): BlogDto {
  return {
    id: record.id,
    siteCode,
    name: record.name,
    slug: record.slug,
    category: record.category,
    badgeText: record.badgeText ?? '',
    stat1Number: record.stat1Number ?? '',
    stat1Name: record.stat1Name ?? '',
    stat1Text: record.stat1Text ?? '',
    stat2Number: record.stat2Number ?? '',
    stat2Name: record.stat2Name ?? '',
    stat2Text: record.stat2Text ?? '',
    title: record.title,
    publishedAt: record.publishedAt.toISOString(),
    createdBy: record.createdBy,
    imageUrl: preferHttpsUrl(record.imageUrl),
    imagePublicId: record.imagePublicId,
    description: record.description,
    blockquote: record.blockquote,
    active: record.active,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

export function toBlogPublicDto(record: BlogRecord, siteCode: SiteCode): BlogPublicDto {
  return {
    id: record.id,
    siteCode,
    name: record.name,
    slug: record.slug,
    category: record.category,
    badgeText: record.badgeText ?? '',
    stat1Number: record.stat1Number ?? '',
    stat1Name: record.stat1Name ?? '',
    stat1Text: record.stat1Text ?? '',
    stat2Number: record.stat2Number ?? '',
    stat2Name: record.stat2Name ?? '',
    stat2Text: record.stat2Text ?? '',
    title: record.title || record.name,
    publishedAt: record.publishedAt.toISOString(),
    createdBy: record.createdBy,
    imageUrl: preferHttpsUrl(record.imageUrl),
    description: record.description,
    blockquote: record.blockquote,
    createdAt: record.createdAt.toISOString(),
  };
}

export function toBlogCardDto(record: BlogRecord): BlogCardDto {
  return {
    id: record.id,
    slug: record.slug,
    name: record.name,
    category: record.category,
    badgeText: record.badgeText ?? '',
    stat1Number: record.stat1Number ?? '',
    stat1Name: record.stat1Name ?? '',
    stat1Text: record.stat1Text ?? '',
    stat2Number: record.stat2Number ?? '',
    stat2Name: record.stat2Name ?? '',
    stat2Text: record.stat2Text ?? '',
    title: record.title || record.name,
    publishedAt: record.publishedAt.toISOString(),
    createdBy: record.createdBy,
    imageUrl: preferHttpsUrl(record.imageUrl),
  };
}

export class BlogService {
  constructor(private readonly repository = blogRepository) {}

  private async uniqueSlug(
    siteId: string,
    baseName: string,
    excludeId?: string,
  ): Promise<string> {
    const base = slugifyBlogName(baseName);
    let candidate = base;
    let attempt = 1;
    while (await this.repository.slugExists(siteId, candidate, excludeId)) {
      attempt += 1;
      candidate = `${base}-${attempt}`;
    }
    return candidate;
  }

  async listForSite(
    siteId: string,
    siteCode: SiteCode,
    category?: string,
  ): Promise<BlogDto[]> {
    const rows = await this.repository.listBySiteId(siteId, { category });
    return rows.map((row) => toBlogDto(row, siteCode));
  }

  async listPublicForSite(
    siteId: string,
    siteCode: SiteCode,
    options?: { category?: string; limit?: number },
  ): Promise<BlogPublicDto[]> {
    const rows = await this.repository.listBySiteId(siteId, {
      category: options?.category,
      activeOnly: true,
      limit: options?.limit,
    });
    return rows.map((row) => toBlogPublicDto(row, siteCode));
  }

  async listPublicCategories(siteId: string): Promise<string[]> {
    return this.repository.listDistinctCategories(siteId, true);
  }

  async getForSite(
    siteId: string,
    siteCode: SiteCode,
    blogId: string,
  ): Promise<BlogDto> {
    const record = await this.repository.findByIdForSite(siteId, blogId);
    if (!record) {
      throw new NotFoundError('Blog not found');
    }
    return toBlogDto(record, siteCode);
  }

  async getPublicBySlug(
    siteId: string,
    siteCode: SiteCode,
    slug: string,
  ): Promise<BlogDetailPublicDto> {
    const record = await this.repository.findBySlugForSite(siteId, slug, true);
    if (!record) {
      throw new NotFoundError('Blog not found');
    }

    const relatedRows = await this.repository.listRelatedByCategory(
      siteId,
      record.category,
      record.id,
      4,
    );

    return {
      ...toBlogPublicDto(record, siteCode),
      related: relatedRows.map(toBlogCardDto),
    };
  }

  async createForSite(input: {
    siteId: string;
    siteCode: SiteCode;
    userId: string;
    body: BlogCreateBody;
  }): Promise<BlogDto> {
    const requestedSlug = input.body.slug?.trim();
    const slug = requestedSlug
      ? await this.ensureSlugAvailable(input.siteId, requestedSlug)
      : await this.uniqueSlug(input.siteId, input.body.name);

    const record = await this.repository.create(input.siteId, {
      name: input.body.name,
      slug,
      category: input.body.category,
      badgeText: input.body.badgeText ?? '',
      stat1Number: input.body.stat1Number ?? '',
      stat1Name: input.body.stat1Name ?? '',
      stat1Text: input.body.stat1Text ?? '',
      stat2Number: input.body.stat2Number ?? '',
      stat2Name: input.body.stat2Name ?? '',
      stat2Text: input.body.stat2Text ?? '',
      title: input.body.name,
      publishedAt: new Date(),
      createdBy: '',
      imageUrl: '',
      imagePublicId: '',
      description: '',
      blockquote: '',
      active: input.body.active,
    });

    logger.info(
      {
        event: 'blog.created',
        siteCode: input.siteCode,
        userId: input.userId,
        blogId: record.id,
        slug: record.slug,
      },
      'Blog created',
    );

    return toBlogDto(record, input.siteCode);
  }

  private async ensureSlugAvailable(
    siteId: string,
    slug: string,
    excludeId?: string,
  ): Promise<string> {
    const exists = await this.repository.slugExists(siteId, slug, excludeId);
    if (exists) {
      throw new ConflictError('A blog with this slug already exists for this site');
    }
    return slug;
  }

  async updateForSite(input: {
    siteId: string;
    siteCode: SiteCode;
    userId: string;
    blogId: string;
    body: BlogUpdateBody;
  }): Promise<BlogDto> {
    const existing = await this.repository.findByIdForSite(input.siteId, input.blogId);
    if (!existing) {
      throw new NotFoundError('Blog not found');
    }

    const slug = await this.ensureSlugAvailable(
      input.siteId,
      input.body.slug,
      input.blogId,
    );

    const nextImageUrl = preferHttpsUrl(input.body.imageUrl);
    const nextPublicId = input.body.imagePublicId.trim();

    const record = await this.repository.update(input.siteId, input.blogId, {
      name: input.body.name,
      slug,
      category: input.body.category,
      badgeText: input.body.badgeText ?? '',
      stat1Number: input.body.stat1Number ?? '',
      stat1Name: input.body.stat1Name ?? '',
      stat1Text: input.body.stat1Text ?? '',
      stat2Number: input.body.stat2Number ?? '',
      stat2Name: input.body.stat2Name ?? '',
      stat2Text: input.body.stat2Text ?? '',
      title: input.body.title,
      publishedAt: input.body.publishedAt,
      createdBy: input.body.createdBy,
      imageUrl: nextImageUrl,
      imagePublicId: nextPublicId,
      description: input.body.description,
      blockquote: input.body.blockquote,
      active: input.body.active,
    });
    if (!record) {
      throw new NotFoundError('Blog not found');
    }

    const previousPublicId = existing.imagePublicId.trim();
    if (previousPublicId && previousPublicId !== nextPublicId) {
      await deleteStoredCloudinaryAssetBestEffort(previousPublicId);
    }

    logger.info(
      {
        event: 'blog.updated',
        siteCode: input.siteCode,
        userId: input.userId,
        blogId: record.id,
        slug: record.slug,
      },
      'Blog updated',
    );

    return toBlogDto(record, input.siteCode);
  }

  async patchForSite(input: {
    siteId: string;
    siteCode: SiteCode;
    userId: string;
    blogId: string;
    body: BlogPatchBody;
  }): Promise<BlogDto> {
    const record = await this.repository.patch(input.siteId, input.blogId, {
      ...(input.body.name !== undefined ? { name: input.body.name } : {}),
      ...(input.body.active !== undefined ? { active: input.body.active } : {}),
    });
    if (!record) {
      throw new NotFoundError('Blog not found');
    }

    logger.info(
      {
        event: 'blog.patched',
        siteCode: input.siteCode,
        userId: input.userId,
        blogId: record.id,
        name: record.name,
        active: record.active,
      },
      'Blog patched',
    );

    return toBlogDto(record, input.siteCode);
  }

  async deleteForSite(input: {
    siteId: string;
    siteCode: SiteCode;
    userId: string;
    blogId: string;
  }): Promise<void> {
    const existing = await this.repository.findByIdForSite(input.siteId, input.blogId);
    if (!existing) {
      throw new NotFoundError('Blog not found');
    }

    if (existing.imagePublicId.trim()) {
      await deleteStoredCloudinaryAsset(existing.imagePublicId);
    }

    const deleted = await this.repository.delete(input.siteId, input.blogId);
    if (!deleted) {
      throw new NotFoundError('Blog not found');
    }

    logger.info(
      {
        event: 'blog.deleted',
        siteCode: input.siteCode,
        userId: input.userId,
        blogId: input.blogId,
      },
      'Blog deleted',
    );
  }
}

export const blogService = new BlogService();
