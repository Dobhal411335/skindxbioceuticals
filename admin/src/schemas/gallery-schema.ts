import { z } from "zod";

import type {
  GalleryItemFormValues,
  GalleryItemPayload,
} from "@/types/gallery";

export const galleryItemFormSchema = z.object({
  mediaType: z.enum(["image", "video"]),
  mediaUrl: z.string().trim().url("Please upload media"),
  mediaPublicId: z.string().trim().max(500),
  title: z.string().trim().max(200),
  caption: z.string().trim().max(1000),
  active: z.boolean(),
  order: z.string().trim(),
});

export type GalleryItemFormErrors = Partial<
  Record<
    "mediaType" | "mediaUrl" | "title" | "caption" | "order" | "active",
    string
  >
>;

export function validateGalleryItemForm(
  values: GalleryItemFormValues,
):
  | { success: true; data: GalleryItemFormValues }
  | { success: false; errors: GalleryItemFormErrors } {
  const result = galleryItemFormSchema.safeParse(values);
  if (!result.success) {
    const fieldErrors = result.error.flatten().fieldErrors;
    return {
      success: false,
      errors: {
        mediaType: fieldErrors.mediaType?.[0],
        mediaUrl: fieldErrors.mediaUrl?.[0],
        title: fieldErrors.title?.[0],
        caption: fieldErrors.caption?.[0],
        order: fieldErrors.order?.[0],
        active: fieldErrors.active?.[0],
      },
    };
  }
  return { success: true, data: result.data };
}

export function toGalleryItemPayload(
  values: GalleryItemFormValues,
  fallbackOrder: number,
): GalleryItemPayload {
  const order =
    values.order.trim() === "" ? fallbackOrder : Number(values.order);

  return {
    mediaType: values.mediaType,
    mediaUrl: values.mediaUrl.trim(),
    mediaPublicId: values.mediaPublicId.trim(),
    title: values.title.trim(),
    caption: values.caption.trim(),
    active: values.active,
    order: Number.isFinite(order) ? order : fallbackOrder,
  };
}
