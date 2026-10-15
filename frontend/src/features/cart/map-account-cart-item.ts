import { rupeesToPaise } from "@/features/products/product-selection";
import type { AccountCartItem } from "@/features/cart/cart.types";
import type { CartItem } from "@/types/cart";

/** Map server cart DTO → Redux cart line (prices converted to paise). */
export function mapAccountCartItemToCartItem(
  item: AccountCartItem,
  fallbackImage?: string,
): CartItem {
  const listPaise = rupeesToPaise(Number(item.listPrice));
  const unitPaise = rupeesToPaise(Number(item.unitPrice));
  const discountPaise = rupeesToPaise(Number(item.discountAmount));
  const hasDiscount = discountPaise > 0 && listPaise > unitPaise;

  return {
    id: item.id,
    productId: item.productId,
    variantId: item.variantId,
    slug: item.productSlug,
    name: item.productName,
    image: item.imageUrl || fallbackImage || "",
    alt: item.productName,
    categoryName: item.categoryName ?? null,
    productCode: item.productCode ?? null,
    variantLabel: item.variantName,
    quantity: item.quantity,
    unitPriceInPaise: unitPaise,
    originalUnitPriceInPaise: hasDiscount ? listPaise : undefined,
    discountCode: item.discountCode,
    discountInPaise: hasDiscount ? discountPaise : undefined,
    cgstPercent: item.cgstPercent ?? 0,
    sgstPercent: item.sgstPercent ?? 0,
  };
}
