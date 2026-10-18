"use client";

import { useCallback, useEffect, useState } from "react";
import { BadgePercent, Filter, Package } from "lucide-react";

import { AdminAppShell } from "@/components/layout/admin-app-shell";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { showError, showSuccess } from "@/lib/toast";
import { fetchCategories, fetchSubcategories } from "@/services/api/catalog";
import { ApiError } from "@/services/api/errors";
import {
  applyAdminProductPrices,
  fetchAdminProductPrices,
} from "@/services/api/product-prices";
import type { SiteCode } from "@/types/auth";
import type { CategoryDto } from "@/types/catalog";
import type {
  AdminProductPriceListItemDto,
  AdminProductPriceStatusFilter,
} from "@/types/product-prices";

const PAGE_SIZE = 10;
const ALL_VALUE = "__all__";

function formatCurrency(value: number | null, currency = "INR"): string {
  if (value == null) return "—";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(value);
}

function statusBadgeVariant(
  status: AdminProductPriceListItemDto["status"],
): "default" | "secondary" | "outline" {
  if (status === "ACTIVE") return "default";
  if (status === "DRAFT") return "secondary";
  return "outline";
}

function variantLabel(
  sizeLabel: string | null,
  colorLabel: string | null,
  name: string,
): string {
  const parts = [sizeLabel, colorLabel].filter(Boolean);
  return parts.length > 0 ? parts.join(" / ") : name;
}

function parsePercentInput(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const value = Number(trimmed);
  if (!Number.isFinite(value) || value === 0) return null;
  if (value <= -100 || value > 1000) return null;
  return value;
}

function PriceTableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3" data-testid="price-table-skeleton">
      {Array.from({ length: rows }).map((_, index) => (
        <Skeleton
          key={`price-skeleton-${index}`}
          className="h-14 w-full rounded-lg"
        />
      ))}
    </div>
  );
}

