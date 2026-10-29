import { deleteStoredCloudinaryAssetBestEffort } from '@/lib/cloudinary';
import { logger } from '@/lib/logger';
import type { SiteCode } from '@/types/common';
import { ConflictError, NotFoundError, ValidationError } from '@/utils/AppError';
import { toCatalogProductDto } from './product.service';
import { productRepository } from './product.repository';
import { productEditRepository } from './product-edit.repository';
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
import type {
  CatalogColorDto,
  CatalogTagDto,
  CouponOptionDto,
  MediaRefDto,
  ProductColorDto,
  ProductCouponDto,
  ProductEditDto,
  ProductEditorialReviewDto,
  ProductGalleryImageDto,
  ProductHighlightDto,
  ProductInfoSectionDto,
  ProductSizeDto,
  ProductTaxDto,
  ProductVariantOfferDto,
  ProductVideoDto,
} from './product-edit.types';

function preferHttpsUrl(url: string): string {
  if (url.startsWith('http://res.cloudinary.com/')) {
    return `https://${url.slice('http://'.length)}`;
  }
  return url;
}

function toMediaRef(
  url: string | null | undefined,
  publicId: string | null | undefined,
): MediaRefDto | null {
  if (!url) return null;
  return { url: preferHttpsUrl(url), publicId: publicId ?? '' };
}

function decimalToNumber(value: { toString(): string } | number | null | undefined): number | null {
  if (value == null) return null;
  return Number(value.toString());
}

export class ProductEditService {
  constructor(
    private readonly products = productRepository,
    private readonly repository = productEditRepository,
  ) {}

  private async requireProduct(siteId: string, productId: string) {
    const product = await this.products.findByIdForSite(siteId, productId);
    if (!product) {
      throw new NotFoundError('Product not found');
    }
    return product;
  }

