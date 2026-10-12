import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import type {
  CatalogColorBody,
  CatalogTagBody,
  ProductColorsSectionBody,
  ProductCouponSectionBody,
  ProductDescriptionSectionBody,
  ProductEditorialReviewBody,
  ProductGallerySectionBody,
  ProductHighlightsSectionBody,
  ProductInfoSectionBody,
  ProductSizesSectionBody,
  ProductTagsSectionBody,
  ProductTaxSectionBody,
  ProductVariantsSectionBody,
  ProductVideosSectionBody,
} from './product-edit.validation';

export type ProductEditRecord = NonNullable<
  Awaited<ReturnType<ProductEditRepository['findEditPayload']>>
>;

export class ProductEditRepository {
  async findEditPayload(siteId: string, productId: string) {
    return prisma.product.findFirst({
      where: { id: productId, siteId },
      include: {
        sizes: { orderBy: { sortOrder: 'asc' } },
        colors: { orderBy: { sortOrder: 'asc' } },
        galleryImages: { orderBy: { sortOrder: 'asc' } },
        videos: { orderBy: { sortOrder: 'asc' } },
        infoSections: { orderBy: { sortOrder: 'asc' } },
        editorialReviews: { orderBy: { sortOrder: 'asc' } },
        highlights: { orderBy: { sortOrder: 'asc' } },
        tax: true,
        coupon: { include: { coupon: true } },
        tags: { include: { tag: true } },
        variants: {
          orderBy: { createdAt: 'asc' },
          include: { inventory: true },
        },
      },
    });
  }

  async listCatalogColors(siteId: string) {
    return prisma.catalogColor.findMany({
      where: { siteId },
      orderBy: [{ name: 'asc' }],
    });
  }

  async listCatalogTags(siteId: string) {
    return prisma.catalogTag.findMany({
      where: { siteId },
      orderBy: [{ name: 'asc' }],
    });
  }

  async listActiveCoupons(siteId: string) {
    return prisma.coupon.findMany({
      where: {
        siteId,
        isActive: true,
        type: { in: ['PERCENTAGE', 'FIXED_AMOUNT'] },
      },
      orderBy: [{ code: 'asc' }],
    });
  }

  async createCatalogColor(siteId: string, body: CatalogColorBody) {
    return prisma.catalogColor.create({
      data: {
        siteId,
        name: body.name,
        hex: body.hex.toUpperCase(),
      },
    });
  }

  async createCatalogTag(siteId: string, body: CatalogTagBody) {
    return prisma.catalogTag.create({
      data: {
        siteId,
        name: body.name,
      },
    });
  }

  async replaceSizes(productId: string, body: ProductSizesSectionBody): Promise<void> {
    await prisma.$transaction(async (tx) => {
      await tx.product.update({
        where: { id: productId },
        data: {
          sizeChartUrl: body.sizeChartUrl ?? null,
          sizeChartPublicId: body.sizeChartPublicId ?? null,
        },
      });
      await tx.productSize.deleteMany({ where: { productId } });
      if (body.sizes.length > 0) {
        await tx.productSize.createMany({
          data: body.sizes.map((size, index) => ({
            productId,
            label: size.label,
            active: size.active,
            sortOrder: size.sortOrder ?? index,
          })),
        });
      }
    });
  }

  async replaceColors(productId: string, body: ProductColorsSectionBody): Promise<void> {
    await prisma.$transaction(async (tx) => {
      await tx.productColor.deleteMany({ where: { productId } });
      if (body.colors.length > 0) {
        await tx.productColor.createMany({
          data: body.colors.map((color, index) => ({
            productId,
            colorId: color.colorId ?? null,
            name: color.name,
            hex: color.hex ? color.hex.toUpperCase() : null,
            active: color.active,
            sortOrder: color.sortOrder ?? index,
          })),
        });
      }
    });
  }

