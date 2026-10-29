"use client";

import { useEffect, useState } from "react";
import { Package } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiError } from "@/services/api/errors";
import { fetchProductEdit } from "@/services/api/product-edit";
import { showError } from "@/lib/toast";
import type { SiteCode } from "@/types/auth";
import type { ProductEditDto } from "@/types/product-edit";

function formatCurrency(value: number, currency = "INR"): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3 rounded-xl border border-border/80 bg-muted/20 p-4">
      <h3 className="text-sm font-semibold tracking-wide text-foreground uppercase">
        {title}
      </h3>
      {children}
    </section>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <div className="text-sm text-foreground">{value || "—"}</div>
    </div>
  );
}

export function ProductViewModal({
  siteCode,
  productId,
  open,
  onOpenChange,
}: {
  siteCode: SiteCode;
  productId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [payload, setPayload] = useState<ProductEditDto | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!open || !productId) {
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setPayload(null);

    void (async () => {
      try {
        const data = await fetchProductEdit(siteCode, productId);
        if (!cancelled) {
          setPayload(data);
        }
      } catch (error) {
        if (!cancelled) {
          showError(
            error instanceof ApiError
              ? error.message
              : "Failed to load product details",
          );
          onOpenChange(false);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, productId, siteCode, onOpenChange]);

  const product = payload?.product;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="size-4 text-muted-foreground" />
            {product?.name ?? "Product details"}
          </DialogTitle>
          <DialogDescription>
            Full catalog data for this site-scoped product.
          </DialogDescription>
        </DialogHeader>

        {isLoading || !payload || !product ? (
          <div className="space-y-4 py-2">
            <Skeleton className="h-40 w-full rounded-xl" />
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-32 w-full rounded-xl" />
          </div>
        ) : (
          <div className="space-y-4 py-1">
            <Section title="Overview">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Product code" value={product.productCode} />
                <Field label="Slug" value={product.slug} />
                <Field
                  label="Status"
                  value={
                    <Badge variant={product.active ? "default" : "secondary"}>
                      {product.active ? "Active" : "Draft"}
                    </Badge>
                  }
                />
                <Field
                  label="Flags"
                  value={
                    <div className="flex flex-wrap gap-1.5">
                      {product.isFeatured ? (
                        <Badge variant="outline">Featured</Badge>
                      ) : null}
                      {product.isRecent ? (
                        <Badge variant="outline">Recent</Badge>
                      ) : null}
                      {product.isBestSeller ? (
                        <Badge variant="outline">Best seller</Badge>
                      ) : null}
                      {!product.isFeatured &&
                      !product.isRecent &&
                      !product.isBestSeller
                        ? "—"
                        : null}
                    </div>
                  }
                />
                <Field
                  label="Created"
                  value={formatDateTime(product.createdAt)}
                />
                <Field
                  label="Updated"
                  value={formatDateTime(product.updatedAt)}
                />
              </div>
            </Section>

            <Section title="Images">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">
                    Banner
                  </p>
                  {payload.banner?.url ? (
                    <div className="aspect-[16/9] overflow-hidden rounded-lg border border-border bg-background">
                      {/* eslint-disable-next-line @next/next/no-img-element -- remote Cloudinary media */}
                      <img
                        src={payload.banner.url}
                        alt={`${product.name} banner`}
                        className="size-full object-cover"
                      />
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No banner</p>
                  )}
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">
                    Size chart
                  </p>
                  {payload.sizeChart?.url ? (
                    <div className="aspect-[16/9] overflow-hidden rounded-lg border border-border bg-background">
                      {/* eslint-disable-next-line @next/next/no-img-element -- remote Cloudinary media */}
                      <img
                        src={payload.sizeChart.url}
                        alt={`${product.name} size chart`}
                        className="size-full object-contain p-2"
                      />
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No size chart</p>
                  )}
                </div>
              </div>
              {payload.gallery.length > 0 ? (
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {payload.gallery.map((image) => (
                    <div
                      key={image.id}
                      className="relative aspect-square overflow-hidden rounded-lg border border-border bg-background"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element -- remote Cloudinary media */}
                      <img
                        src={image.imageUrl}
                        alt={`${product.name} gallery`}
                        className="size-full object-cover"
                      />
                      {image.isPrimary ? (
                        <span className="absolute top-1 left-1 rounded bg-background/90 px-1.5 py-0.5 text-[10px] font-medium">
                          Primary
                        </span>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No gallery images</p>
              )}
            </Section>

            <Section title="Price & offers">
              {payload.variants.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No price variants configured
                </p>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-border">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/40 text-left text-xs text-muted-foreground">
                      <tr>
                        <th className="px-3 py-2 font-medium">Offer</th>
                        <th className="px-3 py-2 font-medium">Price</th>
                        <th className="px-3 py-2 font-medium">Vendor price</th>
                        <th className="px-3 py-2 font-medium">Qty</th>
                        <th className="px-3 py-2 font-medium">Active</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payload.variants.map((variant) => (
                        <tr
                          key={variant.id}
                          className="border-t border-border/70"
                        >
                          <td className="px-3 py-2">
                            <div className="font-medium">{variant.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {[variant.sizeLabel, variant.colorLabel]
                                .filter(Boolean)
                                .join(" · ") || "Base offer"}
                            </div>
                          </td>
                          <td className="px-3 py-2">
                            {formatCurrency(variant.price)}
                          </td>
                          <td className="px-3 py-2">
                            {variant.vendorPrice != null
                              ? formatCurrency(variant.vendorPrice)
                              : "—"}
                          </td>
                          <td className="px-3 py-2">{variant.quantity}</td>
                          <td className="px-3 py-2">
                            {variant.isActive ? "Yes" : "No"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label="Tax"
                  value={
                    payload.tax
                      ? `CGST ${payload.tax.cgst}% · SGST ${payload.tax.sgst}%`
                      : "—"
                  }
                />
                <Field
                  label="Coupon"
                  value={
                    payload.coupon
                      ? `${payload.coupon.code} (${payload.coupon.type} ${payload.coupon.value})`
                      : "—"
                  }
                />
              </div>
            </Section>

            <Section title="Catalog details">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label="Sizes"
                  value={
                    payload.sizes.length
                      ? payload.sizes.map((size) => size.label).join(", ")
                      : "—"
                  }
                />
                <Field
                  label="Colors"
                  value={
                    payload.colors.length
                      ? payload.colors.map((color) => color.name).join(", ")
                      : "—"
                  }
                />
                <Field
                  label="Tags"
                  value={
                    payload.tags.length
                      ? payload.tags.map((tag) => tag.name).join(", ")
                      : "—"
                  }
                />
                <Field
                  label="Highlights"
                  value={
                    payload.highlights.length
                      ? payload.highlights
                          .map((item) => `${item.question}: ${item.answer}`)
                          .join(" · ")
                      : "—"
                  }
                />
              </div>
              {payload.description ? (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">
                    Description
                  </p>
                  <div
                    className="prose prose-sm max-w-none rounded-lg border border-border bg-background p-3 text-foreground"
                    dangerouslySetInnerHTML={{ __html: payload.description }}
                  />
                </div>
              ) : null}
              {payload.infoSections.length > 0 ? (
                <div className="space-y-2">
                  {payload.infoSections.map((section) => (
                    <div
                      key={section.id}
                      className="rounded-lg border border-border bg-background p-3"
                    >
                      <p className="text-sm font-medium">{section.title}</p>
                      <div
                        className="prose prose-sm mt-1 max-w-none text-muted-foreground"
                        dangerouslySetInnerHTML={{ __html: section.body }}
                      />
                    </div>
                  ))}
                </div>
              ) : null}
              {payload.videos.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">
                    Videos
                  </p>
                  <ul className="space-y-1 text-sm">
                    {payload.videos.map((video) => (
                      <li key={video.id}>
                        <a
                          href={video.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-primary underline-offset-2 hover:underline"
                        >
                          {video.name || video.url}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </Section>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