function PricePreviewTable({
  products,
  serialOffset,
  showProjected,
}: {
  products: AdminProductPriceListItemDto[];
  serialOffset: number;
  showProjected: boolean;
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-14">S.No</TableHead>
            <TableHead>Code</TableHead>
            <TableHead className="w-[72px]">Image</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Current price(s)</TableHead>
            <TableHead>{showProjected ? "Updated price(s)" : "New price(s)"}</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product, index) => (
            <TableRow key={product.id}>
              <TableCell className="tabular-nums text-muted-foreground">
                {serialOffset + index + 1}
              </TableCell>
              <TableCell className="font-mono text-xs whitespace-nowrap">
                {product.productCode}
              </TableCell>
              <TableCell>
                <div className="relative size-12 overflow-hidden rounded-md border border-border bg-muted/40">
                  {product.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element -- remote Cloudinary catalog thumbs
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="size-full object-cover"
                    />
                  ) : (
                    <div className="flex size-full items-center justify-center">
                      <Package className="size-4 text-muted-foreground" />
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell className="max-w-[240px]">
                <div className="line-clamp-2 font-medium text-foreground">
                  {product.name}
                </div>
                {product.categoryName || product.subcategoryName ? (
                  <div className="mt-0.5 text-xs text-muted-foreground">
                    {[product.categoryName, product.subcategoryName]
                      .filter(Boolean)
                      .join(" › ")}
                  </div>
                ) : null}
              </TableCell>
              <TableCell>
                {product.isSimpleOffer || product.variants.length <= 1 ? (
                  <div className="space-y-0.5">
                    <div className="whitespace-nowrap font-medium">
                      {formatCurrency(product.price, product.currency)}
                    </div>
                    <div className="whitespace-nowrap text-xs text-muted-foreground">
                      Vendor{" "}
                      {formatCurrency(product.vendorPrice, product.currency)}
                    </div>
                  </div>
                ) : (
                  <div className="flex max-w-[260px] flex-col gap-1.5">
                    {product.variants.map((variant) => (
                      <div key={variant.id} className="text-xs">
                        <span className="font-medium text-foreground">
                          {variantLabel(
                            variant.sizeLabel,
                            variant.colorLabel,
                            variant.name,
                          )}
                          :{" "}
                        </span>
                        {formatCurrency(variant.price, variant.currency)}
                        {variant.vendorPrice != null ? (
                          <span className="text-muted-foreground">
                            {" "}
                            · V{" "}
                            {formatCurrency(
                              variant.vendorPrice,
                              variant.currency,
                            )}
                          </span>
                        ) : null}
                      </div>
                    ))}
                  </div>
                )}
              </TableCell>
              <TableCell>
                {showProjected ? (
                  product.isSimpleOffer || product.variants.length <= 1 ? (
                    <div className="space-y-0.5">
                      <div className="whitespace-nowrap font-medium text-teal-700">
                        {formatCurrency(product.updatedPrice, product.currency)}
                      </div>
                      <div className="whitespace-nowrap text-xs text-muted-foreground">
                        Vendor{" "}
                        {formatCurrency(
                          product.updatedVendorPrice,
                          product.currency,
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex max-w-[260px] flex-col gap-1.5">
                      {product.variants.map((variant) => (
                        <div key={variant.id} className="text-xs">
                          <span className="font-medium text-foreground">
                            {variantLabel(
                              variant.sizeLabel,
                              variant.colorLabel,
                              variant.name,
                            )}
                            :{" "}
                          </span>
                          <span className="text-teal-700">
                            {formatCurrency(
                              variant.updatedPrice,
                              variant.currency,
                            )}
                          </span>
                          {variant.updatedVendorPrice != null ? (
                            <span className="text-muted-foreground">
                              {" "}
                              · V{" "}
                              {formatCurrency(
                                variant.updatedVendorPrice,
                                variant.currency,
                              )}
                            </span>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  )
                ) : (
                  <span className="text-sm text-muted-foreground">
                    Enter a percent to preview
                  </span>
                )}
              </TableCell>
              <TableCell>
                <Badge variant={statusBadgeVariant(product.status)}>
                  {product.status}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export function UpdateProductPricesPage({ siteCode }: { siteCode: SiteCode }) {
  const [activeTab, setActiveTab] = useState("by-category");
  const [status, setStatus] = useState<AdminProductPriceStatusFilter>("all");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [categoryId, setCategoryId] = useState<string>(ALL_VALUE);
  const [subcategoryId, setSubcategoryId] = useState<string>(ALL_VALUE);
  const [tabCategoryId, setTabCategoryId] = useState<string>(ALL_VALUE);
  const [tabSubcategoryId, setTabSubcategoryId] = useState<string>(ALL_VALUE);
  const [productSearch, setProductSearch] = useState("");
  const [debouncedProductSearch, setDebouncedProductSearch] = useState("");
  const [selectedProductId, setSelectedProductId] = useState<string>(ALL_VALUE);
  const [percentInput, setPercentInput] = useState("10");
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [subcategories, setSubcategories] = useState<CategoryDto[]>([]);
  const [tabSubcategories, setTabSubcategories] = useState<CategoryDto[]>([]);
  const [products, setProducts] = useState<AdminProductPriceListItemDto[]>([]);
  const [pickerProducts, setPickerProducts] = useState<
    AdminProductPriceListItemDto[]
  >([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const percent = parsePercentInput(percentInput);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedProductSearch(productSearch.trim());
    }, 300);
    return () => window.clearTimeout(timer);
  }, [productSearch]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const rows = await fetchCategories(siteCode);
        if (!cancelled) setCategories(rows);
      } catch {
        if (!cancelled) setCategories([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [siteCode]);

  useEffect(() => {
    let cancelled = false;
    if (categoryId === ALL_VALUE) {
      setSubcategories([]);
      setSubcategoryId(ALL_VALUE);
      return;
    }
    void (async () => {
      try {
        const rows = await fetchSubcategories(siteCode, categoryId);
        if (!cancelled) {
          setSubcategories(rows);
          setSubcategoryId(ALL_VALUE);
        }
      } catch {
        if (!cancelled) {
          setSubcategories([]);
          setSubcategoryId(ALL_VALUE);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [siteCode, categoryId]);

  useEffect(() => {
    let cancelled = false;
    if (tabCategoryId === ALL_VALUE) {
      setTabSubcategories([]);
      setTabSubcategoryId(ALL_VALUE);
      return;
    }
    void (async () => {
      try {
        const rows = await fetchSubcategories(siteCode, tabCategoryId);
        if (!cancelled) {
          setTabSubcategories(rows);
          setTabSubcategoryId(ALL_VALUE);
        }
      } catch {
        if (!cancelled) {
          setTabSubcategories([]);
          setTabSubcategoryId(ALL_VALUE);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [siteCode, tabCategoryId]);

  const scopeCategoryId =
    activeTab === "by-category"
      ? tabCategoryId === ALL_VALUE
        ? undefined
        : tabCategoryId
      : categoryId === ALL_VALUE
        ? undefined
        : categoryId;

  const scopeSubcategoryId =
    activeTab === "by-category"
      ? tabSubcategoryId === ALL_VALUE
        ? undefined
        : tabSubcategoryId
      : subcategoryId === ALL_VALUE
        ? undefined
        : subcategoryId;

  const canPreviewCategory =
    activeTab === "by-category" && Boolean(scopeCategoryId) && percent != null;

  const canPreviewProduct =
    activeTab === "by-product" &&
    selectedProductId !== ALL_VALUE &&
    percent != null;

  /** Keep the by-product select options populated while previewing one product. */
  useEffect(() => {
    if (activeTab !== "by-product") return;
    let cancelled = false;
    void (async () => {
      try {
        const result = await fetchAdminProductPrices(siteCode, {
          status,
          q: debouncedProductSearch || undefined,
          categoryId: scopeCategoryId,
          subcategoryId: scopeSubcategoryId,
          page: 1,
          limit: 48,
        });
        if (!cancelled) setPickerProducts(result.items);
      } catch {
        if (!cancelled) setPickerProducts([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [
    activeTab,
    siteCode,
    status,
    debouncedProductSearch,
    scopeCategoryId,
    scopeSubcategoryId,
  ]);

  const load = useCallback(async () => {
    if (activeTab === "by-category" && !scopeCategoryId) {
      setProducts([]);
      setTotal(0);
      setTotalPages(0);
      setLoadError(null);
      setIsLoading(false);
      return;
    }

    if (activeTab === "by-product" && selectedProductId === ALL_VALUE) {
      setProducts([]);
      setTotal(0);
      setTotalPages(0);
      setLoadError(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setLoadError(null);
    try {
      if (activeTab === "by-category") {
        const result = await fetchAdminProductPrices(siteCode, {
          status,
          q: debouncedSearch || undefined,
          categoryId: scopeCategoryId,
          subcategoryId: scopeSubcategoryId,
          percent: percent ?? undefined,
          page,
          limit: PAGE_SIZE,
        });
        setProducts(result.items);
        setTotal(result.meta.total);
        setTotalPages(result.meta.totalPages);
      } else {
        const result = await fetchAdminProductPrices(siteCode, {
          productId: selectedProductId,
          percent: percent ?? undefined,
          page: 1,
          limit: 1,
        });
        setProducts(result.items);
        setTotal(result.meta.total);
        setTotalPages(result.meta.totalPages);
      }
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : "Failed to load product prices";
      setLoadError(message);
      showError(message);
    } finally {
      setIsLoading(false);
    }
  }, [
    activeTab,
    siteCode,
    status,
    debouncedSearch,
    scopeCategoryId,
    scopeSubcategoryId,
    selectedProductId,
    percent,
    page,
  ]);

  useEffect(() => {
    setPage(1);
  }, [
    activeTab,
    status,
    debouncedSearch,
    debouncedProductSearch,
    tabCategoryId,
    tabSubcategoryId,
    categoryId,
    subcategoryId,
    selectedProductId,
    percentInput,
  ]);

  useEffect(() => {
    // Intentional data-fetch for price filters / page.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- price list fetch
    void load();
  }, [load]);

  const handleApply = async () => {
    if (percent == null) {
      showError("Enter a non-zero percent (positive to increase, negative to decrease)");
      return;
    }

    if (activeTab === "by-category") {
      if (!scopeCategoryId) {
        showError("Select a category to update");
        return;
      }
    } else if (selectedProductId === ALL_VALUE) {
      showError("Select a product to update");
      return;
    }

    setIsApplying(true);
    try {
      const result = await applyAdminProductPrices(
        siteCode,
        activeTab === "by-category"
          ? {
              percent,
              categoryId: scopeCategoryId,
              subcategoryId: scopeSubcategoryId,
              status,
              q: debouncedSearch || undefined,
            }
          : {
              percent,
              productId: selectedProductId,
            },
      );
      showSuccess(
        `Updated ${result.productsUpdated} product(s), ${result.variantsUpdated} variant(s)`,
      );
      // Clear percent so the table reloads with new current prices (not another projection).
      setPercentInput("");
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : "Failed to apply price update";
      showError(message);
    } finally {
      setIsApplying(false);
    }
  };

  const serialOffset = (page - 1) * PAGE_SIZE;
  const showProjected =
    percent != null &&
    (activeTab === "by-category"
      ? Boolean(scopeCategoryId)
      : selectedProductId !== ALL_VALUE);
  const applyEnabled =
    percent != null &&
    !isApplying &&
    (activeTab === "by-category"
      ? Boolean(scopeCategoryId) && total > 0
      : selectedProductId !== ALL_VALUE && products.length > 0);

  return (
    <AdminAppShell
      siteCode={siteCode}
      title="Update Product Prices"
      description="Apply percent-based price changes by category or by product."
    >
      <div className="mx-auto w-full max-w-[1400px] space-y-6">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-foreground">
            Price adjustments
          </h2>
          <p className="text-sm text-muted-foreground">
            Site-scoped for {siteCode === "IN" ? ".in" : ".com"}. Selling price
            and vendor price on each variant are updated; compare-at (MRP) is
            updated when set. Server recomputes amounts from the percent — client
            projections are preview only.
          </p>
        </div>

        <Card className="border-border shadow-sm">
          <CardHeader className="border-b border-border/70 pb-5">
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-lg font-semibold">Top filters</CardTitle>
            </div>
            <CardDescription>
              Search and status apply to category-scope previews; category filters
              also help find products in the by-product tab.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 pt-6 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="price-search">Search products</Label>
              <Input
                id="price-search"
                placeholder="Name or product code"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                disabled={activeTab === "by-product"}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="price-status">Status</Label>
              <Select
                value={status}
                onValueChange={(value) => {
                  if (
                    value === "all" ||
                    value === "active" ||
                    value === "draft" ||
                    value === "archived"
                  ) {
                    setStatus(value);
                  }
                }}
              >
                <SelectTrigger id="price-status" className="w-full">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="price-top-category">Category</Label>
              <Select
                value={categoryId}
                onValueChange={(value) => {
                  if (value) setCategoryId(value);
                }}
                disabled={activeTab === "by-category"}
              >
                <SelectTrigger id="price-top-category" className="w-full">
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_VALUE}>All categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="price-top-subcategory">Subcategory</Label>
              <Select
                value={subcategoryId}
                onValueChange={(value) => {
                  if (value) setSubcategoryId(value);
                }}
                disabled={
                  activeTab === "by-category" || categoryId === ALL_VALUE
                }
              >
                <SelectTrigger id="price-top-subcategory" className="w-full">
                  <SelectValue placeholder="All subcategories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_VALUE}>All subcategories</SelectItem>
                  {subcategories.map((sub) => (
                    <SelectItem key={sub.id} value={sub.id}>
                      {sub.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 bg-gray-300 text-black">
            <TabsTrigger value="by-category">Update by category</TabsTrigger>
            <TabsTrigger value="by-product">Update by product</TabsTrigger>
          </TabsList>

          <TabsContent value="by-category" className="space-y-4 pt-4">
            <Card className="border-border shadow-sm">
              <CardHeader className="border-b border-border/70 pb-5">
                <CardTitle className="text-lg font-semibold">
                  Category scope
                </CardTitle>
                <CardDescription>
                  Leave subcategory as &quot;All&quot; to update every product
                  under all subcategories of the selected category.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 pt-6 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="tab-category">Category *</Label>
                  <Select
                    value={tabCategoryId}
                    onValueChange={(value) => {
                      if (value) setTabCategoryId(value);
                    }}
                  >
                    <SelectTrigger id="tab-category" className="w-full">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ALL_VALUE}>Select category</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tab-subcategory">Subcategory</Label>
                  <Select
                    value={tabSubcategoryId}
                    onValueChange={(value) => {
                      if (value) setTabSubcategoryId(value);
                    }}
                    disabled={tabCategoryId === ALL_VALUE}
                  >
                    <SelectTrigger id="tab-subcategory" className="w-full">
                      <SelectValue placeholder="All subcategories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ALL_VALUE}>
                        All subcategories
                      </SelectItem>
                      {tabSubcategories.map((sub) => (
                        <SelectItem key={sub.id} value={sub.id}>
                          {sub.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="percent-category">Percent *</Label>
                  <Input
                    id="percent-category"
                    type="number"
                    step="0.01"
                    value={percentInput}
                    onChange={(event) => setPercentInput(event.target.value)}
                    placeholder="e.g. 10 or -5"
                  />
                  <p className="text-xs text-muted-foreground">
                    &gt; 0 increases by that percent; &lt; 0 decreases by that
                    percent. Zero is not allowed.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="by-product" className="space-y-4 pt-4">
            <Card className="border-border shadow-sm">
              <CardHeader className="border-b border-border/70 pb-5">
                <CardTitle className="text-lg font-semibold">
                  Single product
                </CardTitle>
                <CardDescription>
                  Use top filters and search below to find one product, then
                  apply the percent to that product only.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 pt-6 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="product-picker-search">Find product</Label>
                  <Input
                    id="product-picker-search"
                    placeholder="Name or product code"
                    value={productSearch}
                    onChange={(event) => {
                      setProductSearch(event.target.value);
                      setSelectedProductId(ALL_VALUE);
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="product-select">Product *</Label>
                  <Select
                    value={selectedProductId}
                    onValueChange={(value) => {
                      if (value) setSelectedProductId(value);
                    }}
                  >
                    <SelectTrigger id="product-select" className="w-full">
                      <SelectValue placeholder="Select product" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ALL_VALUE}>Select product</SelectItem>
                      {pickerProducts.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.productCode} — {product.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="percent-product">Percent *</Label>
                  <Input
                    id="percent-product"
                    type="number"
                    step="0.01"
                    value={percentInput}
                    onChange={(event) => setPercentInput(event.target.value)}
                    placeholder="e.g. 10 or -5"
                  />
                  <p className="text-xs text-muted-foreground">
                    &gt; 0 increases by that percent; &lt; 0 decreases by that
                    percent. Zero is not allowed.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {loadError ? (
          <Alert variant="destructive">
            <AlertTitle>Could not load prices</AlertTitle>
            <AlertDescription className="flex items-center justify-between gap-3">
              <span>{loadError}</span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => void load()}
              >
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        ) : null}

        <Card className="border-border shadow-sm">
          <CardHeader className="border-b border-border/70 pb-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <BadgePercent className="h-5 w-5 text-muted-foreground" />
                <CardTitle className="text-lg font-semibold">
                  {activeTab === "by-category"
                    ? "Affected products"
                    : "Selected product preview"}
                </CardTitle>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm text-muted-foreground">
                  {total} total
                  {activeTab === "by-category" && totalPages > 0
                    ? ` · page ${page} of ${totalPages}`
                    : ""}
                  {percent != null ? ` · ${percent > 0 ? "+" : ""}${percent}%` : ""}
                </p>
                <Button
                  type="button"
                  disabled={!applyEnabled}
                  onClick={() => void handleApply()}
                >
                  {isApplying ? "Applying…" : "Apply update"}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {activeTab === "by-category" && !scopeCategoryId ? (
              <div className="rounded-xl border border-dashed border-border px-6 py-16 text-center">
                <Package className="mx-auto mb-3 size-8 text-muted-foreground" />
                <p className="text-sm font-medium text-foreground">
                  Select a category
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Choose a category (and optional subcategory) plus a percent to
                  preview affected products.
                </p>
              </div>
            ) : activeTab === "by-product" && selectedProductId === ALL_VALUE ? (
              <div className="rounded-xl border border-dashed border-border px-6 py-16 text-center">
                <Package className="mx-auto mb-3 size-8 text-muted-foreground" />
                <p className="text-sm font-medium text-foreground">
                  Select a product
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Search with top filters, pick one product, then enter a percent
                  to preview its variants.
                </p>
              </div>
            ) : isLoading ? (
              <PriceTableSkeleton />
            ) : products.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border px-6 py-16 text-center">
                <Package className="mx-auto mb-3 size-8 text-muted-foreground" />
                <p className="text-sm font-medium text-foreground">
                  No products found
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {canPreviewCategory || canPreviewProduct
                    ? "Try another filter or percent."
                    : "Adjust search or category filters."}
                </p>
              </div>
            ) : (
              <>
                <PricePreviewTable
                  products={products}
                  serialOffset={
                    activeTab === "by-product" ? 0 : serialOffset
                  }
                  showProjected={showProjected}
                />

                {activeTab === "by-category" && totalPages > 1 ? (
                  <div className="mt-4 flex items-center justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={page <= 1 || isLoading}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                    >
                      Previous
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={page >= totalPages || isLoading}
                      onClick={() =>
                        setPage((p) => Math.min(totalPages, p + 1))
                      }
                    >
                      Next
                    </Button>
                  </div>
                ) : null}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminAppShell>
  );
}
