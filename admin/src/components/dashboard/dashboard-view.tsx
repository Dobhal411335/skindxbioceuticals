"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  ClipboardList,
  Handshake,
  MessageSquare,
  Package,
  ShoppingBag,
  Truck,
  Users,
  Wallet,
} from "lucide-react";

import {
  EnquiryLineChart,
  HorizontalBarChart,
  OrdersLineChart,
  RevenueAreaChart,
  StatusDonutChart,
} from "@/components/dashboard/charts";
import { StatCards, StatCardsSkeleton, type StatCardItem } from "@/components/dashboard/stat-cards";
import { AdminAppShell } from "@/components/layout/admin-app-shell";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { moduleHref } from "@/config/admin-modules";
import { cn } from "@/lib/utils";
import { fetchVendorOrderLog } from "@/services/api/admin-orders";
import { fetchDashboard } from "@/services/api/dashboard";
import { ApiError } from "@/services/api/errors";
import { fetchVendorApplications, fetchVendorCredentials } from "@/services/api/vendors";
import type { AdminOrderLogItem } from "@/types/admin-orders";
import type { SiteCode } from "@/types/auth";
import {
  isComDashboard,
  isInDashboard,
  type DashboardData,
} from "@/types/dashboard";
import type { VendorApplicationListItem } from "@/types/vendors";

