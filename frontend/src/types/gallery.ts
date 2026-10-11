export type GalleryMediaType = "image" | "video";

export type GalleryItem = {
  id: string;
  siteCode: "IN" | "COM";
  mediaType: GalleryMediaType;
  mediaUrl: string;
  mediaPublicId: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};
