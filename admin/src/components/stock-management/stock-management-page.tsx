"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Boxes, Eye, Filter, Package, Pencil } from "lucide-react";

import { AdminAppShell } from "@/components/layout/admin-app-shell";
import {
  StockQtyBadge,
  variantQtyLabel,
} from "@/components/stock-management/stock-qty-badge";
import { UpdateStockQtyModal } from "@/components/stock-management/update-stock-qty-modal";
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
import { showError } from "@/lib/toast";
import { fetchCategories, fetchSubcategories } from "@/services/api/catalog";
import { ApiError } from "@/services/api/errors";
import { fetchAdminStock } from "@/services/api/stock-management";
import type { SiteCode } from "@/types/auth";
import type { CategoryDto } from "@/types/catalog";
import type {
  AdminStockListItemDto,
  AdminStockStatusFilter,
} from "@/types/stock-management";

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
  status: AdminStockListItemDto["status"],
): "default" | "secondary" | "outline" {
  if (status === "ACTIVE") return "default";
  if (status === "DRAFT") return "secondary";
  return "outline";
}

function StockTableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="space-y-3" data-testid="stock-table-skeleton">
      {Array.from({ length: rows }).map((_, index) => (
        <Skeleton
          key={`stock-skeleton-${index}`}
          className="h-14 w-full rounded-lg"
        />
      ))}
    </div>
  );
}

