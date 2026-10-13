import {
  availableColors,
  availableSizes,
  buildVariantSelectOptions,
  defaultColor,
  defaultSize,
  findExactVariant,
  findMatchingVariant,
  firstCompatibleColor,
  firstCompatibleSize,
  colorHasStock,
  isColorCompatibleWithSize,
  isSizeCompatibleWithColor,
  rupeesToPaise,
  sizeHasStock,
} from "@/features/products/product-selection";
import type { PublicProductDetail } from "@/types/product";

function makeProduct(
  overrides: Partial<PublicProductDetail> = {},
): PublicProductDetail {
  return {
    id: "p1",
    siteCode: "IN",
    subcategoryId: "sub-1",
    productCode: "VC-01",
    name: "Vitamin C Serum",
    slug: "vitamin-c-serum",
    description: "<p>Overview</p>",
    isFeatured: false,
    isRecent: false,
    isBestSeller: false,
    averageRating: 0,
    reviewCount: 0,
    banner: null,
    sizeChart: null,
    gallery: [],
    sizes: [
      { id: "s1", label: "S", sortOrder: 0 },
      { id: "s2", label: "M", sortOrder: 1 },
      { id: "s3", label: "L", sortOrder: 2 },
      { id: "s4", label: "XL", sortOrder: 3 },
    ],
    colors: [
      { id: "c1", name: "Beige", hex: "#f5f0e6", sortOrder: 0 },
      { id: "c2", name: "Black", hex: "#111", sortOrder: 1 },
    ],
    variants: [
      {
        id: "v1",
        sku: null,
        name: "S / Beige",
        price: 150,
        sizeLabel: "S",
        colorLabel: "Beige",
        quantity: 10,
        isActive: true,
        profileImage: null,
      },
      {
        id: "v2",
        sku: null,
        name: "L / Black",
        price: 200,
        sizeLabel: "L",
        colorLabel: "Black",
        quantity: 500,
        isActive: true,
        profileImage: null,
      },
    ],
    videos: [],
    infoSections: [],
    editorialReviews: [],
    tags: [],
    highlights: [],
    tax: null,
    coupon: null,
    relatedProducts: [],
    ...overrides,
  };
}

describe("product selection helpers", () => {
  it("converts rupees to paise", () => {
    expect(rupeesToPaise(1499)).toBe(149900);
  });

  it("lists only sizes and colours used by active variants", () => {
    const product = makeProduct();
    expect(availableSizes(product).map((size) => size.label)).toEqual([
      "S",
      "L",
    ]);
    expect(availableColors(product).map((color) => color.name)).toEqual([
      "Beige",
      "Black",
    ]);
  });

  it("defaults to the first in-stock size and a compatible colour", () => {
    const product = makeProduct();
    expect(defaultSize(product)?.label).toBe("S");
    expect(defaultColor(product)?.name).toBe("Beige");
  });

  it("matches an exact variant by size and colour", () => {
    const product = makeProduct();
    const matched = findExactVariant(product, "L", "Black");
    expect(matched?.id).toBe("v2");
    expect(matched?.price).toBe(200);
    expect(matched?.quantity).toBe(500);
  });

  it("does not fall back to another variant for an invalid pair", () => {
    const product = makeProduct();
    expect(findExactVariant(product, "S", "Black")).toBeUndefined();
    expect(findMatchingVariant(product, "S", "Black")).toBeUndefined();
  });

  it("marks stock and pair compatibility separately", () => {
    const product = makeProduct();
    expect(sizeHasStock(product, "S")).toBe(true);
    expect(sizeHasStock(product, "M")).toBe(false);
    expect(colorHasStock(product, "Black")).toBe(true);
    expect(isColorCompatibleWithSize(product, "Beige", "S")).toBe(true);
    expect(isColorCompatibleWithSize(product, "Black", "S")).toBe(false);
    expect(isSizeCompatibleWithColor(product, "L", "Black")).toBe(true);
    expect(isSizeCompatibleWithColor(product, "S", "Black")).toBe(false);
  });

  it("finds the first compatible partner option", () => {
    const product = makeProduct();
    expect(firstCompatibleColor(product, "L")?.name).toBe("Black");
    expect(firstCompatibleSize(product, "Beige")?.label).toBe("S");
  });

  it("builds select options only for real variant combinations with prices", () => {
    const product = makeProduct();
    const options = buildVariantSelectOptions(product);
    expect(options).toHaveLength(2);
    expect(options[0]).toMatchObject({
      label: "Beige / S — ₹150",
      price: 150,
      quantity: 10,
    });
    expect(options[1]).toMatchObject({
      label: "Black / L — ₹200",
      price: 200,
      quantity: 500,
    });
  });

  it("supports base-price products with no sizes or colours", () => {
    const product = makeProduct({
      sizes: [],
      colors: [],
      variants: [
        {
          id: "v-base",
          sku: null,
          name: "Default",
          price: 999,
          sizeLabel: null,
          colorLabel: null,
          quantity: 12,
          isActive: true,
          profileImage: null,
        },
      ],
    });

    expect(availableSizes(product)).toEqual([]);
    expect(availableColors(product)).toEqual([]);
    expect(defaultSize(product)).toBeUndefined();
    expect(defaultColor(product)).toBeUndefined();
    expect(findMatchingVariant(product, null, null)?.id).toBe("v-base");
    expect(findExactVariant(product, null, null)?.price).toBe(999);
    expect(buildVariantSelectOptions(product)).toEqual([]);
  });
});
