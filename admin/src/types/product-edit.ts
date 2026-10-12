import type { SiteCode } from "@/types/auth";
import type { CatalogProductDto } from "@/types/catalog";

export type MediaRef = {
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
  profileImage: MediaRef | null;
  subImages: MediaRef[];
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
  text: string;
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
  sizeChart: MediaRef | null;
  banner: MediaRef | null;
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

export type ProductEditSectionKey =
  | "size"
  | "color"
  | "quantity"
  | "coupon"
  | "tax"
  | "gallery"
  | "video"
  | "description"
  | "info"
  | "review"
  | "tag"
  | "highlights";

export type ProductEditSection = {
  key: ProductEditSectionKey;
  label: string;
};

export const PRODUCT_EDIT_SECTIONS: ProductEditSection[] = [
  { key: "size", label: "Size Management" },
  { key: "color", label: "Color Management" },
  { key: "quantity", label: "Price / Quantity" },
  { key: "coupon", label: "Apply Coupon" },
  { key: "tax", label: "Apply Tax" },
  { key: "gallery", label: "Product Gallery" },
  { key: "video", label: "Video Management" },
  { key: "description", label: "Product Description" },
  { key: "info", label: "Product Information" },
  { key: "review", label: "Create Review" },
  { key: "tag", label: "Category Tag" },
  { key: "highlights", label: "Product Highlights" },
];

export type SiteScoped = { siteCode: SiteCode };
