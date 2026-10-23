"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { format } from "date-fns";
import {
  CheckCircle2,
  Clock,
  Eye,
  Filter,
  Loader2,
  RotateCcw,
  Search,
  ShoppingBag,
  Wallet,
  X,
} from "lucide-react";

import { AdminAppShell } from "@/components/layout/admin-app-shell";
import { OrderDetailModal } from "@/components/orders/order-detail-modal";
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
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Textarea } from "@/components/ui/textarea";
import { showError, showSuccess } from "@/lib/toast";
import {
  fetchEnquiryOrderLog,
  updateAdminOrderStatus,
} from "@/services/api/admin-orders";
import { ApiError } from "@/services/api/errors";
import type { SiteCode } from "@/types/auth";
import type {
  AdminOrderDetail,
  AdminOrderEnquiryItem,
  AdminOrderLogPeriod,
} from "@/types/admin-orders";

const PAGE_SIZE = 15;

const ORDER_STATUS_OPTIONS = [
  { value: "PENDING", label: "Pending" },
  { value: "PROCESSING", label: "Processing" },
  { value: "SHIPPED", label: "Shipped" },
  { value: "DELIVERED", label: "Delivered" },
  { value: "CANCELLED", label: "Cancelled" },
] as const;

function toDateInput(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

function formatCurrency(value: number, currency = "INR"): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: currency || "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDateTime(value: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function getStatusBadgeClass(status: string) {
  const s = status?.toUpperCase();
  switch (s) {
    case "DELIVERED":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "SHIPPED":
      return "bg-blue-50 text-blue-700 border-blue-200";
    case "PROCESSING":
      return "bg-amber-50 text-amber-700 border-amber-200";
    case "CANCELLED":
    case "REFUNDED":
      return "bg-rose-50 text-rose-700 border-rose-200";
    default:
      return "bg-slate-100 text-slate-700 border-slate-200";
  }
}

