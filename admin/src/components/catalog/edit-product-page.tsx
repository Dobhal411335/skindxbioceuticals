"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Package } from "lucide-react";

import {
  ColorManagementSection,
  CouponSection,
  DescriptionSection,
  GallerySection,
  HighlightsSection,
  InfoSection,
  QuantityManagementSection,
  ReviewSection,
  SizeManagementSection,
  TagsSection,
  TaxSection,
  VideoSection,
} from "@/components/catalog/edit-product-sections";
import { AdminAppShell } from "@/components/layout/admin-app-shell";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { fetchProductEdit } from "@/services/api/product-edit";
import { ApiError } from "@/services/api/errors";
import type { SiteCode } from "@/types/auth";
import {
  PRODUCT_EDIT_SECTIONS,
  type ProductEditDto,
  type ProductEditSectionKey,
} from "@/types/product-edit";

export function EditProductPage({
  siteCode,
  productId,
}: {
  siteCode: SiteCode;
  productId: string;
}) {
  const [data, setData] = useState<ProductEditDto | null>(null);
  const [activeSection, setActiveSection] =
    useState<ProductEditSectionKey>("size");
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const payload = await fetchProductEdit(siteCode, productId);
      setData(payload);
    } catch (error) {
      setLoadError(
        error instanceof ApiError
          ? error.message
          : "Failed to load product details",
      );
    } finally {
      setIsLoading(false);
    }
  }, [siteCode, productId]);

  useEffect(() => {
    void load();
  }, [load]);

  const backHref = data?.product.subcategoryId
    ? `/admin/${siteCode.toLowerCase()}/products/subcategories/${data.product.subcategoryId}/products`
    : `/admin/${siteCode.toLowerCase()}/products/manage-category`;

  const title = data?.product.name ?? "Edit Product";

  return (
    <AdminAppShell
      siteCode={siteCode}
      title={title}
      description="Manage full product details by section."
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <Button asChild variant="outline" size="sm">
            <Link href={backHref}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to products
            </Link>
          </Button>
          {data ? (
            <div className="flex min-w-[240px] flex-1 items-center gap-2">
              <Package className="h-4 w-4 text-muted-foreground" />
              <div className="w-full max-w-md space-y-1">
                <Label htmlFor="edit-product-name" className="sr-only">
                  Product name
                </Label>
                <Input
                  id="edit-product-name"
                  value={data.product.name}
                  disabled
                  readOnly
                />
              </div>
            </div>
          ) : null}
        </div>

        {loadError ? (
          <Alert variant="destructive">
            <AlertTitle>Could not load product</AlertTitle>
            <AlertDescription>{loadError}</AlertDescription>
          </Alert>
        ) : null}

        {isLoading || !data ? (
          <Card>
            <CardContent className="py-12 text-center text-sm text-muted-foreground">
              {isLoading ? "Loading product…" : "Product not found."}
            </CardContent>
          </Card>
        ) : (
          <div className="flex flex-col gap-4 lg:flex-row">
            <aside className="w-full shrink-0 lg:w-56">
              <Card className="border-border bg-card shadow-sm">
                <CardHeader className="border-b border-border/70 py-3">
                  <CardTitle className="text-sm font-semibold">
                    Product sections
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Choose a section to edit
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-1 p-2">
                  {PRODUCT_EDIT_SECTIONS.map((section) => (
                    <button
                      key={section.key}
                      type="button"
                      onClick={() => setActiveSection(section.key)}
                      className={cn(
                        "w-full rounded-md px-3 py-2 text-left text-sm font-medium transition-colors",
                        activeSection === section.key
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted/60 text-foreground hover:bg-muted",
                      )}
                    >
                      {section.label}
                    </button>
                  ))}
                </CardContent>
              </Card>
            </aside>

            <Card className="min-w-0 flex-1 border-border bg-card shadow-sm">
              <CardHeader className="border-b border-border/70">
                <CardTitle className="text-lg font-semibold">
                  {
                    PRODUCT_EDIT_SECTIONS.find((s) => s.key === activeSection)
                      ?.label
                  }
                </CardTitle>
                <CardDescription>
                  Changes save for this section only.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                {activeSection === "size" ? (
                  <SizeManagementSection
                    key={`size-${data.product.updatedAt}`}
                    siteCode={siteCode}
                    productId={productId}
                    data={data}
                    onUpdated={setData}
                  />
                ) : null}
                {activeSection === "color" ? (
                  <ColorManagementSection
                    key={`color-${data.product.updatedAt}`}
                    siteCode={siteCode}
                    productId={productId}
                    data={data}
                    onUpdated={setData}
                  />
                ) : null}
                {activeSection === "quantity" ? (
                  <QuantityManagementSection
                    key={`qty-${data.product.updatedAt}`}
                    siteCode={siteCode}
                    productId={productId}
                    data={data}
                    onUpdated={setData}
                  />
                ) : null}
                {activeSection === "coupon" ? (
                  <CouponSection
                    key={`coupon-${data.product.updatedAt}`}
                    siteCode={siteCode}
                    productId={productId}
                    data={data}
                    onUpdated={setData}
                  />
                ) : null}
                {activeSection === "tax" ? (
                  <TaxSection
                    key={`tax-${data.product.updatedAt}`}
                    siteCode={siteCode}
                    productId={productId}
                    data={data}
                    onUpdated={setData}
                  />
                ) : null}
                {activeSection === "gallery" ? (
                  <GallerySection
                    key={`gallery-${data.product.updatedAt}`}
                    siteCode={siteCode}
                    productId={productId}
                    data={data}
                    onUpdated={setData}
                  />
                ) : null}
                {activeSection === "video" ? (
                  <VideoSection
                    key={`video-${data.product.updatedAt}`}
                    siteCode={siteCode}
                    productId={productId}
                    data={data}
                    onUpdated={setData}
                  />
                ) : null}
                {activeSection === "description" ? (
                  <DescriptionSection
                    key={`desc-${data.product.updatedAt}`}
                    siteCode={siteCode}
                    productId={productId}
                    data={data}
                    onUpdated={setData}
                  />
                ) : null}
                {activeSection === "info" ? (
                  <InfoSection
                    key={`info-${data.product.updatedAt}`}
                    siteCode={siteCode}
                    productId={productId}
                    data={data}
                    onUpdated={setData}
                  />
                ) : null}
                {activeSection === "review" ? (
                  <ReviewSection
                    key={`review-${data.editorialReviews.length}-${data.product.updatedAt}`}
                    siteCode={siteCode}
                    productId={productId}
                    data={data}
                    onUpdated={setData}
                  />
                ) : null}
                {activeSection === "tag" ? (
                  <TagsSection
                    key={`tag-${data.product.updatedAt}`}
                    siteCode={siteCode}
                    productId={productId}
                    data={data}
                    onUpdated={setData}
                  />
                ) : null}
                {activeSection === "highlights" ? (
                  <HighlightsSection
                    key={`hl-${data.product.updatedAt}`}
                    siteCode={siteCode}
                    productId={productId}
                    data={data}
                    onUpdated={setData}
                  />
                ) : null}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </AdminAppShell>
  );
}