  private async loadEditDto(
    siteId: string,
    siteCode: SiteCode,
    productId: string,
  ): Promise<ProductEditDto> {
    const record = await this.repository.findEditPayload(siteId, productId);
    if (!record) {
      throw new NotFoundError('Product not found');
    }

    const [catalogColors, catalogTags, availableCoupons] = await Promise.all([
      this.repository.listCatalogColors(siteId),
      this.repository.listCatalogTags(siteId),
      this.repository.listActiveCoupons(siteId),
    ]);

    const sizes: ProductSizeDto[] = record.sizes.map((row) => ({
      id: row.id,
      label: row.label,
      sortOrder: row.sortOrder,
      active: row.active,
    }));

    const colors: ProductColorDto[] = record.colors.map((row) => ({
      id: row.id,
      colorId: row.colorId,
      name: row.name,
      hex: row.hex,
      sortOrder: row.sortOrder,
      active: row.active,
    }));

    const variants: ProductVariantOfferDto[] = record.variants.map((row) => {
      const subImagesRaw = Array.isArray(row.subImages) ? row.subImages : [];
      const subImages: MediaRefDto[] = [];
      for (const img of subImagesRaw) {
        if (
          img &&
          typeof img === 'object' &&
          'url' in img &&
          typeof (img as { url: unknown }).url === 'string'
        ) {
          subImages.push({
            url: preferHttpsUrl((img as { url: string }).url),
            publicId:
              'publicId' in img && typeof (img as { publicId: unknown }).publicId === 'string'
                ? (img as { publicId: string }).publicId
                : '',
          });
        }
      }

      return {
        id: row.id,
        sku: row.sku,
        name: row.name,
        price: decimalToNumber(row.price) ?? 0,
        vendorPrice: decimalToNumber(row.vendorPrice),
        sizeLabel: row.sizeLabel,
        colorLabel: row.colorLabel,
        weightGrams: row.weightGrams,
        quantity: row.inventory?.quantityOnHand ?? 0,
        isActive: row.isActive,
        profileImage: toMediaRef(row.profileImageUrl, row.profileImagePublicId),
        subImages,
      };
    });

    const gallery: ProductGalleryImageDto[] = record.galleryImages.map((row) => ({
      id: row.id,
      imageUrl: preferHttpsUrl(row.imageUrl),
      imagePublicId: row.imagePublicId,
      isPrimary: row.isPrimary,
      sortOrder: row.sortOrder,
    }));

    const videos: ProductVideoDto[] = record.videos.map((row) => ({
      id: row.id,
      name: row.name,
      url: row.url,
      description: row.description,
      sortOrder: row.sortOrder,
    }));

    const infoSections: ProductInfoSectionDto[] = record.infoSections.map((row) => ({
      id: row.id,
      title: row.title,
      body: row.body,
      sortOrder: row.sortOrder,
    }));

    const editorialReviews: ProductEditorialReviewDto[] = record.editorialReviews.map((row) => ({
      id: row.id,
      createdByName: row.createdByName,
      rating: row.rating,
      title: row.title,
      body: row.body,
      imageUrl: row.imageUrl ? preferHttpsUrl(row.imageUrl) : null,
      imagePublicId: row.imagePublicId,
      active: row.active,
      sortOrder: row.sortOrder,
    }));

    const tags: CatalogTagDto[] = record.tags.map((row) => ({
      id: row.tag.id,
      name: row.tag.name,
    }));

    const highlights: ProductHighlightDto[] = record.highlights.map((row) => ({
      id: row.id,
      question: row.question,
      answer: row.answer,
      sortOrder: row.sortOrder,
    }));

    const tax: ProductTaxDto = record.tax
      ? {
          cgst: decimalToNumber(record.tax.cgst) ?? 0,
          sgst: decimalToNumber(record.tax.sgst) ?? 0,
        }
      : null;

    const coupon: ProductCouponDto = record.coupon
      ? {
          couponId: record.coupon.couponId,
          code: record.coupon.coupon.code,
          type: record.coupon.coupon.type,
          value: decimalToNumber(record.coupon.coupon.value) ?? 0,
        }
      : null;

    const catalogColorDtos: CatalogColorDto[] = catalogColors.map((row) => ({
      id: row.id,
      name: row.name,
      hex: row.hex,
    }));

    const catalogTagDtos: CatalogTagDto[] = catalogTags.map((row) => ({
      id: row.id,
      name: row.name,
    }));

    const couponOptions: CouponOptionDto[] = availableCoupons.map((row) => ({
      id: row.id,
      code: row.code,
      type: row.type,
      value: decimalToNumber(row.value) ?? 0,
      isActive: row.isActive,
    }));

    return {
      product: toCatalogProductDto(record, siteCode),
      sizeChart: toMediaRef(record.sizeChartUrl, record.sizeChartPublicId),
      banner: toMediaRef(record.bannerUrl, record.bannerPublicId),
      sizes,
      colors,
      catalogColors: catalogColorDtos,
      variants,
      gallery,
      videos,
      description: record.description ?? '',
      infoSections,
      editorialReviews,
      tags,
      catalogTags: catalogTagDtos,
      highlights,
      tax,
      coupon,
      availableCoupons: couponOptions,
    };
  }

  async getEditPayload(input: {
    siteId: string;
    siteCode: SiteCode;
    productId: string;
  }): Promise<ProductEditDto> {
    return this.loadEditDto(input.siteId, input.siteCode, input.productId);
  }

  async createCatalogColor(input: {
    siteId: string;
    siteCode: SiteCode;
    userId: string;
    body: CatalogColorBody;
  }): Promise<CatalogColorDto> {
    try {
      const row = await this.repository.createCatalogColor(input.siteId, input.body);
      logger.info(
        {
          event: 'catalog_color.created',
          siteCode: input.siteCode,
          userId: input.userId,
          colorId: row.id,
        },
        'Catalog color created',
      );
      return { id: row.id, name: row.name, hex: row.hex };
    } catch (error) {
      if (
        error &&
        typeof error === 'object' &&
        'code' in error &&
        (error as { code: string }).code === 'P2002'
      ) {
        throw new ConflictError('A color with this name or hex already exists for this site');
      }
      throw error;
    }
  }

