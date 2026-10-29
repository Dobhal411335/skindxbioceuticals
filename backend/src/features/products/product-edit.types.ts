import type { SiteCode } from '@/types/common';
import type { CatalogProductDto } from './product.types';

export type MediaRefDto = {
  url: string;
  publicId: string;
};

export type ProductSizeDto = {
  id: string;
  label: string;
  sortOrder: number;
  active: boolean;
};

export type CatalogColorDto = {
  id: string;
  name: string;
  hex: string;
};

export type ProductColorDto = {
  id: string;
  colorId: string | null;
  name: string;
  hex: string | null;
  sortOrder: number;
  active: boolean;
};

export type ProductVariantOfferDto = {
  id: string;
  sku: string | null;
  name: string;
  price: number;
  vendorPrice: number | null;
  sizeLabel: string | null;
  colorLabel: string | null;
  weightGrams: number | null;
  quantity: number;
  isActive: boolean;
  profileImage: MediaRefDto | null;
  subImages: MediaRefDto[];
};

export type ProductGalleryImageDto = {
  id: string;
  imageUrl: string;
  imagePublicId: string;
  isPrimary: boolean;
  sortOrder: number;
};

export type ProductVideoDto = {
  id: string;
  name: string;
  url: string;
  description: string;
  sortOrder: number;
};

export type ProductInfoSectionDto = {
  id: string;
  title: string;
  body: string;
  sortOrder: number;
};

export type ProductEditorialReviewDto = {
  id: string;
  createdByName: string;
  rating: number;
  title: string;
  body: string;
  imageUrl: string | null;
  imagePublicId: string | null;
  active: boolean;
  sortOrder: number;
};

export type CatalogTagDto = {
  id: string;
  name: string;
};

export type ProductHighlightDto = {
  id: string;
  question: string;
  answer: string;
  sortOrder: number;
};

export type ProductTaxDto = {
  cgst: number;
  sgst: number;
} | null;

export type ProductCouponDto = {
  couponId: string;
  code: string;
  type: string;
  value: number;
} | null;

export type CouponOptionDto = {
  id: string;
  code: string;
  type: string;
  value: number;
  isActive: boolean;
};

export type ProductEditDto = {
  product: CatalogProductDto;
  sizeChart: MediaRefDto | null;
  banner: MediaRefDto | null;
  sizes: ProductSizeDto[];
  colors: ProductColorDto[];
  catalogColors: CatalogColorDto[];
  variants: ProductVariantOfferDto[];
  gallery: ProductGalleryImageDto[];
  videos: ProductVideoDto[];
  description: string;
  infoSections: ProductInfoSectionDto[];
  editorialReviews: ProductEditorialReviewDto[];
  tags: CatalogTagDto[];
  catalogTags: CatalogTagDto[];
  highlights: ProductHighlightDto[];
  tax: ProductTaxDto;
  coupon: ProductCouponDto;
  availableCoupons: CouponOptionDto[];
};

export type SiteCodeDto = SiteCode;
