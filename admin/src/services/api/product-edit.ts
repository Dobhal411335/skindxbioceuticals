import { apiClient } from "@/services/api/axios";
import { endpoints } from "@/services/api/endpoints";
import type { SiteCode } from "@/types/auth";
import type {
  CatalogColorDto,
  CatalogTagDto,
  ProductEditDto,
} from "@/types/product-edit";

interface ApiSuccess<T> {
  success: true;
  message: string;
  data: T;
}

type MediaUploadResponse = {
  media?: { id?: string; url?: string; publicId?: string | null };
  result?: { publicId?: string; url?: string; secureUrl?: string };
  url?: string;
  secureUrl?: string;
  publicId?: string;
};

function preferHttpsUrl(url: string): string {
  if (url.startsWith("http://res.cloudinary.com/")) {
    return `https://${url.slice("http://".length)}`;
  }
  return url;
}

/** Map media upload API `{ media, result }` into form image fields. */
export function resolveProductMediaUpload(data: MediaUploadResponse): {
  url: string;
  publicId: string;
} {
  const url = preferHttpsUrl(
    (
      data.result?.secureUrl ||
      data.media?.url ||
      data.result?.url ||
      data.secureUrl ||
      data.url ||
      ""
    ).trim(),
  );
  const publicId = (
    data.result?.publicId ||
    data.media?.publicId ||
    data.publicId ||
    ""
  ).trim();
  return { url, publicId };
}

export async function fetchProductEdit(
  siteCode: SiteCode,
  productId: string,
): Promise<ProductEditDto> {
  const { data } = await apiClient.get<ApiSuccess<ProductEditDto>>(
    endpoints.admin.productEdit(siteCode, productId),
  );
  return data.data;
}

export async function createCatalogColor(
  siteCode: SiteCode,
  body: { name: string; hex: string },
): Promise<CatalogColorDto> {
  const { data } = await apiClient.post<ApiSuccess<CatalogColorDto>>(
    endpoints.admin.productCatalogColors(siteCode),
    body,
  );
  return data.data;
}

export async function createCatalogTag(
  siteCode: SiteCode,
  body: { name: string },
): Promise<CatalogTagDto> {
  const { data } = await apiClient.post<ApiSuccess<CatalogTagDto>>(
    endpoints.admin.productCatalogTags(siteCode),
    body,
  );
  return data.data;
}

async function putSection<TBody>(
  siteCode: SiteCode,
  productId: string,
  section: string,
  body: TBody,
): Promise<ProductEditDto> {
  const { data } = await apiClient.put<ApiSuccess<ProductEditDto>>(
    endpoints.admin.productSection(siteCode, productId, section),
    body,
  );
  return data.data;
}

export function updateProductSizes(
  siteCode: SiteCode,
  productId: string,
  body: {
    sizeChartUrl?: string | null;
    sizeChartPublicId?: string | null;
    sizes: Array<{ label: string; active: boolean; sortOrder?: number }>;
  },
) {
  return putSection(siteCode, productId, "sizes", body);
}

export function updateProductColors(
  siteCode: SiteCode,
  productId: string,
  body: {
    colors: Array<{
      colorId?: string | null;
      name: string;
      hex?: string | null;
      active: boolean;
      sortOrder?: number;
    }>;
  },
) {
  return putSection(siteCode, productId, "colors", body);
}

export function updateProductVariants(
  siteCode: SiteCode,
  productId: string,
  body: {
    variants: Array<{
      id?: string;
      sizeLabel?: string | null;
      colorLabel?: string | null;
      price: number;
      vendorPrice?: number | null;
      quantity: number;
      weightGrams?: number | null;
      isActive?: boolean;
      profileImage?: { url: string; publicId: string } | null;
      subImages?: Array<{ url: string; publicId: string }>;
    }>;
  },
) {
  return putSection(siteCode, productId, "variants", body);
}

export function updateProductCoupon(
  siteCode: SiteCode,
  productId: string,
  body: { couponId: string | null },
) {
  return putSection(siteCode, productId, "coupon", body);
}

export function updateProductTax(
  siteCode: SiteCode,
  productId: string,
  body: { cgst: number; sgst: number },
) {
  return putSection(siteCode, productId, "tax", body);
}

