import type { ProductStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import type { ProductRecord, ProductWrite } from './product.types';

function toRecord(row: {
  id: string;
  siteId: string;
  subcategoryId: string | null;
  productCode: string;
  name: string;
  slug: string;
  description: string | null;
  status: ProductStatus;
  isFeatured: boolean;
  createdAt: Date;
  updatedAt: Date;
}): ProductRecord {
  return {
    id: row.id,
    siteId: row.siteId,
    subcategoryId: row.subcategoryId,
    productCode: row.productCode,
    name: row.name,
    slug: row.slug,
    description: row.description,
    status: row.status,
    isFeatured: row.isFeatured,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class ProductRepository {
  async listBySubcategory(siteId: string, subcategoryId: string): Promise<ProductRecord[]> {
    const rows = await prisma.product.findMany({
      where: { siteId, subcategoryId },
      // Oldest products first; latest created appear at the bottom.
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    });
    return rows.map(toRecord);
  }

  async listActiveBySubcategory(siteId: string, subcategoryId: string): Promise<ProductRecord[]> {
    const rows = await prisma.product.findMany({
      where: { siteId, subcategoryId, status: 'ACTIVE' },
      orderBy: [{ name: 'asc' }],
    });
    return rows.map(toRecord);
  }

  async findByIdForSite(siteId: string, productId: string): Promise<ProductRecord | null> {
    const row = await prisma.product.findFirst({
      where: { id: productId, siteId },
    });
    return row ? toRecord(row) : null;
  }

  async productCodeExists(
    siteId: string,
    productCode: string,
    excludeId?: string,
  ): Promise<boolean> {
    const row = await prisma.product.findFirst({
      where: {
        siteId,
        productCode,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
      select: { id: true },
    });
    return Boolean(row);
  }

  async slugExists(siteId: string, slug: string, excludeId?: string): Promise<boolean> {
    const row = await prisma.product.findFirst({
      where: {
        siteId,
        slug,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
      select: { id: true },
    });
    return Boolean(row);
  }

  async create(siteId: string, data: ProductWrite): Promise<ProductRecord> {
    const row = await prisma.product.create({
      data: {
        siteId,
        subcategoryId: data.subcategoryId,
        productCode: data.productCode,
        name: data.name,
        slug: data.slug,
        description: data.description,
        status: data.status,
        isFeatured: data.isFeatured,
        categories: {
          create: [{ categoryId: data.subcategoryId }],
        },
      },
    });
    return toRecord(row);
  }

  async update(
    siteId: string,
    productId: string,
    data: ProductWrite,
  ): Promise<ProductRecord | null> {
    const existing = await this.findByIdForSite(siteId, productId);
    if (!existing) return null;

    const row = await prisma.$transaction(async (tx) => {
      await tx.productCategory.deleteMany({ where: { productId } });
      await tx.productCategory.create({
        data: { productId, categoryId: data.subcategoryId },
      });
      return tx.product.update({
        where: { id: productId },
        data: {
          subcategoryId: data.subcategoryId,
          productCode: data.productCode,
          name: data.name,
          slug: data.slug,
          description: data.description,
          status: data.status,
          isFeatured: data.isFeatured,
        },
      });
    });

    return toRecord(row);
  }

  async patch(
    siteId: string,
    productId: string,
    data: Partial<{
      productCode: string;
      name: string;
      slug: string;
      status: ProductStatus;
    }>,
  ): Promise<ProductRecord | null> {
    const existing = await this.findByIdForSite(siteId, productId);
    if (!existing) return null;

    const row = await prisma.product.update({
      where: { id: productId },
      data: {
        ...(data.productCode !== undefined ? { productCode: data.productCode } : {}),
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.slug !== undefined ? { slug: data.slug } : {}),
        ...(data.status !== undefined ? { status: data.status } : {}),
      },
    });
    return toRecord(row);
  }

  async delete(siteId: string, productId: string): Promise<boolean> {
    const existing = await this.findByIdForSite(siteId, productId);
    if (!existing) return false;
    await prisma.product.delete({ where: { id: productId } });
    return true;
  }
}

export const productRepository = new ProductRepository();