  async createCatalogTag(input: {
    siteId: string;
    siteCode: SiteCode;
    userId: string;
    body: CatalogTagBody;
  }): Promise<CatalogTagDto> {
    try {
      const row = await this.repository.createCatalogTag(input.siteId, input.body);
      logger.info(
        {
          event: 'catalog_tag.created',
          siteCode: input.siteCode,
          userId: input.userId,
          tagId: row.id,
        },
        'Catalog tag created',
      );
      return { id: row.id, name: row.name };
    } catch (error) {
      if (
        error &&
        typeof error === 'object' &&
        'code' in error &&
        (error as { code: string }).code === 'P2002'
      ) {
        throw new ConflictError('A tag with this name already exists for this site');
      }
      throw error;
    }
  }

  async updateSizes(input: {
    siteId: string;
    siteCode: SiteCode;
    userId: string;
    productId: string;
    body: ProductSizesSectionBody;
  }): Promise<ProductEditDto> {
    await this.requireProduct(input.siteId, input.productId);
    const previous = await this.repository.findEditPayload(input.siteId, input.productId);
    const previousPublicId = previous?.sizeChartPublicId ?? null;

    await this.repository.replaceSizes(input.productId, input.body);

    if (previousPublicId && previousPublicId !== (input.body.sizeChartPublicId ?? null)) {
      await deleteStoredCloudinaryAssetBestEffort(previousPublicId);
    }

    logger.info(
      {
        event: 'product_edit.sizes_updated',
        siteCode: input.siteCode,
        userId: input.userId,
        productId: input.productId,
      },
      'Product sizes updated',
    );
    return this.loadEditDto(input.siteId, input.siteCode, input.productId);
  }

  async updateColors(input: {
    siteId: string;
    siteCode: SiteCode;
    userId: string;
    productId: string;
    body: ProductColorsSectionBody;
  }): Promise<ProductEditDto> {
    await this.requireProduct(input.siteId, input.productId);
    await this.repository.replaceColors(input.productId, input.body);
    logger.info(
      {
        event: 'product_edit.colors_updated',
        siteCode: input.siteCode,
        userId: input.userId,
        productId: input.productId,
      },
      'Product colors updated',
    );
    return this.loadEditDto(input.siteId, input.siteCode, input.productId);
  }

  async updateVariants(input: {
    siteId: string;
    siteCode: SiteCode;
    userId: string;
    productId: string;
    body: ProductVariantsSectionBody;
  }): Promise<ProductEditDto> {
    await this.requireProduct(input.siteId, input.productId);
    const current = await this.repository.findEditPayload(input.siteId, input.productId);
    if (!current) {
      throw new NotFoundError('Product not found');
    }

    const sizeLabels = new Set(current.sizes.map((size) => size.label));
    const colorNames = new Set(current.colors.map((color) => color.name));
    const existingById = new Map(current.variants.map((row) => [row.id, row]));
    for (const variant of input.body.variants) {
      if (variant.sizeLabel) {
        const existing = variant.id ? existingById.get(variant.id) : undefined;
        const allowed =
          sizeLabels.has(variant.sizeLabel) || existing?.sizeLabel === variant.sizeLabel;
        if (!allowed) {
          throw new ValidationError(
            `Size "${variant.sizeLabel}" is not configured for this product`,
          );
        }
      }
      if (variant.colorLabel) {
        const existing = variant.id ? existingById.get(variant.id) : undefined;
        const allowed =
          colorNames.has(variant.colorLabel) || existing?.colorLabel === variant.colorLabel;
        if (!allowed) {
          throw new ValidationError(
            `Color "${variant.colorLabel}" is not configured for this product`,
          );
        }
      }
    }

    const { removedPublicIds } = await this.repository.replaceVariants(input.productId, input.body);
    await Promise.all(
      removedPublicIds.map((publicId) => deleteStoredCloudinaryAssetBestEffort(publicId)),
    );
    logger.info(
      {
        event: 'product_edit.variants_updated',
        siteCode: input.siteCode,
        userId: input.userId,
        productId: input.productId,
      },
      'Product variants updated',
    );
    return this.loadEditDto(input.siteId, input.siteCode, input.productId);
  }

