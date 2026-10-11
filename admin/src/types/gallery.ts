import type { SiteCode } from "@/types/auth";

export type GalleryMediaType = "image" | "video";

export type GalleryItemDto = {
  id: string;
  siteCode: SiteCode;
  mediaType: GalleryMediaType;
  mediaUrl: string;
  mediaPublicId: string;
  title: string;
  caption: string;
  active: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
};

export type GalleryItemFormValues = {
  mediaType: GalleryMediaType;
  mediaUrl: string;
  mediaPublicId: string;
  title: string;
  caption: string;
  active: boolean;
  order: string;
};

export type GalleryItemPayload = {
  mediaType: GalleryMediaType;
  mediaUrl: string;
  mediaPublicId: string;
  title: string;
  caption: string;
  active: boolean;
  order?: number;
};
