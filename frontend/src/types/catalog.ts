export type PublicCategory = {
  id: string;
  siteCode: "IN" | "COM";
  name: string;
  slug: string;
  order: number;
};

export type PublicCatalogProduct = {
  id: string;
  productCode: string;
  name: string;
  slug: string;
  active: boolean;
};

export type PublicSubcategory = {
  id: string;
  name: string;
  slug: string;
  bannerUrl: string | null;
  order: number;
  products: PublicCatalogProduct[];
};

export type PublicCategoryDetail = PublicCategory & {
  description: string | null;
  subcategories: PublicSubcategory[];
};
