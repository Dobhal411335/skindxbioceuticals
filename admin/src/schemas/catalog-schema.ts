import { z } from "zod";

import type {
  CatalogProductFormValues,
  CatalogProductPayload,
  CategoryFormValues,
  CategoryPayload,
  SubcategoryFormValues,
  SubcategoryPayload,
} from "@/types/catalog";

export type CategoryFormErrors = Partial<Record<"name", string>>;
export type SubcategoryFormErrors = Partial<Record<"name" | "bannerUrl", string>>;
export type CatalogProductFormErrors = Partial<
  Record<"productCode" | "name", string>
>;

const categorySchema = z.object({
  name: z.string().trim().min(1, "Category name is required").max(160),
  active: z.boolean(),
});

const subcategorySchema = z.object({
  name: z.string().trim().min(1, "Subcategory name is required").max(160),
  bannerUrl: z
    .string()
    .trim()
    .min(1, "Subcategory banner image is required")
    .url("Banner URL must be valid"),
  bannerPublicId: z.string().trim().max(500).default(""),
  active: z.boolean(),
});

const productSchema = z.object({
  productCode: z
    .string()
    .trim()
    .min(1, "Product code is required")
    .max(80)
    .regex(
      /^[A-Za-z0-9._-]+$/,
      "Product code may only contain letters, numbers, . _ -",
    ),
  name: z.string().trim().min(1, "Product name is required").max(200),
  active: z.boolean(),
  isFeatured: z.boolean(),
  isRecent: z.boolean(),
  isBestSeller: z.boolean(),
});

export function validateCategoryForm(
  values: CategoryFormValues,
): { ok: true; data: CategoryPayload } | { ok: false; errors: CategoryFormErrors } {
  const result = categorySchema.safeParse(values);
  if (!result.success) {
    return {
      ok: false,
      errors: {
        name: result.error.flatten().fieldErrors.name?.[0],
      },
    };
  }
  return {
    ok: true,
    data: {
      name: result.data.name,
      active: result.data.active,
    },
  };
}

export function validateSubcategoryForm(
  values: SubcategoryFormValues,
):
  | { ok: true; data: SubcategoryPayload }
  | { ok: false; errors: SubcategoryFormErrors } {
  const result = subcategorySchema.safeParse(values);
  if (!result.success) {
    const fieldErrors = result.error.flatten().fieldErrors;
    return {
      ok: false,
      errors: {
        name: fieldErrors.name?.[0],
        bannerUrl: fieldErrors.bannerUrl?.[0],
      },
    };
  }
  return {
    ok: true,
    data: {
      name: result.data.name,
      bannerUrl: result.data.bannerUrl,
      bannerPublicId: result.data.bannerPublicId,
      active: result.data.active,
    },
  };
}

export function validateCatalogProductForm(
  values: CatalogProductFormValues,
):
  | { ok: true; data: CatalogProductPayload }
  | { ok: false; errors: CatalogProductFormErrors } {
  const result = productSchema.safeParse(values);
  if (!result.success) {
    const fieldErrors = result.error.flatten().fieldErrors;
    return {
      ok: false,
      errors: {
        productCode: fieldErrors.productCode?.[0],
        name: fieldErrors.name?.[0],
      },
    };
  }
  return {
    ok: true,
    data: {
      productCode: result.data.productCode,
      name: result.data.name,
      active: result.data.active,
      isFeatured: result.data.isFeatured,
      isRecent: result.data.isRecent,
      isBestSeller: result.data.isBestSeller,
    },
  };
}
