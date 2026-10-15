"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { format } from "date-fns";
import { Filter, Loader2 } from "lucide-react";

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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { showError } from "@/lib/toast";
import {
  fetchCancelledOrderLog,
  fetchOnlineOrderLog,
} from "@/services/api/admin-orders";
import { ApiError } from "@/services/api/errors";
import type { SiteCode } from "@/types/auth";
import type {
  AdminOrderLogItem,
  AdminOrderLogKind,
  AdminOrderLogPeriod,
} from "@/types/admin-orders";

const PAGE_SIZE = 10;

function toDateInput(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

function formatCurrency(value: number, currency = "INR"): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
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

export function OrderLogPage({
  siteCode,
  kind,
}: {
  siteCode: SiteCode;
  kind: AdminOrderLogKind;
}) {
  const isOnline = kind === "online";
  const title = isOnline ? "Online Order Log" : "Cancel Order";
  const description = isOnline
    ? "Online payment orders for the selected website."
    : "Orders with payment still pending — review candidates before cancel actions are available."

  const [period, setPeriod] = useState<AdminOrderLogPeriod>("today");
  const [dayDate, setDayDate] = useState(() => toDateInput(new Date()));
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [orders, setOrders] = useState<AdminOrderLogItem[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const loadingMoreLock = useRef(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  const loadPage = useCallback(
    async (nextPage: number, append: boolean) => {
      if (append) {
        setIsLoadingMore(true);
      } else {
        setIsLoading(true);
        setLoadError(null);
      }

      try {
        const showAll = period === "all";
        const query = {
          page: nextPage,
          pageSize: PAGE_SIZE,
          all: showAll,
          date: showAll
            ? undefined
            : period === "day"
              ? dayDate
              : toDateInput(new Date()),
          q: debouncedSearch || undefined,
        };
        const result = isOnline
          ? await fetchOnlineOrderLog(siteCode, query)
          : await fetchCancelledOrderLog(siteCode, query);

        setOrders((current) =>
          append ? [...current, ...result.orders] : result.orders,
        );
        setPage(result.page);
        setHasMore(result.hasMore);
        setTotal(result.total);
      } catch (error) {
        const message =
          error instanceof ApiError
            ? error.message
            : `Failed to load ${isOnline ? "online" : "cancelled"} orders`;
        if (!append) {
          setOrders([]);
          setHasMore(false);
          setTotal(0);
          setLoadError(message);
        }
        showError(message);
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
        loadingMoreLock.current = false;
      }
    },
    [dayDate, debouncedSearch, isOnline, period, siteCode],
  );

  useEffect(() => {
    // Intentional filter-driven list reload.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- order log fetch
    void loadPage(1, false);
  }, [loadPage]);

  useEffect(() => {
    const node = loadMoreRef.current;
    if (!node || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry?.isIntersecting || loadingMoreLock.current || isLoadingMore) {
          return;
        }
        loadingMoreLock.current = true;
        void loadPage(page + 1, true);
      },
      { rootMargin: "200px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, isLoadingMore, loadPage, page]);

  const filterHeading =
    period === "all"
      ? "All orders"
      : period === "day"
        ? `Orders for ${format(new Date(`${dayDate}T00:00:00`), "PPP")}`
        : "Orders for today";

  return (
    <AdminAppShell siteCode={siteCode} title={title} description={description}>
      <div className="mx-auto w-full max-w-[1400px] space-y-6">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-foreground">
            {title}
          </h2>
          <p className="text-sm text-muted-foreground">
            Site-scoped{" "}
            {isOnline
              ? "online payment"
              : "pending-payment (not yet cancelled/refunded)"}{" "}
            orders for {siteCode === "IN" ? ".in" : ".com"}. Defaults to today;
            switch to All time or a specific day, and search by order number or
            email.
          </p>
        </div>

        <Card className="border-border shadow-sm">
          <CardHeader className="border-b border-border/70 pb-5">
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-muted-foreground" />
              <div>
                <CardTitle className="text-base">Filters</CardTitle>
                <CardDescription>
                  Day-wise placed date and search. Default view is today.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4 pt-5 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="order-log-period">Placed</Label>
              <Select
                value={period}
                onValueChange={(value) => {
                  if (value === "today" || value === "all" || value === "day") {
                    setPeriod(value);
                  }
                }}
              >
                <SelectTrigger
                  id="order-log-period"
                  className="w-full"
                  data-testid="order-log-period"
                >
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
              <Label htmlFor="order-log-date">Day</Label>
              <Input
                id="order-log-date"
                type="date"
                value={dayDate}
                disabled={period !== "day"}
                onChange={(event) => setDayDate(event.target.value)}
                data-testid="order-log-date-input"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="order-log-search">Search</Label>
              <Input
                id="order-log-search"
                placeholder="Order number or email"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                data-testid="order-log-search"
              />
            </div>
          </CardContent>
        </Card>

        {loadError ? (
          <Alert variant="destructive" data-testid="order-log-error">
            <AlertTitle>Unable to load orders</AlertTitle>
            <AlertDescription className="flex flex-wrap items-center justify-between gap-3">
              <span>{loadError}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => void loadPage(1, false)}
              >
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        ) : null}

        <Card className="border-border shadow-sm" data-testid="order-log-table">
          <CardHeader className="flex flex-row items-center justify-between gap-3 pb-3">
            <CardTitle className="text-base">{filterHeading}</CardTitle>
            <p
              className="text-sm text-muted-foreground"
              data-testid="order-log-total"
            >
              {total} order{total === 1 ? "" : "s"}
            </p>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center gap-2 py-10 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                Loading orders…
              </div>
            ) : orders.length === 0 ? (
              <p className="py-8 text-sm text-muted-foreground">
                No orders found for this filter.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Payment</TableHead>
                      <TableHead>Items</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Placed</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium">
                          {order.orderNumber}
                        </TableCell>
                        <TableCell>{order.customerEmail ?? "—"}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{order.status}</Badge>
                        </TableCell>
                        <TableCell>
                          {[order.paymentMethod, order.paymentStatus]
                            .filter(Boolean)
                            .join(" · ") || "—"}
                        </TableCell>
                        <TableCell>{order.itemCount}</TableCell>
                        <TableCell>
                          {formatCurrency(order.grandTotal, order.currency)}
                        </TableCell>
                        <TableCell>
                          {formatDateTime(order.placedAt ?? order.createdAt)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            <div ref={loadMoreRef} className="h-8" />

            {isLoadingMore ? (
              <div className="flex items-center justify-center gap-2 py-4 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                Loading more…
              </div>
            ) : null}

            {!isLoading && !hasMore && orders.length > 0 ? (
              <p className="py-3 text-center text-xs text-muted-foreground">
                End of list
              </p>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </AdminAppShell>
  );
}
