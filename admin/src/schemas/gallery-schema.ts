import { z } from "zod";

import type {
  GalleryItemFormValues,
  GalleryItemPayload,
} from "@/types/gallery";

export const galleryItemFormSchema = z.object({
  mediaType: z.enum(["image", "video"]),
  mediaUrl: z.string().trim().url("Please upload media"),
  mediaPublicId: z.string().trim().max(500),
  active: z.boolean(),
});

export type GalleryItemFormErrors = Partial<
  Record<"mediaType" | "mediaUrl" | "active", string>
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
        active: fieldErrors.active?.[0],
      },
    };
  }
  return { success: true, data: result.data };
}

export function toGalleryItemPayload(
  values: GalleryItemFormValues,
): GalleryItemPayload {
  return {
    mediaType: values.mediaType,
    mediaUrl: values.mediaUrl.trim(),
    mediaPublicId: values.mediaPublicId.trim(),
    active: values.active,
  };
}
