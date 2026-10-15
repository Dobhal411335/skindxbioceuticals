import type { ProductStatus } from '@prisma/client';
import type { SiteCode } from '@/types/common';

export type SiteCodeDto = SiteCode;

export type ProductRecord = {
  id: string;
  siteId: string;
  subcategoryId: string | null;
  productCode: string;
  name: string;
  slug: string;
  description: string | null;
  status: ProductStatus;
  isFeatured: boolean;
  isRecent: boolean;
  isBestSeller: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type ProductWrite = {
  subcategoryId: string;
  productCode: string;
  name: string;
  slug: string;
  description: string | null;
  status: ProductStatus;
  isFeatured: boolean;
  isRecent: boolean;
  isBestSeller: boolean;
};

export type CatalogProductDto = {
  id: string;
  siteCode: SiteCodeDto;
  subcategoryId: string | null;
  productCode: string;
  name: string;
  slug: string;
  description: string | null;
  active: boolean;
  isFeatured: boolean;
  isRecent: boolean;
  isBestSeller: boolean;
  createdAt: string;
  updatedAt: string;
};

export type PublicProductCouponDto = {
  couponId: string;
  code: string;
  type: string;
  value: number;
} | null;

/** Compact storefront card used by landing rail / highlight columns / shop PLP. */
export type PublicProductCardDto = {
  id: string;
  siteCode: SiteCodeDto;
  slug: string;
  name: string;
  categoryName: string | null;
  /** TipTap/HTML overview; storefront list view may render a plain-text excerpt. */
  description: string | null;
  price: number;
  compareAtPrice: number | null;
  imageUrl: string | null;
  averageRating: number;
  reviewCount: number;
  defaultVariantId: string | null;
  quantity: number;
  isFeatured: boolean;
  isRecent: boolean;
  isBestSeller: boolean;
  /** Product-linked default discount coupon (same shape as detail). */
  coupon: PublicProductCouponDto;
  /** Optional product GST rates for cart tax display. */
  tax: { cgst: number; sgst: number } | null;
};

export type PublicProductListMetaDto = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type PublicProductListResultDto = {
  items: PublicProductCardDto[];
  meta: PublicProductListMetaDto;
};

export type PublicProductFacetCategoryDto = {
  id: string;
  name: string;
  slug: string;
  productCount: number;
  imageUrl: string | null;
};

export type PublicProductFacetsDto = {
  categories: PublicProductFacetCategoryDto[];
  price: { min: number; max: number };
};

export type PublicProductHighlightsDto = {
  recent: PublicProductCardDto[];
  featured: PublicProductCardDto[];
  bestSellers: PublicProductCardDto[];
};

export type PublicMediaRefDto = {
  url: string;
  publicId: string;
};

export type PublicProductGalleryImageDto = {
  id: string;
  imageUrl: string;
  imagePublicId: string;
  isPrimary: boolean;
  sortOrder: number;
};

export type PublicProductSizeDto = {
  id: string;
  label: string;
  sortOrder: number;
};

export type PublicProductColorDto = {
  id: string;
  name: string;
  hex: string | null;
  sortOrder: number;
};

export type PublicProductVariantDto = {
  id: string;
  sku: string | null;
  name: string;
  price: number;
  sizeLabel: string | null;
  colorLabel: string | null;
  weightGrams: number | null;
  quantity: number;
  isActive: boolean;
  profileImage: PublicMediaRefDto | null;
};

export type PublicProductVideoDto = {
  id: string;
  name: string;
  url: string;
  description: string;
  sortOrder: number;
};

export type PublicProductInfoSectionDto = {
  id: string;
  title: string;
  body: string;
  sortOrder: number;
};

export type PublicProductEditorialReviewDto = {
  id: string;
  createdByName: string;
  rating: number;
  title: string;
  body: string;
  imageUrl: string | null;
  sortOrder: number;
};

export type PublicProductTagDto = {
  id: string;
  name: string;
};

export type PublicProductHighlightDto = {
  id: string;
  text: string;
  sortOrder: number;
};

export type PublicProductTaxDto = {
  cgst: number;
  sgst: number;
} | null;

export type PublicRelatedProductDto = {
  id: string;
  slug: string;
  name: string;
  categoryName: string | null;
  price: number;
  imageUrl: string | null;
  averageRating: number;
  reviewCount: number;
  defaultVariantId: string | null;
  quantity: number;
  coupon: PublicProductCouponDto;
  tax: { cgst: number; sgst: number } | null;
};

export type PublicProductDetailDto = {
  id: string;
  siteCode: SiteCodeDto;
  subcategoryId: string | null;
  productCode: string;
  name: string;
  slug: string;
  description: string;
  isFeatured: boolean;
  isRecent: boolean;
  isBestSeller: boolean;
  banner: PublicMediaRefDto | null;
  sizeChart: PublicMediaRefDto | null;
  gallery: PublicProductGalleryImageDto[];
  sizes: PublicProductSizeDto[];
  colors: PublicProductColorDto[];
  variants: PublicProductVariantDto[];
  videos: PublicProductVideoDto[];
  infoSections: PublicProductInfoSectionDto[];
  editorialReviews: PublicProductEditorialReviewDto[];
  tags: PublicProductTagDto[];
  highlights: PublicProductHighlightDto[];
  tax: PublicProductTaxDto;
  coupon: PublicProductCouponDto;
  relatedProducts: PublicRelatedProductDto[];
  averageRating: number;
  reviewCount: number;
};
