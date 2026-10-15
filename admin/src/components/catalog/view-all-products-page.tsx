"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { Eye, Filter, Package, Trash2 } from "lucide-react";

import { ProductViewModal } from "@/components/catalog/product-view-modal";
import { AdminAppShell } from "@/components/layout/admin-app-shell";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import {
  deleteAdminProduct,
  fetchAdminProducts,
} from "@/services/api/catalog";
import { ApiError } from "@/services/api/errors";
import { showError, showSuccess } from "@/lib/toast";
import type { SiteCode } from "@/types/auth";
import type {
  AdminProductListItemDto,
  AdminProductListPeriod,
  AdminProductListStatus,
} from "@/types/catalog";

const PAGE_SIZE = 10;

function toDateInput(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function formatCurrency(value: number | null, currency = "INR"): string {
  if (value == null) return "—";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(value);
}

function ProductsTableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="space-y-3" data-testid="products-table-skeleton">
      {Array.from({ length: rows }).map((_, index) => (
        <Skeleton
          key={`product-skeleton-${index}`}
          className="h-14 w-full rounded-lg"
        />
      ))}
    </div>
  );
}

export function ViewAllProductsPage({ siteCode }: { siteCode: SiteCode }) {
  const [period, setPeriod] = useState<AdminProductListPeriod>("all");
  const [dayDate, setDayDate] = useState(() => toDateInput(new Date()));
  const [status, setStatus] = useState<AdminProductListStatus>("all");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [products, setProducts] = useState<AdminProductListItemDto[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [viewProductId, setViewProductId] = useState<string | null>(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [pendingDelete, setPendingDelete] =
    useState<AdminProductListItemDto | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadedCountRef = useRef(0);
  const hasMoreRef = useRef(true);
  const fetchingRef = useRef(false);
  const fetchGenerationRef = useRef(0);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  const loadPage = useCallback(
    async (append: boolean) => {
      if (fetchingRef.current && append) return;

      const generation = append
        ? fetchGenerationRef.current
        : ++fetchGenerationRef.current;

      fetchingRef.current = true;
      if (append) {
        setIsLoadingMore(true);
      } else {
        setIsLoading(true);
        loadedCountRef.current = 0;
        hasMoreRef.current = true;
      }

      try {
        const result = await fetchAdminProducts(siteCode, {
          period,
          date: period === "day" ? dayDate : undefined,
          status,
          q: debouncedSearch || undefined,
          offset: append ? loadedCountRef.current : 0,
          limit: PAGE_SIZE,
        });

        if (generation !== fetchGenerationRef.current) {
          return;
        }

        setTotal(result.meta.total);
        setLoadError(null);
        setProducts((current) => {
          const merged = append
            ? (() => {
                const seen = new Set(current.map((item) => item.id));
                const unique = result.items.filter((item) => {
                  if (seen.has(item.id)) return false;
                  seen.add(item.id);
                  return true;
                });
                return [...current, ...unique];
              })()
            : result.items;
          loadedCountRef.current = merged.length;
          hasMoreRef.current =
            result.items.length > 0 && merged.length < result.meta.total;
          return merged;
        });
      } catch (error) {
        if (generation !== fetchGenerationRef.current) {
          return;
        }
        const message =
          error instanceof ApiError
            ? error.message
            : "Failed to load products";
        setLoadError(message);
        if (!append) {
          setProducts([]);
          setTotal(0);
        }
        showError(message);
      } finally {
        if (generation === fetchGenerationRef.current) {
          setIsLoading(false);
          setIsLoadingMore(false);
          fetchingRef.current = false;
        }
      }
    },
    [siteCode, period, dayDate, status, debouncedSearch],
  );

  useEffect(() => {
    // Intentional filtered product list fetch for View All Products.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- product list fetch
    void loadPage(false);
  }, [loadPage]);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (
          entry?.isIntersecting &&
          hasMoreRef.current &&
          !fetchingRef.current &&
          !isLoading
        ) {
          void loadPage(true);
        }
      },
      { rootMargin: "200px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [loadPage, isLoading, products.length]);

  const handleDelete = async () => {
    if (!pendingDelete) return;
    setIsDeleting(true);
    try {
      await deleteAdminProduct(siteCode, pendingDelete.id);
      showSuccess("Product deleted");
      setPendingDelete(null);
      if (viewProductId === pendingDelete.id) {
        setViewOpen(false);
        setViewProductId(null);
      }
      await loadPage(false);
    } catch (error) {
      showError(
        error instanceof ApiError
          ? error.message
          : "Failed to delete product",
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AdminAppShell
      siteCode={siteCode}
      title="View All Products"
      description="Browse, inspect, and delete site-scoped catalog products."
    >
      <div className="mx-auto w-full max-w-[1400px] space-y-6">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-foreground">
            All products
          </h2>
          <p className="text-sm text-muted-foreground">
            Site-scoped catalog for {siteCode === "IN" ? ".in" : ".com"}. Defaults
            to products created today; switch to All or a specific day as needed.
          </p>
        </div>

        <Card className="border-border shadow-sm">
          <CardHeader className="border-b border-border/70 pb-5">
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-lg font-semibold">Filters</CardTitle>
            </div>
            <CardDescription>
              Day-wise created date, status, and search.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 pt-6 md:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="filter-period">Created</Label>
              <Select
                value={period}
                onValueChange={(value) => {
                  if (value === "today" || value === "all" || value === "day") {
                    setPeriod(value);
                  }
                }}
              >
                <SelectTrigger id="filter-period" className="w-full">
                  <SelectValue placeholder="Today" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="all">All time</SelectItem>
                  <SelectItem value="day">Specific day</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="filter-date">Day</Label>
              <Input
                id="filter-date"
                type="date"
                value={dayDate}
                disabled={period !== "day"}
                onChange={(event) => setDayDate(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="filter-status">Status</Label>
              <Select
                value={status}
                onValueChange={(value) => {
                  if (
                    value === "all" ||
                    value === "active" ||
                    value === "draft"
                  ) {
                    setStatus(value);
                  }
                }}
              >
                <SelectTrigger id="filter-status" className="w-full">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="filter-search">Search</Label>
              <Input
                id="filter-search"
                placeholder="Name, code, or slug"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {loadError ? (
          <Alert variant="destructive">
            <AlertTitle>Could not load products</AlertTitle>
            <AlertDescription className="flex items-center justify-between gap-3">
              <span>{loadError}</span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => void loadPage(false)}
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
                <Package className="h-5 w-5 text-muted-foreground" />
                <CardTitle className="text-lg font-semibold">Products</CardTitle>
              </div>
              <p className="text-sm text-muted-foreground">
                {total} total · showing {products.length}
              </p>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {isLoading ? (
              <ProductsTableSkeleton />
            ) : products.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border px-6 py-16 text-center">
                <Package className="mx-auto mb-3 size-8 text-muted-foreground" />
                <p className="text-sm font-medium text-foreground">
                  No products found
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Try All time, another day, or clear the search.
                </p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto rounded-xl border border-border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Code</TableHead>
                        <TableHead className="w-[72px]">Image</TableHead>
                        <TableHead>Product</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Qty</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {products.map((product) => (
                        <TableRow key={product.id}>
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
                          <TableCell className="tabular-nums">
                            {product.quantity}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                product.active ? "default" : "secondary"
                              }
                            >
                              {product.active ? "Active" : "Draft"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex justify-end gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setViewProductId(product.id);
                                  setViewOpen(true);
                                }}
                              >
                                <Eye className="size-3.5" />
                                View
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="text-destructive hover:text-destructive"
                                onClick={() => setPendingDelete(product)}
                              >
                                <Trash2 className="size-3.5" />
                                Delete
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <div ref={sentinelRef} className="h-8 w-full" aria-hidden />
                {isLoadingMore ? (
                  <div className="mt-4">
                    <ProductsTableSkeleton rows={3} />
                  </div>
                ) : null}
                {!hasMoreRef.current && products.length > 0 ? (
                  <p className="mt-4 text-center text-xs text-muted-foreground">
                    End of list
                  </p>
                ) : null}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <ProductViewModal
        siteCode={siteCode}
        productId={viewProductId}
        open={viewOpen}
        onOpenChange={(open) => {
          setViewOpen(open);
          if (!open) {
            setViewProductId(null);
          }
        }}
      />

      <AlertDialog
        open={Boolean(pendingDelete)}
        onOpenChange={(open) => {
          if (!open && !isDeleting) {
            setPendingDelete(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this product?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDelete
                ? `“${pendingDelete.name}” (${pendingDelete.productCode}) will be permanently deleted from the database for this site. Products that appear on orders cannot be deleted.`
                : "This product will be permanently deleted."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={isDeleting}
              onClick={(event) => {
                event.preventDefault();
                void handleDelete();
              }}
            >
              {isDeleting ? "Deleting…" : "Delete product"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminAppShell>
  );
}
