export interface WishlistItemDto {
  id: string;
  productId: string;
  variantId: string | null;
  productName: string;
  productSlug: string;
  imageUrl: string | null;
  price: string | null;
  currency: string | null;
  available: boolean;
  createdAt: string;
}

export interface WishlistDto {
  id: string;
  items: WishlistItemDto[];
}