export function EnquiryOrderPage({ siteCode }: { siteCode: SiteCode }) {
  const [period, setPeriod] = useState<AdminOrderLogPeriod>("all");
  const [dayDate, setDayDate] = useState(() => toDateInput(new Date()));
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [orders, setOrders] = useState<AdminOrderEnquiryItem[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Status Update Modal State (Image 1)
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [targetOrder, setTargetOrder] = useState<AdminOrderEnquiryItem | null>(null);
  const [newStatus, setNewStatus] = useState<string>("PENDING");
  const [updateMessage, setUpdateMessage] = useState("");
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // View Details Modal State
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailOrder, setDetailOrder] = useState<AdminOrderDetail | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

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
        const result = await fetchEnquiryOrderLog(siteCode, {
          page: nextPage,
          pageSize: PAGE_SIZE,
          all: showAll,
          date: showAll
            ? undefined
            : period === "day"
            ? dayDate
            : toDateInput(new Date()),
          status: statusFilter,
          q: debouncedSearch || undefined,
        });

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
            : "Failed to load enquiry orders";
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
    [dayDate, debouncedSearch, period, siteCode, statusFilter],
  );

  useEffect(() => {
    void loadPage(1, false);
  }, [loadPage]);

  // Infinite scroll
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

  // Open status update modal
  const handleOpenStatusModal = (order: AdminOrderEnquiryItem, requestedStatus: string) => {
    setTargetOrder(order);
    setNewStatus(requestedStatus);
    setUpdateMessage("");
    setStatusModalOpen(true);
  };

  // Submit status update
  const handleSubmitStatusUpdate = async () => {
    if (!targetOrder) return;
    setIsUpdatingStatus(true);
    try {
      const updated = await updateAdminOrderStatus(siteCode, targetOrder.id, {
        status: newStatus,
        message: updateMessage.trim() || null,
      });

      // Update in state
      setOrders((prev) =>
        prev.map((o) =>
          o.id === targetOrder.id
            ? {
                ...o,
                ...updated,
                itemCount: o.itemCount,
                itemsSummary: o.itemsSummary,
              }
            : o,
        ),
      );

      setDetailOrder((prev) =>
        prev && prev.id === targetOrder.id ? { ...prev, ...updated } : prev,
      );

      showSuccess(`Order #${targetOrder.orderNumber} status updated to ${newStatus}`);
      setStatusModalOpen(false);
    } catch (err) {
      showError(err instanceof ApiError ? err.message : "Failed to update order status");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Open detail view modal - instant with zero network delay (data pre-loaded in table)
  const handleViewDetails = (order: AdminOrderEnquiryItem) => {
    setDetailOrder(order);
    setIsLoadingDetail(false);
    setDetailModalOpen(true);
  };

  const handleResetFilters = () => {
    setPeriod("today");
    setDayDate(toDateInput(new Date()));
    setStatusFilter("ALL");
    setSearch("");
  };

  const metrics = useMemo(() => {
    // Only completed payments: CAPTURED payment status and not CANCELLED/REFUNDED/PENDING
    const completedRevenue = orders
      .filter((o) => {
        const isCaptured =
          o.paymentStatus === "CAPTURED" ||
          o.paymentDetails?.some((p) => p.status === "CAPTURED");
        const isNotPendingOrCancelled =
          o.status !== "CANCELLED" &&
          o.status !== "REFUNDED" &&
          o.status !== "PENDING";
        return isCaptured && isNotPendingOrCancelled;
      })
      .reduce((sum, o) => sum + (Number(o.grandTotal) || 0), 0);

    const completedCount = orders.filter(
      (o) => o.status === "COMPLETED" || o.status === "DELIVERED",
    ).length;

    const pendingCount = orders.filter(
      (o) =>
        o.status === "PENDING" ||
        o.status === "PROCESSING" ||
        o.status === "CONFIRMED",
    ).length;

    const primaryCurrency = orders[0]?.currency || (siteCode === "IN" ? "INR" : "USD");

    return {
      revenue: completedRevenue,
      currency: primaryCurrency,
      totalOrders: total || orders.length,
      completedOrders: completedCount,
      pendingOrders: pendingCount,
    };
  }, [orders, total, siteCode]);

  return (
    <AdminAppShell
      siteCode={siteCode}
      title="Enquiry Order"
      description="Review order enquiries, track fulfillment, and update order statuses."
    >
      <div className="mx-auto w-full max-w-[1400px] space-y-6">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-foreground">
            Enquiry Orders
          </h2>
          <p className="text-sm text-muted-foreground">
            Filter customer orders, review detailed records section by section, and update order status with automated email tracking notifications.
          </p>
        </div>

        {/* KPI Summary Cards: 4 in a row */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4" data-testid="enquiry-order-stats">
          {/* Card 1: Total Revenue */}
          <Card className="shadow-(--shadow-card) border-border/80">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Revenue
              </CardTitle>
              <div className="rounded-lg bg-primary/10 p-2 text-primary">
                <Wallet className="size-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold tracking-tight">
                {formatCurrency(metrics.revenue, metrics.currency)}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Completed payments only (excluding pending)
              </p>
            </CardContent>
          </Card>

          {/* Card 2: Total Orders */}
          <Card className="shadow-(--shadow-card) border-border/80">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Orders
              </CardTitle>
              <div className="rounded-lg bg-blue-500/10 p-2 text-blue-600 dark:text-blue-400">
                <ShoppingBag className="size-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold tracking-tight">
                {metrics.totalOrders}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {period === "all" ? "All-time enquiry orders" : "For selected period"}
              </p>
            </CardContent>
          </Card>

          {/* Card 3: Completed Orders */}
          <Card className="shadow-(--shadow-card) border-border/80">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Fulfilled Orders
              </CardTitle>
              <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="size-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold tracking-tight">
                {metrics.completedOrders}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Delivered & completed status
              </p>
            </CardContent>
          </Card>

          {/* Card 4: Pending / In-Progress Orders */}
          <Card className="shadow-(--shadow-card) border-border/80">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pending Fulfillment
              </CardTitle>
              <div className="rounded-lg bg-amber-500/10 p-2 text-amber-600 dark:text-amber-400">
                <Clock className="size-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold tracking-tight">
                {metrics.pendingOrders}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Pending, confirmed & processing
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Section 1: Filter Section */}
        <Card className="border-border shadow-xs">
          <CardHeader className="border-b border-border/70 pb-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Filter className="h-5 w-5 text-muted-foreground" />
                <div>
                  <CardTitle className="text-base font-semibold">Filter Orders</CardTitle>
                  <CardDescription className="text-xs">
                    Filter by customer name, order number, product, date, or status.
                  </CardDescription>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleResetFilters}
                className="gap-1.5 text-xs font-medium"
              >
                <RotateCcw className="size-3.5" />
                Reset Filters
              </Button>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4 pt-5 md:grid-cols-4">
            {/* Search Input */}
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="order-search" className="text-xs font-medium">
                Search
              </Label>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="order-search"
                  placeholder="Search by customer name, email, order #, or product..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 text-xs sm:text-sm"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
                  >
                    <X className="size-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Placed Period */}
            <div className="space-y-1.5">
              <Label htmlFor="order-period" className="text-xs font-medium">
                Placed Period
              </Label>
              <Select
                value={period}
                onValueChange={(val) => {
                  if (val === "today" || val === "all" || val === "day") {
                    setPeriod(val);
                  }
                }}
              >
                <SelectTrigger id="order-period" className="w-full text-xs sm:text-sm">
                  <SelectValue placeholder="Today" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="day">Specific Day</SelectItem>
                  <SelectItem value="all">All Time</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Status Filter */}
            <div className="space-y-1.5">
              <Label htmlFor="order-status-filter" className="text-xs font-medium">
                Status
              </Label>
              <Select
                value={statusFilter}
                onValueChange={(val) => setStatusFilter(val)}
              >
                <SelectTrigger id="order-status-filter" className="w-full text-xs sm:text-sm">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Statuses</SelectItem>
                  {ORDER_STATUS_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Day Date Picker (Conditional) */}
            {period === "day" && (
              <div className="space-y-1.5 md:col-span-2">
                <Label htmlFor="order-day-date" className="text-xs font-medium">
                  Select Day
                </Label>
                <Input
                  id="order-day-date"
                  type="date"
                  value={dayDate}
                  onChange={(e) => setDayDate(e.target.value)}
                  className="w-full text-xs sm:text-sm"
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Section 2: Orders Table Section */}
        <Card className="border-border shadow-xs">
          <CardHeader className="border-b border-border/70 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold">Orders List</CardTitle>
                <CardDescription className="text-xs">
                  Showing {orders.length} of {total} orders
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          {loadError ? (
            <div className="p-6">
              <Alert variant="destructive">
                <AlertTitle>Error loading orders</AlertTitle>
                <AlertDescription>{loadError}</AlertDescription>
              </Alert>
            </div>
          ) : (
            <div className="relative overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 hover:bg-muted/40 text-xs">
                    <TableHead className="w-12 text-center font-semibold">S.No</TableHead>
                    <TableHead className="font-semibold">Order Number</TableHead>
                    <TableHead className="font-semibold">Placed Date</TableHead>
                    <TableHead className="font-semibold">Customer</TableHead>
                    <TableHead className="font-semibold">Products / Items</TableHead>
                    <TableHead className="font-semibold">Grand Total</TableHead>
                    <TableHead className="w-30 font-semibold">Status</TableHead>
                    <TableHead className="w-20 text-center font-semibold">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading && orders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="py-12 text-center text-muted-foreground">
                        <Loader2 className="mx-auto size-6 animate-spin text-muted-foreground mb-2" />
                        Loading enquiry orders...
                      </TableCell>
                    </TableRow>
                  ) : orders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="py-12 text-center text-muted-foreground">
                        No orders match your filter criteria.
                      </TableCell>
                    </TableRow>
                  ) : (
                    orders.map((ord, idx) => {
                      const rawStatus = ord.status?.toUpperCase() || "PENDING";
                      const currentStatusUpper =
                        rawStatus === "CONFIRMED" ||
                        !ORDER_STATUS_OPTIONS.some((o) => o.value === rawStatus)
                          ? "PENDING"
                          : rawStatus;
                      return (
                        <TableRow key={ord.id} className="text-xs sm:text-sm hover:bg-muted/20">
                          {/* S.No */}
                          <TableCell className="text-center font-medium text-muted-foreground">
                            {idx + 1}
                          </TableCell>

                          {/* Order Number */}
                          <TableCell className="font-semibold text-foreground whitespace-nowrap">
                            #{ord.orderNumber}
                          </TableCell>

                          {/* Placed Date */}
                          <TableCell className="whitespace-nowrap text-muted-foreground">
                            {formatDateTime(ord.placedAt || ord.createdAt)}
                          </TableCell>

                          {/* Customer */}
                          <TableCell>
                            <div className="font-medium text-foreground truncate max-w-[180px]">
                              {ord.customerName || "Customer"}
                            </div>
                            <div className="text-xs text-muted-foreground truncate max-w-[180px]">
                              {ord.customerEmail}
                            </div>
                          </TableCell>

                          {/* Products / Items */}
                          <TableCell className="max-w-[220px]">
                            <div className="font-medium text-foreground truncate" title={ord.itemsSummary}>
                              {ord.itemsSummary || `${ord.itemCount} items`}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {ord.itemCount} {ord.itemCount === 1 ? "item" : "items"}
                            </div>
                          </TableCell>

                          {/* Grand Total */}
                          <TableCell className="font-bold whitespace-nowrap text-foreground">
                            {formatCurrency(ord.grandTotal, ord.currency)}
                          </TableCell>

                          {/* Status Select Column (before Action) */}
                          <TableCell className="whitespace-nowrap">
                            <Select
                              value={currentStatusUpper}
                              onValueChange={(val) => {
                                if (val !== currentStatusUpper) {
                                  handleOpenStatusModal(ord, val);
                                }
                              }}
                            >
                              <SelectTrigger
                                className={`h-8 min-w-[110px] w-full max-w-[130px] text-xs font-semibold rounded-md border ${getStatusBadgeClass(
                                  currentStatusUpper,
                                )}`}
                              >
                                <SelectValue placeholder="Pending" />
                              </SelectTrigger>
                              <SelectContent>
                                {ORDER_STATUS_OPTIONS.map((opt) => (
                                  <SelectItem
                                    key={opt.value}
                                    value={opt.value}
                                    className="text-xs font-medium"
                                  >
                                    {opt.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>

                          {/* Action (Eye Icon) */}
                          <TableCell className="text-center">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleViewDetails(ord)}
                              className="size-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
                              title="View Order Details"
                            >
                              <Eye className="size-6" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Infinite Scroll Anchor */}
          <div ref={loadMoreRef} className="py-2 text-center text-xs text-muted-foreground">
            {isLoadingMore && (
              <span className="inline-flex items-center gap-1.5 py-3">
                <Loader2 className="size-4 animate-spin" />
                Loading more orders...
              </span>
            )}
          </div>
        </Card>
      </div>

      {/* =========================================================================
          MODAL 1: Update Order Status (Matching Image 1 EXACTLY)
          ========================================================================= */}
      <Dialog open={statusModalOpen} onOpenChange={setStatusModalOpen}>
        <DialogContent className="sm:max-w-[460px] p-6 rounded-xl">
          <DialogHeader className="space-y-1 pb-1">
            <DialogTitle className="text-xl font-bold text-blue-600">
              Update Order Status
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {targetOrder && `Order #${targetOrder.orderNumber} — Customer: ${targetOrder.customerEmail}`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* New Status Select */}
            <div className="space-y-1.5">
              <Label htmlFor="update-new-status" className="text-xs font-semibold text-foreground">
                New Status
              </Label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger id="update-new-status" className="w-full text-sm font-medium h-10">
                  <SelectValue placeholder="Select Status" />
                </SelectTrigger>
                <SelectContent>
                  {ORDER_STATUS_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value} className="text-sm">
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Update Message Textarea */}
            <div className="space-y-1.5">
              <Label htmlFor="update-status-msg" className="text-xs font-semibold text-foreground">
                Update Message (Optional)
              </Label>
              <Textarea
                id="update-status-msg"
                placeholder="Add a message about this status update..."
                value={updateMessage}
                onChange={(e) => setUpdateMessage(e.target.value)}
                rows={4}
                className="text-sm resize-none"
              />
              <p className="text-[11px] text-muted-foreground">
                This message and tracking link will be sent in the email notification to the customer.
              </p>
            </div>
          </div>

          <DialogFooter className="flex sm:justify-end gap-2 pt-2 border-t border-border/60">
            <Button
              type="button"
              variant="outline"
              onClick={() => setStatusModalOpen(false)}
              disabled={isUpdatingStatus}
              className="text-sm font-medium"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSubmitStatusUpdate}
              disabled={isUpdatingStatus}
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-5 shadow-xs"
            >
              {isUpdatingStatus ? (
                <>
                  <Loader2 className="size-4 animate-spin mr-1.5" />
                  Updating...
                </>
              ) : (
                "Update Status"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* =========================================================================
          MODAL 2: View Order Details (Section by Section)
          ========================================================================= */}
      <OrderDetailModal
        open={detailModalOpen}
        onOpenChange={setDetailModalOpen}
        order={detailOrder}
        isLoading={isLoadingDetail}
      />
    </AdminAppShell>
  );
}