  async updateCoupon(input: {
    siteId: string;
    siteCode: SiteCode;
    userId: string;
    productId: string;
    body: ProductCouponSectionBody;
  }): Promise<ProductEditDto> {
    await this.requireProduct(input.siteId, input.productId);
    if (input.body.couponId) {
      const coupon = await this.repository.findCouponById(input.siteId, input.body.couponId);
      if (!coupon || !coupon.isActive) {
        throw new ValidationError('Selected coupon is not available');
      }
    }
    await this.repository.replaceCoupon(input.productId, input.body);
    logger.info(
      {
        event: 'product_edit.coupon_updated',
        siteCode: input.siteCode,
        userId: input.userId,
        productId: input.productId,
      },
      'Product coupon updated',
    );
    return this.loadEditDto(input.siteId, input.siteCode, input.productId);
  }

  async updateTax(input: {
    siteId: string;
    siteCode: SiteCode;
    userId: string;
    productId: string;
    body: ProductTaxSectionBody;
  }): Promise<ProductEditDto> {
    await this.requireProduct(input.siteId, input.productId);
    await this.repository.upsertTax(input.productId, input.body);
    logger.info(
      {
        event: 'product_edit.tax_updated',
        siteCode: input.siteCode,
        userId: input.userId,
        productId: input.productId,
      },
      'Product tax updated',
    );
    return this.loadEditDto(input.siteId, input.siteCode, input.productId);
  }

  async clearTax(input: {
    siteId: string;
    siteCode: SiteCode;
    userId: string;
    productId: string;
  }): Promise<ProductEditDto> {
    await this.requireProduct(input.siteId, input.productId);
    await this.repository.deleteTax(input.productId);
    logger.info(
      {
        event: 'product_edit.tax_cleared',
        siteCode: input.siteCode,
        userId: input.userId,
        productId: input.productId,
      },
      'Product tax cleared',
    );
    return this.loadEditDto(input.siteId, input.siteCode, input.productId);
  }

  async updateGallery(input: {
    siteId: string;
    siteCode: SiteCode;
    userId: string;
    productId: string;
    body: ProductGallerySectionBody;
  }): Promise<ProductEditDto> {
    await this.requireProduct(input.siteId, input.productId);
    const normalizedBody: ProductGallerySectionBody = {
      bannerUrl: input.body.bannerUrl
        ? preferHttpsUrl(input.body.bannerUrl)
        : (input.body.bannerUrl ?? null),
      bannerPublicId: input.body.bannerPublicId ?? null,
      images: input.body.images.map((img) => ({
        ...img,
        imageUrl: preferHttpsUrl(img.imageUrl),
      })),
    };
    const { removedPublicIds } = await this.repository.replaceGallery(
      input.productId,
      normalizedBody,
    );
    await Promise.all(
      removedPublicIds.map((publicId) => deleteStoredCloudinaryAssetBestEffort(publicId)),
    );
    logger.info(
      {
        event: 'product_edit.gallery_updated',
        siteCode: input.siteCode,
        userId: input.userId,
        productId: input.productId,
      },
      'Product gallery updated',
    );
    return this.loadEditDto(input.siteId, input.siteCode, input.productId);
  }

  async updateVideos(input: {
    siteId: string;
    siteCode: SiteCode;
    userId: string;
    productId: string;
    body: ProductVideosSectionBody;
  }): Promise<ProductEditDto> {
    await this.requireProduct(input.siteId, input.productId);
    await this.repository.replaceVideos(input.productId, input.body);
    logger.info(
      {
        event: 'product_edit.videos_updated',
        siteCode: input.siteCode,
        userId: input.userId,
        productId: input.productId,
      },
      'Product videos updated',
    );
    return this.loadEditDto(input.siteId, input.siteCode, input.productId);
  }

  async updateDescription(input: {
    siteId: string;
    siteCode: SiteCode;
    userId: string;
    productId: string;
    body: ProductDescriptionSectionBody;
  }): Promise<ProductEditDto> {
    await this.requireProduct(input.siteId, input.productId);
    await this.repository.updateDescription(input.productId, input.body);
    logger.info(
      {
        event: 'product_edit.description_updated',
        siteCode: input.siteCode,
        userId: input.userId,
        productId: input.productId,
      },
      'Product description updated',
    );
    return this.loadEditDto(input.siteId, input.siteCode, input.productId);
  }