function toDateInput(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function formatCurrency(value: number, currency = "INR"): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

interface VendorDashboardSummary {
  totalOrders: number;
  recentOrders: AdminOrderLogItem[];
  pendingApplications: number;
  activeCredentials: number;
  recentApplications: VendorApplicationListItem[];
}

export function DashboardView({ siteCode }: { siteCode: SiteCode }) {
  const [from, setFrom] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return toDateInput(date);
  });
  const [to, setTo] = useState(() => toDateInput(new Date()));
  const [data, setData] = useState<DashboardData | null>(null);
  const [vendorData, setVendorData] = useState<VendorDashboardSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [dashResult, vendorOrdersRes, appsRes, credsRes] = await Promise.allSettled([
        fetchDashboard(siteCode, { from, to }),
        fetchVendorOrderLog(siteCode, { page: 1, pageSize: 5, all: true }),
        fetchVendorApplications(siteCode, { status: "all" }),
        fetchVendorCredentials(siteCode),
      ]);

      if (dashResult.status === "fulfilled") {
        setData(dashResult.value);
      } else {
        setData(null);
        const err = dashResult.reason;
        setError(err instanceof ApiError ? err.message : "Failed to load dashboard");
      }

      const vendorOrders = vendorOrdersRes.status === "fulfilled" ? vendorOrdersRes.value : null;
      const vendorApps = appsRes.status === "fulfilled" ? appsRes.value : [];
      const vendorCreds = credsRes.status === "fulfilled" ? credsRes.value : [];

      setVendorData({
        totalOrders: vendorOrders?.total ?? 0,
        recentOrders: vendorOrders?.orders ?? [],
        pendingApplications: vendorApps.filter((a) => a.status === "PENDING").length,
        activeCredentials: vendorCreds.filter((c) => c.isActive).length,
        recentApplications: vendorApps.slice(0, 5),
      });
    } catch (err) {
      setData(null);
      setError(err instanceof ApiError ? err.message : "Failed to load dashboard");
    } finally {
      setIsLoading(false);
    }
  }, [siteCode, from, to]);

  useEffect(() => {
    // Intentional data-fetch effect; load() sets loading/error/data for the selected range.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- dashboard metrics fetch
    void load();
  }, [load]);

  const stats: StatCardItem[] = useMemo(() => {
    if (!data) return [];

    if (isInDashboard(data)) {
      return [
        {
          id: "orders",
          label: "Total orders",
          value: String(data.totals.orders),
          icon: ShoppingBag,
          href: moduleHref(siteCode, "orders/online-log"),
          hint: "Online order log",
        },
        {
          id: "revenue",
          label: "Total revenue",
          value: formatCurrency(data.totals.revenue),
          icon: Wallet,
          href: moduleHref(siteCode, "orders/online-log"),
          hint: "Completed payments only (excluding pending)",
        },
        {
          id: "vendor-orders",
          label: "Vendor orders",
          value: vendorData ? String(vendorData.totalOrders) : "0",
          icon: Truck,
          href: moduleHref(siteCode, "orders/vendor"),
          hint: "Click to view vendor order log",
        },
        {
          id: "vendor-requests",
          label: "Pending vendor requests",
          value: vendorData ? String(vendorData.pendingApplications) : "0",
          icon: Handshake,
          href: moduleHref(siteCode, "vendor/become-partner"),
          hint: "Click to review partner applications",
        },
        {
          id: "customers",
          label: "Customers",
          value: String(data.totals.customers),
          icon: Users,
          href: moduleHref(siteCode, "vendor/partner-login-details"),
          hint: "Customer & vendor accounts",
        },
        {
          id: "stock",
          label: "Products in stock",
          value: String(data.totals.productsInStock),
          icon: Package,
          href: moduleHref(siteCode, "products/view-all"),
          hint: "Catalog inventory",
        },
        {
          id: "low-stock",
          label: "Low-stock alerts",
          value: String(data.totals.lowStockAlerts),
          icon: AlertTriangle,
          href: moduleHref(siteCode, "stock-management"),
          hint: "Stock management",
        },
        {
          id: "pending",
          label: "Pending orders",
          value: String(data.totals.pendingOrders),
          icon: ClipboardList,
          href: moduleHref(siteCode, "orders/cancel"),
          hint: "Pending payment review",
        },
      ];
    }

    if (isComDashboard(data)) {
      return [
        {
          id: "enquiries",
          label: "Total enquiries",
          value: String(data.totals.enquiries),
          icon: MessageSquare,
          href: moduleHref(siteCode, "orders/enquiry"),
          hint: "Customer enquiries",
        },
        {
          id: "new",
          label: "New enquiries",
          value: String(data.totals.newEnquiries),
          icon: ClipboardList,
          href: moduleHref(siteCode, "orders/enquiry"),
          hint: "Requires response",
        },
        {
          id: "awaiting",
          label: "Awaiting response",
          value: String(data.totals.awaitingResponse),
          icon: AlertTriangle,
          href: moduleHref(siteCode, "orders/enquiry"),
          hint: "Team follow-up",
        },
        {
          id: "vendor-requests",
          label: "Pending vendor requests",
          value: vendorData ? String(vendorData.pendingApplications) : "0",
          icon: Handshake,
          href: moduleHref(siteCode, "vendor/become-partner"),
          hint: "Click to review partner requests",
        },
      ];
    }

    return [];
  }, [data, vendorData, siteCode]);

  const description =
    siteCode === "IN"
      ? "Review live ecommerce statistics and vendor partner activity for the selected website."
      : "Review live enquiry metrics and vendor partner activity for the selected website.";

  return (
    <AdminAppShell
      siteCode={siteCode}
      title="Dashboard"
      description={description}
      topbar={{
        from,
        to,
        onFromChange: setFrom,
        onToChange: setTo,
        onRefresh: () => void load(),
      }}
    >
      {error ? (
        <Alert variant="destructive" data-testid="dashboard-error">
          <AlertTitle>Unable to load dashboard</AlertTitle>
          <AlertDescription className="flex flex-wrap items-center justify-between gap-3">
            <span>{error}</span>
            <Button variant="outline" size="sm" onClick={() => void load()}>
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      ) : null}

      {isLoading ? (
        <StatCardsSkeleton count={siteCode === "IN" ? 8 : 4} />
      ) : (
        <StatCards items={stats} />
      )}

      {!isLoading && !error && data && isInDashboard(data) ? (
        <>
          <div className="grid gap-4 xl:grid-cols-2">
            <RevenueAreaChart data={data.charts.revenueOverTime} />
            <OrdersLineChart data={data.charts.orderActivityOverTime} />
            <StatusDonutChart data={data.charts.ordersByStatus} title="Orders by status" />
            <HorizontalBarChart
              data={data.charts.bestsellingProducts}
              title="Bestselling products"
            />
          </div>
          <Card className="shadow-(--shadow-card)" data-testid="recent-orders">
            <CardHeader className="flex flex-row items-center justify-between gap-3 pb-3">
              <CardTitle className="text-base">Recent orders</CardTitle>
              <Button asChild variant="outline" size="sm">
                <Link href={moduleHref(siteCode, "orders/online-log")}>
                  View all recent orders
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {data.recentOrders.length === 0 ? (
                <p className="text-sm text-muted-foreground">No orders in this date range.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[640px] text-left text-sm">
                    <thead className="text-muted-foreground">
                      <tr className="border-b">
                        <th className="py-2 pr-3 font-medium">Order</th>
                        <th className="py-2 pr-3 font-medium">Customer</th>
                        <th className="py-2 pr-3 font-medium">Status</th>
                        <th className="py-2 pr-3 font-medium">CGST</th>
                        <th className="py-2 pr-3 font-medium">SGST</th>
                        <th className="py-2 pr-3 font-medium">Total</th>
                        <th className="py-2 font-medium">Placed</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.recentOrders.map((order) => (
                        <tr key={order.id} className="border-b border-border/60">
                          <td className="py-2.5 pr-3 font-medium">{order.orderNumber}</td>
                          <td className="py-2.5 pr-3">{order.customerEmail ?? "—"}</td>
                          <td className="py-2.5 pr-3">{order.status}</td>
                          <td className="py-2.5 pr-3">
                            {formatCurrency(order.cgstTotal ?? 0, order.currency)}
                          </td>
                          <td className="py-2.5 pr-3">
                            {formatCurrency(order.sgstTotal ?? 0, order.currency)}
                          </td>
                          <td className="py-2.5 pr-3">
                            {formatCurrency(order.grandTotal, order.currency)}
                          </td>
                          <td className="py-2.5">
                            {new Date(order.createdAt).toLocaleString("en-IN")}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      ) : null}

      {!isLoading && !error && data && isComDashboard(data) ? (
        <>
          <div className="grid gap-4 xl:grid-cols-2">
            <EnquiryLineChart data={data.charts.enquiriesOverTime} />
            <StatusDonutChart data={data.charts.enquiriesByStatus} title="Enquiries by status" />
          </div>
          <Card className="shadow-(--shadow-card)" data-testid="recent-enquiries">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Recent enquiries</CardTitle>
            </CardHeader>
            <CardContent>
              {data.recentEnquiries.length === 0 ? (
                <p className="text-sm text-muted-foreground">No enquiries in this date range.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[640px] text-left text-sm">
                    <thead className="text-muted-foreground">
                      <tr className="border-b">
                        <th className="py-2 pr-3 font-medium">Name</th>
                        <th className="py-2 pr-3 font-medium">Email</th>
                        <th className="py-2 pr-3 font-medium">Subject</th>
                        <th className="py-2 pr-3 font-medium">Status</th>
                        <th className="py-2 font-medium">Received</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.recentEnquiries.map((enquiry) => (
                        <tr key={enquiry.id} className="border-b border-border/60">
                          <td className="py-2.5 pr-3 font-medium">{enquiry.name}</td>
                          <td className="py-2.5 pr-3">{enquiry.email}</td>
                          <td className="py-2.5 pr-3">{enquiry.subject ?? "—"}</td>
                          <td className="py-2.5 pr-3">{enquiry.status}</td>
                          <td className="py-2.5">
                            {new Date(enquiry.createdAt).toLocaleString("en-IN")}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      ) : null}

      {/* Vendor & Partner Management Section */}
      {!isLoading && !error && (
        <section className="space-y-4 pt-2" data-testid="vendor-dashboard-section">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b pb-3">
            <div>
              <h2 className="text-lg font-semibold tracking-tight">Vendor & Partner Overview</h2>
              <p className="text-sm text-muted-foreground">
                Track vendor order transactions, partner onboarding requests, and active partner logins.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button asChild variant="outline" size="sm">
                <Link href={moduleHref(siteCode, "orders/vendor")}>
                  <Truck className="mr-1.5 size-4 text-primary" />
                  Vendor Orders
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link href={moduleHref(siteCode, "vendor/become-partner")}>
                  <Handshake className="mr-1.5 size-4 text-primary" />
                  Pending Requests ({vendorData?.pendingApplications ?? 0})
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link href={moduleHref(siteCode, "vendor/partner-login-details")}>
                  <Users className="mr-1.5 size-4 text-primary" />
                  Partner Logins ({vendorData?.activeCredentials ?? 0})
                </Link>
              </Button>
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            {/* Recent Vendor Orders Card */}
            <Card className="shadow-(--shadow-card)" data-testid="recent-vendor-orders">
              <CardHeader className="flex flex-row items-center justify-between gap-3 pb-3">
                <div>
                  <CardTitle className="text-base">Recent Vendor Orders</CardTitle>
                  <p className="text-xs text-muted-foreground">Orders fulfilled by registered partner vendors</p>
                </div>
                <Button asChild variant="ghost" size="sm" className="text-xs">
                  <Link href={moduleHref(siteCode, "orders/vendor")}>
                    View all <ArrowRight className="ml-1 size-3" />
                  </Link>
                </Button>
              </CardHeader>
              <CardContent>
                {vendorData && vendorData.recentOrders.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[520px] text-left text-sm">
                      <thead className="text-muted-foreground">
                        <tr className="border-b">
                          <th className="py-2 pr-3 font-medium">Order #</th>
                          <th className="py-2 pr-3 font-medium">Customer / Vendor</th>
                          <th className="py-2 pr-3 font-medium">Status</th>
                          <th className="py-2 pr-3 font-medium">Total</th>
                          <th className="py-2 font-medium">Placed</th>
                        </tr>
                      </thead>
                      <tbody>
                        {vendorData.recentOrders.map((order) => (
                          <tr key={order.id} className="border-b border-border/60 hover:bg-muted/30 transition-colors">
                            <td className="py-2.5 pr-3 font-medium">
                              <Link
                                href={moduleHref(siteCode, "orders/vendor")}
                                className="text-primary hover:underline"
                              >
                                {order.orderNumber}
                              </Link>
                            </td>
                            <td className="py-2.5 pr-3 text-muted-foreground truncate max-w-[150px]" title={order.customerEmail ?? ""}>
                              {order.customerEmail ?? "—"}
                            </td>
                            <td className="py-2.5 pr-3">
                              <span
                                className={cn(
                                  "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                                  order.status === "COMPLETED" || order.status === "DELIVERED"
                                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                    : order.status === "CANCELLED"
                                    ? "bg-red-500/10 text-red-600 dark:text-red-400"
                                    : "bg-amber-500/10 text-amber-600 dark:text-amber-400",
                                )}
                              >
                                {order.status}
                              </span>
                            </td>
                            <td className="py-2.5 pr-3 font-medium">
                              {formatCurrency(order.grandTotal, order.currency)}
                            </td>
                            <td className="py-2.5 text-muted-foreground text-xs">
                              {new Date(order.createdAt).toLocaleDateString("en-IN", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Truck className="size-8 text-muted-foreground/50 mb-2" />
                    <p className="text-sm font-medium">No vendor orders recorded yet</p>
                    <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                      Orders placed by approved vendors will automatically appear in this section.
                    </p>
                    <Button asChild variant="outline" size="sm" className="mt-4">
                      <Link href={moduleHref(siteCode, "orders/vendor")}>Go to Vendor Order Log</Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Vendor Applications & Partners Card */}
            <Card className="shadow-(--shadow-card)" data-testid="vendor-partner-summary">
              <CardHeader className="flex flex-row items-center justify-between gap-3 pb-3">
                <div>
                  <CardTitle className="text-base">Partner Applications & Accounts</CardTitle>
                  <p className="text-xs text-muted-foreground">Pending verification and active partner logins</p>
                </div>
                <Button asChild variant="ghost" size="sm" className="text-xs">
                  <Link href={moduleHref(siteCode, "vendor/become-partner")}>
                    View all <ArrowRight className="ml-1 size-3" />
                  </Link>
                </Button>
              </CardHeader>
              <CardContent>
                {vendorData && vendorData.recentApplications.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[520px] text-left text-sm">
                      <thead className="text-muted-foreground">
                        <tr className="border-b">
                          <th className="py-2 pr-3 font-medium">Business Name</th>
                          <th className="py-2 pr-3 font-medium">Contact Person</th>
                          <th className="py-2 pr-3 font-medium">Status</th>
                          <th className="py-2 font-medium">Applied</th>
                        </tr>
                      </thead>
                      <tbody>
                        {vendorData.recentApplications.map((app) => (
                          <tr key={app.id} className="border-b border-border/60 hover:bg-muted/30 transition-colors">
                            <td className="py-2.5 pr-3 font-medium">
                              <Link
                                href={moduleHref(siteCode, "vendor/become-partner")}
                                className="text-primary hover:underline"
                              >
                                {app.businessName}
                              </Link>
                            </td>
                            <td className="py-2.5 pr-3 text-muted-foreground">
                              <div>{app.contactPerson}</div>
                              <div className="text-xs text-muted-foreground/80">{app.email}</div>
                            </td>
                            <td className="py-2.5 pr-3">
                              <span
                                className={cn(
                                  "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                                  app.status === "APPROVED"
                                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                    : app.status === "REJECTED"
                                    ? "bg-red-500/10 text-red-600 dark:text-red-400"
                                    : "bg-amber-500/10 text-amber-600 dark:text-amber-400",
                                )}
                              >
                                {app.status}
                              </span>
                            </td>
                            <td className="py-2.5 text-muted-foreground text-xs">
                              {new Date(app.createdAt).toLocaleDateString("en-IN", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Handshake className="size-8 text-muted-foreground/50 mb-2" />
                    <p className="text-sm font-medium">No partner applications yet</p>
                    <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                      New vendor onboarding applications will be listed here for approval.
                    </p>
                    <Button asChild variant="outline" size="sm" className="mt-4">
                      <Link href={moduleHref(siteCode, "vendor/become-partner")}>Review Applications</Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </section>
      )}
    </AdminAppShell>
  );
}
