export type ProductId = string;

export type ProductVariant = {
  id: string;
  sku: string;
  name: string;
  priceInPaise: number;
  compareAtPriceInPaise?: number;
  inventoryQuantity?: number;
  attributes?: Record<string, string>;
};

export type Product = {
  id: ProductId;
  slug: string;
  name: string;
  description?: string;
  categoryIds?: string[];
  variants?: ProductVariant[];
  isActive?: boolean;
};

export type ProductCategory = {
  id: string;
  slug: string;
  name: string;
  parentId?: string | null;
};