  async updateInfo(input: {
    siteId: string;
    siteCode: SiteCode;
    userId: string;
    productId: string;
    body: ProductInfoSectionBody;
  }): Promise<ProductEditDto> {
    await this.requireProduct(input.siteId, input.productId);
    await this.repository.replaceInfoSections(input.productId, input.body);
    logger.info(
      {
        event: 'product_edit.info_updated',
        siteCode: input.siteCode,
        userId: input.userId,
        productId: input.productId,
      },
      'Product info sections updated',
    );
    return this.loadEditDto(input.siteId, input.siteCode, input.productId);
  }

  async createEditorialReview(input: {
    siteId: string;
    siteCode: SiteCode;
    userId: string;
    productId: string;
    body: ProductEditorialReviewBody;
  }): Promise<ProductEditDto> {
    await this.requireProduct(input.siteId, input.productId);
    await this.repository.createEditorialReview(input.productId, input.body);
    logger.info(
      {
        event: 'product_edit.editorial_review_created',
        siteCode: input.siteCode,
        userId: input.userId,
        productId: input.productId,
      },
      'Product editorial review created',
    );
    return this.loadEditDto(input.siteId, input.siteCode, input.productId);
  }

  async updateEditorialReview(input: {
    siteId: string;
    siteCode: SiteCode;
    userId: string;
    productId: string;
    reviewId: string;
    body: ProductEditorialReviewBody;
  }): Promise<ProductEditDto> {
    await this.requireProduct(input.siteId, input.productId);
    const updated = await this.repository.updateEditorialReview(
      input.productId,
      input.reviewId,
      input.body,
    );
    if (!updated) {
      throw new NotFoundError('Review not found');
    }
    logger.info(
      {
        event: 'product_edit.editorial_review_updated',
        siteCode: input.siteCode,
        userId: input.userId,
        productId: input.productId,
        reviewId: input.reviewId,
      },
      'Product editorial review updated',
    );
    return this.loadEditDto(input.siteId, input.siteCode, input.productId);
  }

  async deleteEditorialReview(input: {
    siteId: string;
    siteCode: SiteCode;
    userId: string;
    productId: string;
    reviewId: string;
  }): Promise<ProductEditDto> {
    await this.requireProduct(input.siteId, input.productId);
    const deleted = await this.repository.deleteEditorialReview(input.productId, input.reviewId);
    if (!deleted) {
      throw new NotFoundError('Review not found');
    }
    if (deleted.imagePublicId) {
      await deleteStoredCloudinaryAssetBestEffort(deleted.imagePublicId);
    }
    logger.info(
      {
        event: 'product_edit.editorial_review_deleted',
        siteCode: input.siteCode,
        userId: input.userId,
        productId: input.productId,
        reviewId: input.reviewId,
      },
      'Product editorial review deleted',
    );
    return this.loadEditDto(input.siteId, input.siteCode, input.productId);
  }

  async updateTags(input: {
    siteId: string;
    siteCode: SiteCode;
    userId: string;
    productId: string;
    body: ProductTagsSectionBody;
  }): Promise<ProductEditDto> {
    await this.requireProduct(input.siteId, input.productId);
    await this.repository.replaceTags(input.siteId, input.productId, input.body);
    logger.info(
      {
        event: 'product_edit.tags_updated',
        siteCode: input.siteCode,
        userId: input.userId,
        productId: input.productId,
      },
      'Product tags updated',
    );
    return this.loadEditDto(input.siteId, input.siteCode, input.productId);
  }

  async updateHighlights(input: {
    siteId: string;
    siteCode: SiteCode;
    userId: string;
    productId: string;
    body: ProductHighlightsSectionBody;
  }): Promise<ProductEditDto> {
    await this.requireProduct(input.siteId, input.productId);
    await this.repository.replaceHighlights(input.productId, input.body);
    logger.info(
      {
        event: 'product_edit.highlights_updated',
        siteCode: input.siteCode,
        userId: input.userId,
        productId: input.productId,
      },
      'Product highlights updated',
    );
    return this.loadEditDto(input.siteId, input.siteCode, input.productId);
  }
}

export const productEditService = new ProductEditService();