export function StockManagementPage({ siteCode }: { siteCode: SiteCode }) {
  const [status, setStatus] = useState<AdminStockStatusFilter>("all");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [categoryId, setCategoryId] = useState<string>(ALL_VALUE);
  const [subcategoryId, setSubcategoryId] = useState<string>(ALL_VALUE);
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [subcategories, setSubcategories] = useState<CategoryDto[]>([]);
  const [products, setProducts] = useState<AdminStockListItemDto[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [editProduct, setEditProduct] = useState<AdminStockListItemDto | null>(
    null,
  );
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 300);
    return () => window.clearTimeout(timer);
  }, [search]);

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

  const load = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const result = await fetchAdminStock(siteCode, {
        status,
        q: debouncedSearch || undefined,
        categoryId: categoryId === ALL_VALUE ? undefined : categoryId,
        subcategoryId:
          subcategoryId === ALL_VALUE ? undefined : subcategoryId,
        page,
        limit: PAGE_SIZE,
      });
      setProducts(result.items);
      setTotal(result.meta.total);
      setTotalPages(result.meta.totalPages);
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : "Failed to load stock list";
      setLoadError(message);
      showError(message);
    } finally {
      setIsLoading(false);
    }
  }, [
    siteCode,
    status,
    debouncedSearch,
    categoryId,
    subcategoryId,
    page,
  ]);

  useEffect(() => {
    setPage(1);
  }, [status, debouncedSearch, categoryId, subcategoryId]);

  useEffect(() => {
    // Intentional data-fetch for stock filters / page.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- stock list fetch
    void load();
  }, [load]);

  const handleQtyUpdated = (
    productId: string,
    variantId: string,
    quantity: number,
  ) => {
    const patchRow = (row: AdminStockListItemDto): AdminStockListItemDto => {
      if (row.id !== productId) return row;
      const variants = row.variants.map((variant) =>
        variant.id === variantId ? { ...variant, quantity } : variant,
      );
      const nextQty = row.isSimpleOffer
        ? quantity
        : variants.reduce((sum, v) => sum + v.quantity, 0);
      return { ...row, variants, quantity: nextQty };
    };
    setProducts((prev) => prev.map(patchRow));
    setEditProduct((current) => (current ? patchRow(current) : current));
  };

  const sitePath = siteCode.toLowerCase();
  const serialOffset = (page - 1) * PAGE_SIZE;

  return (
    <AdminAppShell
      siteCode={siteCode}
      title="Stock Management"
      description="Review and update inventory quantities for this website."
    >
      <div className="mx-auto w-full max-w-[1400px] space-y-6">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-foreground">
            Stock overview
          </h2>
          <p className="text-sm text-muted-foreground">
            Site-scoped inventory for {siteCode === "IN" ? ".in" : ".com"}. Qty
            badges: green &gt; 10, yellow 6–10, red ≤ 5.
          </p>
        </div>

        <Card className="border-border shadow-sm">
          <CardHeader className="border-b border-border/70 pb-5">
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-lg font-semibold">Filters</CardTitle>
            </div>
            <CardDescription>
              Search by name or product code; filter by status and category.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 pt-6 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="stock-search">Search</Label>
              <Input
                id="stock-search"
                placeholder="Name or product code"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stock-status">Status</Label>
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
                <SelectTrigger id="stock-status" className="w-full">
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
              <Label htmlFor="stock-category">Category</Label>
              <Select
                value={categoryId}
                onValueChange={(value) => {
                  if (value) setCategoryId(value);
                }}
              >
                <SelectTrigger id="stock-category" className="w-full">
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
              <Label htmlFor="stock-subcategory">Subcategory</Label>
              <Select
                value={subcategoryId}
                onValueChange={(value) => {
                  if (value) setSubcategoryId(value);
                }}
                disabled={categoryId === ALL_VALUE}
              >
                <SelectTrigger id="stock-subcategory" className="w-full">
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

        {loadError ? (
          <Alert variant="destructive">
            <AlertTitle>Could not load stock</AlertTitle>
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
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Boxes className="h-5 w-5 text-muted-foreground" />
                <CardTitle className="text-lg font-semibold">
                  Products
                </CardTitle>
              </div>
              <p className="text-sm text-muted-foreground">
                {total} total · page {page}
                {totalPages > 0 ? ` of ${totalPages}` : ""}
              </p>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {isLoading ? (
              <StockTableSkeleton />
            ) : products.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border px-6 py-16 text-center">
                <Package className="mx-auto mb-3 size-8 text-muted-foreground" />
                <p className="text-sm font-medium text-foreground">
                  No products found
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Try another status, category, or clear the search.
                </p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto rounded-xl border border-border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-14">S.No</TableHead>
                        <TableHead>Code</TableHead>
                        <TableHead className="w-[72px]">Image</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Qty</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
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
                          <TableCell className="max-w-[280px]">
                            <div className="line-clamp-2 font-medium text-foreground">
                              {product.name}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="whitespace-nowrap font-medium">
                              {formatCurrency(product.price, product.currency)}
                            </div>
                            <div className="whitespace-nowrap text-xs text-muted-foreground">
                              Vendor{" "}
                              {formatCurrency(
                                product.vendorPrice,
                                product.currency,
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {product.variants.length === 0 ? (
                              <StockQtyBadge qty={0} />
                            ) : product.isSimpleOffer ? (
                              <StockQtyBadge qty={product.quantity} />
                            ) : (
                              <div className="flex max-w-[220px] flex-col gap-1">
                                {product.variants.map((variant) => (
                                  <StockQtyBadge
                                    key={variant.id}
                                    qty={variant.quantity}
                                    label={variantQtyLabel(
                                      variant.sizeLabel,
                                      variant.colorLabel,
                                      variant.name,
                                    )}
                                  />
                                ))}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant={statusBadgeVariant(product.status)}>
                              {product.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex flex-wrap items-center justify-end gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                asChild
                              >
                                <Link
                                  href={`/admin/${sitePath}/products/${product.id}/edit`}
                                >
                                  <Eye className="size-3.5" />
                                  View
                                </Link>
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                onClick={() => {
                                  setEditProduct(product);
                                  setModalOpen(true);
                                }}
                              >
                                <Pencil className="size-3.5" />
                                Update qty
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {totalPages > 1 ? (
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

      <UpdateStockQtyModal
        siteCode={siteCode}
        product={editProduct}
        open={modalOpen}
        onOpenChange={setModalOpen}
        onUpdated={handleQtyUpdated}
      />
    </AdminAppShell>
  );
}
