export type PublicMediaRef = {
  url: string;
  publicId: string;
};

export type PublicProductGalleryImage = {
  id: string;
  imageUrl: string;
  imagePublicId: string;
  isPrimary: boolean;
  sortOrder: number;
};

export type PublicProductSize = {
  id: string;
  label: string;
  sortOrder: number;
};

export type PublicProductColor = {
  id: string;
  name: string;
  hex: string | null;
  sortOrder: number;
};

export type ProductId = string;

export type PublicProductVariant = {
  id: string;
  sku: string | null;
  name: string;
  price: number;
  vendorPrice?: number | null;
  sizeLabel: string | null;
  colorLabel: string | null;
  weightGrams: number | null;
  quantity: number;
  isActive: boolean;
  profileImage: PublicMediaRef | null;
};

export type PublicProductVideo = {
  id: string;
  name: string;
  url: string;
  description: string;
  sortOrder: number;
};

export type PublicProductInfoSection = {
  id: string;
  title: string;
  body: string;
  sortOrder: number;
};

export type PublicProductEditorialReview = {
  id: string;
  createdByName: string;
  rating: number;
  title: string;
  body: string;
  imageUrl: string | null;
  sortOrder: number;
};

export type PublicProductTag = {
  id: string;
  name: string;
};

export type PublicProductHighlight = {
  id: string;
  text: string;
  sortOrder: number;
};

export type PublicProductCoupon = {
  couponId: string;
  code: string;
  type: string;
  value: number;
};

export type PublicRelatedProduct = {
  id: string;
  slug: string;
  name: string;
  categoryName: string | null;
  price: number;
  vendorPrice?: number | null;
  imageUrl: string | null;
  averageRating: number;
  reviewCount: number;
  defaultVariantId: string | null;
  quantity: number;
  coupon?: PublicProductCoupon | null;
  tax?: { cgst: number; sgst: number } | null;
};

/** Compact storefront card for landing rail / highlight columns / shop PLP. */
export type PublicProductCard = {
  id: string;
  siteCode: "IN" | "COM";
  slug: string;
  name: string;
  categoryName: string | null;
  /** TipTap/HTML overview; list view shows a plain-text excerpt. */
  description?: string | null;
  price: number;
  compareAtPrice?: number | null;
  /** Present when the session is a VENDOR (partner price). */
  vendorPrice?: number | null;
  imageUrl: string | null;
  averageRating: number;
  reviewCount: number;
  defaultVariantId: string | null;
  quantity: number;
  isFeatured: boolean;
  isRecent: boolean;
  isBestSeller: boolean;
  /** Product-linked default discount coupon. */
  coupon?: PublicProductCoupon | null;
  /** Optional product GST rates for cart tax. */
  tax?: { cgst: number; sgst: number } | null;
};

export type PublicProductListMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type PublicProductListResult = {
  items: PublicProductCard[];
  meta: PublicProductListMeta;
};

export type PublicProductFacetCategory = {
  id: string;
  name: string;
  slug: string;
  productCount: number;
  imageUrl: string | null;
};

export type PublicProductFacets = {
  categories: PublicProductFacetCategory[];
  price: { min: number; max: number };
};

export type CatalogAvailability = "in_stock" | "out_of_stock";

export type CatalogSort =
  | "default"
  | "rating"
  | "price_asc"
  | "price_desc";

export type CatalogViewMode = "list" | 2 | 3 | 4;

export type CatalogProductQuery = {
  q?: string;
  categorySlug?: string;
  priceMin?: number;
  priceMax?: number;
  availability?: CatalogAvailability;
  sort?: CatalogSort;
  page?: number;
  offset?: number;
  limit?: number;
};

export type PublicProductHighlights = {
  recent: PublicProductCard[];
  featured: PublicProductCard[];
  bestSellers: PublicProductCard[];
};

export type PublicProductDetail = {
  id: string;
  siteCode: "IN" | "COM";
  subcategoryId: string | null;
  productCode: string;
  name: string;
  slug: string;
  description: string;
  isFeatured: boolean;
  isRecent: boolean;
  isBestSeller: boolean;
  banner: PublicMediaRef | null;
  sizeChart: PublicMediaRef | null;
  gallery: PublicProductGalleryImage[];
  sizes: PublicProductSize[];
  colors: PublicProductColor[];
  variants: PublicProductVariant[];
  videos: PublicProductVideo[];
  infoSections: PublicProductInfoSection[];
  editorialReviews: PublicProductEditorialReview[];
  tags: PublicProductTag[];
  highlights: PublicProductHighlight[];
  tax: { cgst: number; sgst: number } | null;
  coupon: PublicProductCoupon | null;
  relatedProducts: PublicRelatedProduct[];
  averageRating: number;
  reviewCount: number;
};
