"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ClipboardList,
  MessageSquare,
  Package,
  ShoppingBag,
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
import { AdminSidebar } from "@/components/layout/admin-sidebar";
import { AdminTopbar } from "@/components/layout/admin-topbar";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchDashboard } from "@/services/api/dashboard";
import { ApiError } from "@/services/api/errors";
import type { SiteCode } from "@/types/auth";
import {
  isComDashboard,
  isInDashboard,
  type DashboardData,
} from "@/types/dashboard";

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

export function DashboardView({ siteCode }: { siteCode: SiteCode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [from, setFrom] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return toDateInput(date);
  });
  const [to, setTo] = useState(() => toDateInput(new Date()));
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await fetchDashboard(siteCode, { from, to });
      setData(result);
    } catch (err) {
      setData(null);
      setError(err instanceof ApiError ? err.message : "Failed to load dashboard");
    } finally {
      setIsLoading(false);
    }
  }, [siteCode, from, to]);

  useEffect(() => {
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
        },
        {
          id: "revenue",
          label: "Total revenue",
          value: formatCurrency(data.totals.revenue),
          icon: Wallet,
        },
        {
          id: "customers",
          label: "Customers",
          value: String(data.totals.customers),
          icon: Users,
        },
        {
          id: "stock",
          label: "Products in stock",
          value: String(data.totals.productsInStock),
          icon: Package,
        },
        {
          id: "low-stock",
          label: "Low-stock alerts",
          value: String(data.totals.lowStockAlerts),
          icon: AlertTriangle,
        },
        {
          id: "pending",
          label: "Pending orders",
          value: String(data.totals.pendingOrders),
          icon: ClipboardList,
        },
      ];
    }

    return [
      {
        id: "enquiries",
        label: "Total enquiries",
        value: String(data.totals.enquiries),
        icon: MessageSquare,
      },
      {
        id: "new",
        label: "New enquiries",
        value: String(data.totals.newEnquiries),
        icon: ClipboardList,
      },
      {
        id: "awaiting",
        label: "Awaiting response",
        value: String(data.totals.awaitingResponse),
        icon: AlertTriangle,
      },
    ];
  }, [data]);

  return (
    <div className="flex min-h-screen bg-surface">
      <AdminSidebar
        siteCode={siteCode}
        collapsed={collapsed}
        onCollapsedChange={setCollapsed}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <AdminTopbar
          siteCode={siteCode}
          title="Dashboard"
          from={from}
          to={to}
          onFromChange={setFrom}
          onToChange={setTo}
          onRefresh={() => void load()}
          mobileMenuSlot={
            <AdminSidebar
              siteCode={siteCode}
              collapsed={false}
              onCollapsedChange={() => undefined}
              variant="mobile"
            />
          }
        />

        <main className="flex-1 space-y-6 px-4 py-6 lg:px-6">
          {error ? (
            <Alert variant="destructive" data-testid="dashboard-error">
              <AlertTitle>Unable to load dashboard</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          {isLoading ? <StatCardsSkeleton count={siteCode === "IN" ? 6 : 3} /> : <StatCards items={stats} />}

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
                <CardHeader>
                  <CardTitle className="text-base">Recent orders</CardTitle>
                </CardHeader>
                <CardContent>
                  {data.recentOrders.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No orders yet.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[640px] text-left text-sm">
                        <thead className="text-muted-foreground">
                          <tr className="border-b">
                            <th className="py-2 pr-3 font-medium">Order</th>
                            <th className="py-2 pr-3 font-medium">Customer</th>
                            <th className="py-2 pr-3 font-medium">Status</th>
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
                <StatusDonutChart
                  data={data.charts.enquiriesByStatus}
                  title="Enquiries by status"
                />
              </div>
              <Card className="shadow-(--shadow-card)" data-testid="recent-enquiries">
                <CardHeader>
                  <CardTitle className="text-base">Recent enquiries</CardTitle>
                </CardHeader>
                <CardContent>
                  {data.recentEnquiries.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No enquiries yet.</p>
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
        </main>
      </div>
    </div>
  );
}
