export type GalleryMediaType = "image" | "video";

export type GalleryItem = {
  id: string;
  siteCode: "IN" | "COM";
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
