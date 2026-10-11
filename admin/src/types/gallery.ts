import type { SiteCode } from "@/types/auth";

export type GalleryMediaType = "image" | "video";

export type GalleryItemDto = {
  id: string;
  siteCode: SiteCode;
  mediaType: GalleryMediaType;
  mediaUrl: string;
  mediaPublicId: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type GalleryItemFormValues = {
  mediaType: GalleryMediaType;
  mediaUrl: string;
  mediaPublicId: string;
  active: boolean;
};

export type GalleryItemPayload = {
  mediaType: GalleryMediaType;
  mediaUrl: string;
  mediaPublicId: string;
  active: boolean;
};

/** Local object-URL preview shown in the grid while Cloudinary upload is in flight. */
export type GalleryPendingUpload = {
  id: string;
  fileName: string;
  mediaType: GalleryMediaType;
  previewUrl: string;
};
