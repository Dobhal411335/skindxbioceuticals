import { apiClient } from "@/services/api/axios";
import { endpoints } from "@/services/api/endpoints";
import type { SiteCode } from "@/types/auth";
import type {
  CatalogProductDto,
  CatalogProductPayload,
  CategoryDto,
  CategoryPayload,
} from "@/types/catalog";

interface ApiSuccess<T> {
  success: true;
  message: string;
  data: T;
}

type MediaUploadResponse = {
  media: { id: string; url: string; publicId?: string | null };
  result?: { publicId?: string; url?: string; secureUrl?: string };
  secureUrl?: string;
  publicId?: string;
};

function resolveMediaUrl(data: MediaUploadResponse): { url: string; publicId: string } {
  const url =
    data.result?.secureUrl ||
    data.media.url ||
    data.result?.url ||
    data.secureUrl ||
    "";
  const publicId =
    data.result?.publicId || data.media.publicId || data.publicId || "";
  return { url, publicId };
}

export async function fetchCategories(siteCode: SiteCode): Promise<CategoryDto[]> {
  const { data } = await apiClient.get<ApiSuccess<CategoryDto[]>>(
    endpoints.admin.categories(siteCode),
  );
  return data.data;
}

export async function createCategory(
  siteCode: SiteCode,
  body: CategoryPayload,
): Promise<CategoryDto> {
  const { data } = await apiClient.post<ApiSuccess<CategoryDto>>(
    endpoints.admin.categories(siteCode),
    body,
  );
  return data.data;
}

export async function updateCategory(
  siteCode: SiteCode,
  categoryId: string,
  body: CategoryPayload,
): Promise<CategoryDto> {
  const { data } = await apiClient.put<ApiSuccess<CategoryDto>>(
    endpoints.admin.category(siteCode, categoryId),
    body,
  );
  return data.data;
}

export async function deleteCategory(
  siteCode: SiteCode,
  categoryId: string,
): Promise<void> {
  await apiClient.delete(endpoints.admin.category(siteCode, categoryId));
}

export async function fetchSubcategories(
  siteCode: SiteCode,
  categoryId: string,
): Promise<CategoryDto[]> {
  const { data } = await apiClient.get<ApiSuccess<CategoryDto[]>>(
    endpoints.admin.subcategories(siteCode, categoryId),
  );
  return data.data;
}

export async function createSubcategory(
  siteCode: SiteCode,
  categoryId: string,
  body: { name: string; active?: boolean },
): Promise<CategoryDto> {
  const { data } = await apiClient.post<ApiSuccess<CategoryDto>>(
    endpoints.admin.subcategories(siteCode, categoryId),
    body,
  );
  return data.data;
}

export async function updateSubcategory(
  siteCode: SiteCode,
  categoryId: string,
  subcategoryId: string,
  body: { name: string; active: boolean },
): Promise<CategoryDto> {
  const { data } = await apiClient.put<ApiSuccess<CategoryDto>>(
    endpoints.admin.subcategory(siteCode, categoryId, subcategoryId),
    body,
  );
  return data.data;
}

export async function deleteSubcategory(
  siteCode: SiteCode,
  categoryId: string,
  subcategoryId: string,
): Promise<void> {
  await apiClient.delete(
    endpoints.admin.subcategory(siteCode, categoryId, subcategoryId),
  );
}

export async function fetchSubcategoryProducts(
  siteCode: SiteCode,
  subcategoryId: string,
): Promise<CatalogProductDto[]> {
  const { data } = await apiClient.get<ApiSuccess<CatalogProductDto[]>>(
    endpoints.admin.subcategoryProducts(siteCode, subcategoryId),
  );
  return data.data;
}

export async function createSubcategoryProduct(
  siteCode: SiteCode,
  subcategoryId: string,
  body: CatalogProductPayload,
): Promise<CatalogProductDto> {
  const { data } = await apiClient.post<ApiSuccess<CatalogProductDto>>(
    endpoints.admin.subcategoryProducts(siteCode, subcategoryId),
    body,
  );
  return data.data;
}

export async function updateSubcategoryProduct(
  siteCode: SiteCode,
  subcategoryId: string,
  productId: string,
  body: CatalogProductPayload,
): Promise<CatalogProductDto> {
  const { data } = await apiClient.put<ApiSuccess<CatalogProductDto>>(
    endpoints.admin.subcategoryProduct(siteCode, subcategoryId, productId),
    body,
  );
  return data.data;
}

export async function patchSubcategoryProduct(
  siteCode: SiteCode,
  subcategoryId: string,
  productId: string,
  body: { active?: boolean; name?: string; productCode?: string },
): Promise<CatalogProductDto> {
  const { data } = await apiClient.patch<ApiSuccess<CatalogProductDto>>(
    endpoints.admin.subcategoryProduct(siteCode, subcategoryId, productId),
    body,
  );
  return data.data;
}

export async function deleteSubcategoryProduct(
  siteCode: SiteCode,
  subcategoryId: string,
  productId: string,
): Promise<void> {
  await apiClient.delete(
    endpoints.admin.subcategoryProduct(siteCode, subcategoryId, productId),
  );
}

export async function uploadCategoryBanner(
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
        feature: "categories",
        ...(entityId ? { entityId } : {}),
      },
      headers: { "Content-Type": "multipart/form-data" },
    },
  );

  return resolveMediaUrl(data.data);
}
