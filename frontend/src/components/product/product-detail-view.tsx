"use client";

import { useEffect, useState } from "react";

import { FrequentlyBought } from "@/components/product/frequently-bought";
import { ProductGallery } from "@/components/product/product-gallery";
import { ProductHighlights } from "@/components/product/product-highlights";
import { ProductInfoTabs } from "@/components/product/product-info-tabs";
import { ProductPdfsSection } from "@/components/product/product-pdfs-section";
import { ProductPurchasePanel } from "@/components/product/product-purchase-panel";
import { ProductRecommendations } from "@/components/product/product-recommendations";
import { ProductReviewsSection } from "@/components/product/product-reviews-section";
import { ProductStickyBar } from "@/components/product/product-sticky-bar";
import { ProductTrustSidebar } from "@/components/product/product-trust-sidebar";
import { ProductVideosSection } from "@/components/product/product-videos-section";
import { fetchProductBySlugClient } from "@/features/products/product.service";
import {
  defaultColor,
  defaultSize,
} from "@/features/products/product-selection";
import { useIsVendor } from "@/hooks/useIsVendor";
import type { PublicProductDetail } from "@/types/product";

/** First slice of the PDP related sample (API returns up to 15, shuffled per product). */
const FREQUENTLY_BOUGHT_LIMIT = 6;
/** Remaining related products after frequently bought, capped at 9. */
const RECOMMENDATION_LIMIT = 9;

type ProductDetailViewProps = {
  product: PublicProductDetail;
};

export function ProductDetailView({ product: initialProduct }: ProductDetailViewProps) {
  const isVendor = useIsVendor();
  const [product, setProduct] = useState(initialProduct);
  const [sizeId, setSizeId] = useState(defaultSize(initialProduct)?.id);
  const [colorId, setColorId] = useState(defaultColor(initialProduct)?.id);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    setProduct(initialProduct);
    setSizeId(defaultSize(initialProduct)?.id);
    setColorId(defaultColor(initialProduct)?.id);
    setQuantity(1);
  }, [initialProduct]);

  // SSR payload is guest-scoped; refetch with vendor JWT for partner prices.
  useEffect(() => {
    if (!isVendor) return;
    let cancelled = false;
    void (async () => {
      const next = await fetchProductBySlugClient(initialProduct.slug);
      if (!cancelled && next) {
        setProduct(next);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isVendor, initialProduct.slug]);

  const frequentlyBought = product.relatedProducts.slice(0, FREQUENTLY_BOUGHT_LIMIT);
  const remaining = product.relatedProducts.slice(
    FREQUENTLY_BOUGHT_LIMIT,
    FREQUENTLY_BOUGHT_LIMIT + RECOMMENDATION_LIMIT,
  );
  // When the catalog is smaller than both limits, still fill recommendations
  // from the same shuffled set instead of leaving that section out.
  const recommendations =
    remaining.length > 0
      ? remaining
      : product.relatedProducts.slice(0, RECOMMENDATION_LIMIT);

  return (
    <div className="">
      <div className="container-page section-space">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)_minmax(0,0.7fr)]">
          <ProductGallery images={product.gallery} productName={product.name} />
          <ProductPurchasePanel
            product={product}
            sizeId={sizeId}
            colorId={colorId}
            quantity={quantity}
            onSizeChange={setSizeId}
            onColorChange={setColorId}
            onQuantityChange={setQuantity}
          />
          <ProductTrustSidebar
            product={product}
            sizeId={sizeId}
            colorId={colorId}
          />
        </div>
      </div>

      <ProductPdfsSection productName={product.name} pdfs={product.pdfs ?? []} />
      <ProductVideosSection videos={product.videos ?? []} />
      <ProductHighlights highlights={product.highlights} />
      <ProductInfoTabs product={product} />
      <FrequentlyBought products={frequentlyBought} />
      <ProductReviewsSection product={product} />
      <ProductRecommendations products={recommendations} />
      <ProductStickyBar
        product={product}
        sizeId={sizeId}
        colorId={colorId}
        quantity={quantity}
        onSizeChange={setSizeId}
        onColorChange={setColorId}
        onQuantityChange={setQuantity}
      />
    </div>
  );
}