export async function clearProductTax(
  siteCode: SiteCode,
  productId: string,
): Promise<ProductEditDto> {
  const { data } = await apiClient.delete<ApiSuccess<ProductEditDto>>(
    endpoints.admin.productSection(siteCode, productId, "tax"),
  );
  return data.data;
}

export function updateProductGallery(
  siteCode: SiteCode,
  productId: string,
  body: {
    bannerUrl?: string | null;
    bannerPublicId?: string | null;
    images: Array<{
      imageUrl: string;
      imagePublicId: string;
      isPrimary: boolean;
      sortOrder?: number;
    }>;
  },
) {
  return putSection(siteCode, productId, "gallery", body);
}

export function updateProductVideos(
  siteCode: SiteCode,
  productId: string,
  body: {
    videos: Array<{
      name: string;
      url: string;
      description?: string;
      sortOrder?: number;
    }>;
  },
) {
  return putSection(siteCode, productId, "videos", body);
}

export function updateProductDescription(
  siteCode: SiteCode,
  productId: string,
  body: { description: string },
) {
  return putSection(siteCode, productId, "description", body);
}

export function updateProductInfo(
  siteCode: SiteCode,
  productId: string,
  body: {
    sections: Array<{ title: string; body: string; sortOrder?: number }>;
  },
) {
  return putSection(siteCode, productId, "info", body);
}

export async function createProductEditorialReview(
  siteCode: SiteCode,
  productId: string,
  body: {
    createdByName: string;
    rating: number;
    title?: string;
    body: string;
    imageUrl?: string | null;
    imagePublicId?: string | null;
    active?: boolean;
  },
): Promise<ProductEditDto> {
  const { data } = await apiClient.post<ApiSuccess<ProductEditDto>>(
    endpoints.admin.productSection(siteCode, productId, "reviews"),
    body,
  );
  return data.data;
}

export async function updateProductEditorialReview(
  siteCode: SiteCode,
  productId: string,
  reviewId: string,
  body: {
    createdByName: string;
    rating: number;
    title?: string;
    body: string;
    imageUrl?: string | null;
    imagePublicId?: string | null;
    active?: boolean;
  },
): Promise<ProductEditDto> {
  const { data } = await apiClient.put<ApiSuccess<ProductEditDto>>(
    endpoints.admin.productEditorialReview(siteCode, productId, reviewId),
    body,
  );
  return data.data;
}

export async function deleteProductEditorialReview(
  siteCode: SiteCode,
  productId: string,
  reviewId: string,
): Promise<ProductEditDto> {
  const { data } = await apiClient.delete<ApiSuccess<ProductEditDto>>(
    endpoints.admin.productEditorialReview(siteCode, productId, reviewId),
  );
  return data.data;
}

export function updateProductTags(
  siteCode: SiteCode,
  productId: string,
  body: { tagNames: string[] },
) {
  return putSection(siteCode, productId, "tags", body);
}

export function updateProductHighlights(
  siteCode: SiteCode,
  productId: string,
  body: { highlights: string[] },
) {
  return putSection(siteCode, productId, "highlights", body);
}

export async function uploadProductImage(
  siteCode: SiteCode,
  file: File,
  entityId?: string | null,
): Promise<{ url: string; publicId: string }> {
  const formData = new FormData();
  formData.append("file", file);

  const { data } = await apiClient.post<ApiSuccess<MediaUploadResponse>>(
    endpoints.media.uploadImage,
    formData,
    {
      params: {
        siteCode,
        feature: "products",
        ...(entityId ? { entityId } : {}),
      },
      headers: { "Content-Type": "multipart/form-data" },
    },
  );

  return resolveProductMediaUpload(data.data);
}

/** Delete Cloudinary assets by publicId via existing media bulk-delete API. */
export async function deleteProductCloudinaryImages(
  publicIds: string[],
): Promise<void> {
  const ids = publicIds.map((id) => id.trim()).filter(Boolean);
  if (ids.length === 0) return;
  await apiClient.post(endpoints.media.bulkDelete, { publicIds: ids });
}