  async replaceVariants(
    productId: string,
    body: ProductVariantsSectionBody,
  ): Promise<{ removedPublicIds: string[] }> {
    const removedPublicIds: string[] = [];

    await prisma.$transaction(async (tx) => {
      const existing = await tx.productVariant.findMany({
        where: { productId },
        select: {
          id: true,
          profileImagePublicId: true,
          subImages: true,
          orderItems: { select: { id: true }, take: 1 },
          cartItems: { select: { id: true }, take: 1 },
        },
      });

      const keepIds = new Set(
        body.variants.map((v) => v.id).filter((id): id is string => Boolean(id)),
      );

      for (const row of existing) {
        if (keepIds.has(row.id)) continue;
        if (row.orderItems.length > 0 || row.cartItems.length > 0) {
          await tx.productVariant.update({
            where: { id: row.id },
            data: { isActive: false },
          });
          continue;
        }
        if (row.profileImagePublicId) removedPublicIds.push(row.profileImagePublicId);
        const subs = Array.isArray(row.subImages) ? row.subImages : [];
        for (const img of subs) {
          if (
            img &&
            typeof img === 'object' &&
            'publicId' in img &&
            typeof (img as { publicId: unknown }).publicId === 'string'
          ) {
            removedPublicIds.push((img as { publicId: string }).publicId);
          }
        }
        await tx.inventoryItem.deleteMany({ where: { variantId: row.id } });
        await tx.productVariant.delete({ where: { id: row.id } });
      }

      for (const [index, variant] of body.variants.entries()) {
        const nameParts = [variant.sizeLabel, variant.colorLabel].filter(Boolean);
        const name = nameParts.length > 0 ? nameParts.join(' / ') : `Offer ${index + 1}`;
        const profileUrl = variant.profileImage?.url ?? null;
        const profilePublicId = variant.profileImage?.publicId ?? null;
        const subImages = (variant.subImages ?? []).map((img) => ({
          url: img.url,
          publicId: img.publicId,
        }));

        if (variant.id && keepIds.has(variant.id)) {
          await tx.productVariant.update({
            where: { id: variant.id },
            data: {
              name,
              price: new Prisma.Decimal(variant.price),
              vendorPrice:
                variant.vendorPrice == null ? null : new Prisma.Decimal(variant.vendorPrice),
              sizeLabel: variant.sizeLabel || null,
              colorLabel: variant.colorLabel || null,
              weightGrams: variant.weightGrams ?? null,
              isActive: variant.isActive,
              profileImageUrl: profileUrl,
              profileImagePublicId: profilePublicId,
              subImages,
            },
          });
          await tx.inventoryItem.upsert({
            where: { variantId: variant.id },
            create: {
              variantId: variant.id,
              quantityOnHand: variant.quantity,
            },
            update: { quantityOnHand: variant.quantity },
          });
          continue;
        }

        const created = await tx.productVariant.create({
          data: {
            productId,
            sku: null,
            name,
            price: new Prisma.Decimal(variant.price),
            vendorPrice:
              variant.vendorPrice == null ? null : new Prisma.Decimal(variant.vendorPrice),
            sizeLabel: variant.sizeLabel || null,
            colorLabel: variant.colorLabel || null,
            weightGrams: variant.weightGrams ?? null,
            isActive: variant.isActive,
            profileImageUrl: profileUrl,
            profileImagePublicId: profilePublicId,
            subImages,
            inventory: {
              create: { quantityOnHand: variant.quantity },
            },
          },
        });
        void created;
      }
    });

    return { removedPublicIds };
  }

  async replaceCoupon(productId: string, body: ProductCouponSectionBody): Promise<void> {
    await prisma.$transaction(async (tx) => {
      await tx.productCoupon.deleteMany({ where: { productId } });
      if (body.couponId) {
        await tx.productCoupon.create({
          data: { productId, couponId: body.couponId },
        });
      }
    });
  }

  async upsertTax(productId: string, body: ProductTaxSectionBody): Promise<void> {
    await prisma.productTax.upsert({
      where: { productId },
      create: {
        productId,
        cgst: new Prisma.Decimal(body.cgst),
        sgst: new Prisma.Decimal(body.sgst),
      },
      update: {
        cgst: new Prisma.Decimal(body.cgst),
        sgst: new Prisma.Decimal(body.sgst),
      },
    });
  }

  async deleteTax(productId: string): Promise<void> {
    await prisma.productTax.deleteMany({ where: { productId } });
  }

  async replaceGallery(
    productId: string,
    body: ProductGallerySectionBody,
  ): Promise<{ removedPublicIds: string[] }> {
    const existingProduct = await prisma.product.findUnique({
      where: { id: productId },
      select: {
        bannerPublicId: true,
        galleryImages: { select: { imagePublicId: true } },
      },
    });

    const nextGalleryIds = new Set(
      body.images.map((img) => img.imagePublicId).filter(Boolean),
    );
    const removedPublicIds = (existingProduct?.galleryImages ?? [])
      .map((row) => row.imagePublicId)
      .filter((id) => id && !nextGalleryIds.has(id));

    const nextBannerPublicId = body.bannerPublicId ?? null;
    const previousBannerPublicId = existingProduct?.bannerPublicId ?? null;
    if (
      previousBannerPublicId &&
      previousBannerPublicId !== nextBannerPublicId
    ) {
      removedPublicIds.push(previousBannerPublicId);
    }

    await prisma.$transaction(async (tx) => {
      await tx.product.update({
        where: { id: productId },
        data: {
          bannerUrl: body.bannerUrl ?? null,
          bannerPublicId: nextBannerPublicId,
        },
      });
      await tx.productGalleryImage.deleteMany({ where: { productId } });
      if (body.images.length > 0) {
        const hasPrimary = body.images.some((img) => img.isPrimary);
        await tx.productGalleryImage.createMany({
          data: body.images.map((img, index) => ({
            productId,
            imageUrl: img.imageUrl,
            imagePublicId: img.imagePublicId,
            isPrimary: hasPrimary ? img.isPrimary : index === 0,
            sortOrder: img.sortOrder ?? index,
          })),
        });
      }
    });

    return { removedPublicIds };
  }

