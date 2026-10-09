export type CatalogColor = {
  id: string;
  label: string;
  hex: string;
};

export type CatalogSize = {
  id: string;
  label: string;
  available: boolean;
};

export type CatalogImage = {
  id: string;
  src: string;
  alt: string;
};

export type CatalogProduct = {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  description: string;
  additionalInfo: string;
  shippingReturn: string;
  sku: string;
  version: string;
  productType: string;
  availability: "in_stock" | "out_of_stock";
  category: string;
  priceInPaise: number;
  compareAtPriceInPaise?: number;
  images: CatalogImage[];
  colors: CatalogColor[];
  sizes: CatalogSize[];
  pairsWith?: {
    id: string;
    slug: string;
    name: string;
    priceInPaise: number;
    image: string;
    alt: string;
  };
  bundle?: {
    id: string;
    slug: string;
    name: string;
    priceInPaise: number;
    image: string;
    alt: string;
  }[];
};

const products: CatalogProduct[] = [
  {
    id: "p1",
    slug: "daily-barrier-serum",
    name: "Daily Barrier Serum",
    shortDescription:
      "A lightweight serum prepared for everyday shelf use. Pack details and usage notes are listed below — this is product information, not medical advice.",
    description:
      "Daily Barrier Serum is presented with clear pack size and ingredient visibility where supplied. Use as directed on the label. SkinDx Bioceuticals does not claim diagnosis, treatment, or cure outcomes on this page.",
    additionalInfo:
      "Store away from direct sunlight and excessive heat. Keep out of reach of children. Full ingredient and caution text will follow the approved pack insert when published.",
    shippingReturn:
      "Domestic India shipping is calculated at checkout. Return eligibility depends on product type and condition — see the Returns policy before sending items back.",
    sku: "SDB-SER-30",
    version: "30 ml",
    productType: "Serum",
    availability: "in_stock",
    category: "Serums",
    priceInPaise: 149900,
    compareAtPriceInPaise: 179900,
    images: [
      {
        id: "i1",
        src: "https://images.unsplash.com/photo-1620916297397-a4a33220b72c?auto=format&fit=crop&w=1000&q=80",
        alt: "Daily Barrier Serum bottle front view",
      },
      {
        id: "i2",
        src: "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?auto=format&fit=crop&w=1000&q=80",
        alt: "Serum bottle with cream jar",
      },
      {
        id: "i3",
        src: "https://images.unsplash.com/photo-1612817288484-6f916006741a?auto=format&fit=crop&w=1000&q=80",
        alt: "Amber skincare bottle on table",
      },
    ],
    colors: [
      { id: "c1", label: "Clear", hex: "#d7dbe0" },
      { id: "c2", label: "Ivory", hex: "#e8dcc8" },
      { id: "c3", label: "Pearl", hex: "#f4f4f2" },
      { id: "c4", label: "Rose", hex: "#e8b4b8" },
      { id: "c5", label: "Sky", hex: "#a8c5d4" },
    ],
    sizes: [
      { id: "s1", label: "15 ml", available: true },
      { id: "s2", label: "30 ml", available: true },
      { id: "s3", label: "50 ml", available: true },
      { id: "s4", label: "100 ml", available: false },
    ],
    pairsWith: {
      id: "p2",
      slug: "hydra-soft-cream",
      name: "Hydra Soft Cream",
      priceInPaise: 99900,
      image:
        "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?auto=format&fit=crop&w=300&q=80",
      alt: "Hydra Soft Cream jar",
    },
    bundle: [
      {
        id: "p1",
        slug: "daily-barrier-serum",
        name: "Daily Barrier Serum",
        priceInPaise: 149900,
        image:
          "https://images.unsplash.com/photo-1620916297397-a4a33220b72c?auto=format&fit=crop&w=400&q=80",
        alt: "Daily Barrier Serum",
      },
      {
        id: "p2",
        slug: "hydra-soft-cream",
        name: "Hydra Soft Cream",
        priceInPaise: 99900,
        image:
          "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?auto=format&fit=crop&w=400&q=80",
        alt: "Hydra Soft Cream",
      },
      {
        id: "p3",
        slug: "gentle-cleansing-gel",
        name: "Gentle Cleansing Gel",
        priceInPaise: 69900,
        image:
          "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?auto=format&fit=crop&w=400&q=80",
        alt: "Gentle Cleansing Gel",
      },
      {
        id: "p5",
        slug: "vitamin-c-emulsion",
        name: "Vitamin C Emulsion",
        priceInPaise: 159900,
        image:
          "https://images.unsplash.com/photo-1612817288484-6f916006741a?auto=format&fit=crop&w=400&q=80",
        alt: "Vitamin C Emulsion",
      },
    ],
  },
  {
    id: "p2",
    slug: "hydra-soft-cream",
    name: "Hydra Soft Cream",
    shortDescription:
      "A soft daily moisturiser presentation for the India storefront demo catalogue.",
    description:
      "Hydra Soft Cream is listed with transparent pricing and pack information. Always follow the usage guidance printed on your pack.",
    additionalInfo:
      "Texture and fragrance details will match the approved product specification sheet.",
    shippingReturn:
      "Shipping and returns follow SkinDx Bioc policy pages once fulfilment is connected.",
    sku: "SDB-CRM-50",
    version: "50 ml",
    productType: "Moisturiser",
    availability: "in_stock",
    category: "Moisturisers",
    priceInPaise: 99900,
    images: [
      {
        id: "i1",
        src: "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?auto=format&fit=crop&w=1000&q=80",
        alt: "Hydra Soft Cream jar",
      },
      {
        id: "i2",
        src: "https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?auto=format&fit=crop&w=1000&q=80",
        alt: "Cream texture close-up",
      },
      {
        id: "i3",
        src: "https://images.unsplash.com/photo-1596755389378-c31d21fd1273?auto=format&fit=crop&w=1000&q=80",
        alt: "Skincare products on vanity",
      },
    ],
    colors: [
      { id: "c1", label: "White", hex: "#f5f5f5" },
      { id: "c2", label: "Cream", hex: "#efe6d6" },
    ],
    sizes: [
      { id: "s1", label: "30 ml", available: true },
      { id: "s2", label: "50 ml", available: true },
      { id: "s3", label: "100 ml", available: true },
    ],
  },
  {
    id: "p3",
    slug: "gentle-cleansing-gel",
    name: "Gentle Cleansing Gel",
    shortDescription: "A clear gel cleanser listing for catalogue and checkout UI demos.",
    description:
      "Gentle Cleansing Gel is shown with standard ecommerce product fields. Claims beyond approved copy are not displayed.",
    additionalInfo: "Rinse thoroughly. Avoid contact with eyes.",
    shippingReturn: "See shipping and returns policies for eligibility.",
    sku: "SDB-CLN-100",
    version: "100 ml",
    productType: "Cleanser",
    availability: "in_stock",
    category: "Cleansers",
    priceInPaise: 69900,
    images: [
      {
        id: "i1",
        src: "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?auto=format&fit=crop&w=1000&q=80",
        alt: "Gentle Cleansing Gel bottle",
      },
      {
        id: "i2",
        src: "https://images.unsplash.com/photo-1620916297397-a4a33220b72c?auto=format&fit=crop&w=1000&q=80",
        alt: "Serum bottle companion product",
      },
      {
        id: "i3",
        src: "https://images.unsplash.com/photo-1612817288484-6f916006741a?auto=format&fit=crop&w=1000&q=80",
        alt: "Bottle lineup",
      },
    ],
    colors: [{ id: "c1", label: "Clear", hex: "#dce8ec" }],
    sizes: [
      { id: "s1", label: "100 ml", available: true },
      { id: "s2", label: "200 ml", available: true },
    ],
  },
  {
    id: "p5",
    slug: "vitamin-c-emulsion",
    name: "Vitamin C Emulsion",
    shortDescription:
      "An emulsion presentation for the static storefront. Ingredient claims stay limited to approved copy.",
    description:
      "Vitamin C Emulsion is a demo catalogue entry with INR pricing and pack metadata for the PDP layout.",
    additionalInfo: "Keep tightly closed after use.",
    shippingReturn: "Domestic shipping rates appear at checkout when live.",
    sku: "SDB-VCE-30",
    version: "30 ml",
    productType: "Emulsion",
    availability: "in_stock",
    category: "Serums",
    priceInPaise: 159900,
    images: [
      {
        id: "i1",
        src: "https://images.unsplash.com/photo-1612817288484-6f916006741a?auto=format&fit=crop&w=1000&q=80",
        alt: "Vitamin C Emulsion bottle",
      },
      {
        id: "i2",
        src: "https://images.unsplash.com/photo-1620916297397-a4a33220b72c?auto=format&fit=crop&w=1000&q=80",
        alt: "Dropper bottle",
      },
      {
        id: "i3",
        src: "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?auto=format&fit=crop&w=1000&q=80",
        alt: "Cream and bottle set",
      },
    ],
    colors: [
      { id: "c1", label: "Amber", hex: "#c9842f" },
      { id: "c2", label: "Gold", hex: "#d4b483" },
    ],
    sizes: [
      { id: "s1", label: "15 ml", available: true },
      { id: "s2", label: "30 ml", available: true },
    ],
  },
];

export function getAllProducts() {
  return products;
}

export function getAllProductSlugs() {
  return products.map((product) => product.slug);
}

export function getProductBySlug(slug: string) {
  return products.find((product) => product.slug === slug) ?? null;
}

export function getRecommendedProducts(excludeSlug?: string) {
  return products.filter((product) => product.slug !== excludeSlug).slice(0, 4);
}