  async replaceVideos(productId: string, body: ProductVideosSectionBody): Promise<void> {
    await prisma.$transaction(async (tx) => {
      await tx.productVideo.deleteMany({ where: { productId } });
      if (body.videos.length > 0) {
        await tx.productVideo.createMany({
          data: body.videos.map((video, index) => ({
            productId,
            name: video.name,
            url: video.url,
            description: video.description,
            sortOrder: video.sortOrder ?? index,
          })),
        });
      }
    });
  }

  async updateDescription(productId: string, body: ProductDescriptionSectionBody): Promise<void> {
    await prisma.product.update({
      where: { id: productId },
      data: { description: body.description || null },
    });
  }

  async replaceInfoSections(productId: string, body: ProductInfoSectionBody): Promise<void> {
    await prisma.$transaction(async (tx) => {
      await tx.productInfoSection.deleteMany({ where: { productId } });
      if (body.sections.length > 0) {
        await tx.productInfoSection.createMany({
          data: body.sections.map((section, index) => ({
            productId,
            title: section.title,
            body: section.body,
            sortOrder: section.sortOrder ?? index,
          })),
        });
      }
    });
  }

  async createEditorialReview(productId: string, body: ProductEditorialReviewBody) {
    const count = await prisma.productEditorialReview.count({ where: { productId } });
    return prisma.productEditorialReview.create({
      data: {
        productId,
        createdByName: body.createdByName,
        rating: body.rating,
        title: body.title,
        body: body.body,
        imageUrl: body.imageUrl ?? null,
        imagePublicId: body.imagePublicId ?? null,
        active: body.active,
        sortOrder: count,
      },
    });
  }

  async updateEditorialReview(
    productId: string,
    reviewId: string,
    body: ProductEditorialReviewBody,
  ) {
    const existing = await prisma.productEditorialReview.findFirst({
      where: { id: reviewId, productId },
    });
    if (!existing) return null;
    return prisma.productEditorialReview.update({
      where: { id: reviewId },
      data: {
        createdByName: body.createdByName,
        rating: body.rating,
        title: body.title,
        body: body.body,
        imageUrl: body.imageUrl ?? null,
        imagePublicId: body.imagePublicId ?? null,
        active: body.active,
      },
    });
  }

  async deleteEditorialReview(productId: string, reviewId: string) {
    const existing = await prisma.productEditorialReview.findFirst({
      where: { id: reviewId, productId },
    });
    if (!existing) return null;
    await prisma.productEditorialReview.delete({ where: { id: reviewId } });
    return existing;
  }

  async replaceTags(
    siteId: string,
    productId: string,
    body: ProductTagsSectionBody,
  ): Promise<void> {
    const names = [...new Set(body.tagNames.map((n) => n.trim()).filter(Boolean))];
    await prisma.$transaction(async (tx) => {
      const tags = [];
      for (const name of names) {
        const tag = await tx.catalogTag.upsert({
          where: { siteId_name: { siteId, name } },
          create: { siteId, name },
          update: {},
        });
        tags.push(tag);
      }
      await tx.productTag.deleteMany({ where: { productId } });
      if (tags.length > 0) {
        await tx.productTag.createMany({
          data: tags.map((tag) => ({ productId, tagId: tag.id })),
        });
      }
    });
  }

  async replaceHighlights(productId: string, body: ProductHighlightsSectionBody): Promise<void> {
    await prisma.$transaction(async (tx) => {
      await tx.productHighlight.deleteMany({ where: { productId } });
      if (body.highlights.length > 0) {
        await tx.productHighlight.createMany({
          data: body.highlights.map((text, index) => ({
            productId,
            text,
            sortOrder: index,
          })),
        });
      }
    });
  }

  async findCouponById(siteId: string, couponId: string) {
    return prisma.coupon.findFirst({
      where: {
        id: couponId,
        siteId,
        type: { in: ['PERCENTAGE', 'FIXED_AMOUNT'] },
      },
    });
  }
}

export const productEditRepository = new ProductEditRepository();
