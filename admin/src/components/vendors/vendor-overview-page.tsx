"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  Eye,
  Handshake,
  RefreshCw,
  Search,
  Truck,
  Users,
  XCircle,
} from "lucide-react";

import { StatCards, StatCardsSkeleton } from "@/components/dashboard/stat-cards";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { moduleHref } from "@/config/admin-modules";
import { cn } from "@/lib/utils";
import { fetchVendorOrderLog } from "@/services/api/admin-orders";
import { ApiError } from "@/services/api/errors";
import { fetchVendorApplications, fetchVendorCredentials } from "@/services/api/vendors";
import type { AdminOrderLogItem } from "@/types/admin-orders";
import type { SiteCode } from "@/types/auth";
import type { VendorApplicationListItem, VendorCredential } from "@/types/vendors";

function formatCurrency(value: number, currency = "INR"): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

export function VendorOverviewPage({ siteCode }: { siteCode: SiteCode }) {
  const [orders, setOrders] = useState<AdminOrderLogItem[]>([]);
  const [totalOrders, setTotalOrders] = useState(0);
  const [applications, setApplications] = useState<VendorApplicationListItem[]>([]);
  const [credentials, setCredentials] = useState<VendorCredential[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [orderSearch, setOrderSearch] = useState("");
  const [appSearch, setAppSearch] = useState("");
  const [credSearch, setCredSearch] = useState("");
  const [appStatusFilter, setAppStatusFilter] = useState<"ALL" | "PENDING" | "APPROVED" | "REJECTED">("ALL");

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [ordersRes, appsRes, credsRes] = await Promise.allSettled([
        fetchVendorOrderLog(siteCode, { page: 1, pageSize: 20, all: true }),
        fetchVendorApplications(siteCode, { status: "all" }),
        fetchVendorCredentials(siteCode),
      ]);

      if (ordersRes.status === "fulfilled") {
        setOrders(ordersRes.value.orders);
        setTotalOrders(ordersRes.value.total);
      }

      if (appsRes.status === "fulfilled") {
        setApplications(appsRes.value);
      }

      if (credsRes.status === "fulfilled") {
        setCredentials(credsRes.value);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load vendor data");
    } finally {
      setIsLoading(false);
    }
  }, [siteCode]);

  useEffect(() => {
    void load();
  }, [load]);

  const pendingApps = useMemo(
    () => applications.filter((a) => a.status === "PENDING"),
    [applications],
  );

  const activeCreds = useMemo(
    () => credentials.filter((c) => c.isActive),
    [credentials],
  );

  const filteredOrders = useMemo(() => {
    const q = orderSearch.trim().toLowerCase();
    if (!q) return orders;
    return orders.filter(
      (o) =>
        o.orderNumber.toLowerCase().includes(q) ||
        (o.customerEmail && o.customerEmail.toLowerCase().includes(q)) ||
        o.status.toLowerCase().includes(q),
    );
  }, [orders, orderSearch]);

  const filteredApplications = useMemo(() => {
    return applications.filter((app) => {
      const matchesStatus =
        appStatusFilter === "ALL" ? true : app.status === appStatusFilter;
      const q = appSearch.trim().toLowerCase();
      const matchesSearch =
        !q ||
        app.businessName.toLowerCase().includes(q) ||
        app.contactPerson.toLowerCase().includes(q) ||
        app.email.toLowerCase().includes(q) ||
        app.mobile.includes(q);
      return matchesStatus && matchesSearch;
    });
  }, [applications, appStatusFilter, appSearch]);

  const filteredCredentials = useMemo(() => {
    const q = credSearch.trim().toLowerCase();
    if (!q) return credentials;
    return credentials.filter(
      (c) =>
        c.businessName.toLowerCase().includes(q) ||
        c.contactPerson.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.username.toLowerCase().includes(q),
    );
  }, [credentials, credSearch]);

  const stats = useMemo(() => {
    return [
      {
        id: "vendor-orders",
        label: "Vendor Orders",
        value: String(totalOrders),
        icon: Truck,
        href: moduleHref(siteCode, "orders/vendor"),
        hint: "Completed vendor orders",
      },
      {
        id: "pending-requests",
        label: "Pending Requests",
        value: String(pendingApps.length),
        icon: Clock,
        href: moduleHref(siteCode, "vendor/become-partner"),
        hint: "Awaiting partner review",
      },
      {
        id: "active-partners",
        label: "Active Partner Logins",
        value: String(activeCreds.length),
        icon: Users,
        href: moduleHref(siteCode, "vendor/partner-login-details"),
        hint: "Authorized partner accounts",
      },
      {
        id: "total-applications",
        label: "Total Applications",
        value: String(applications.length),
        icon: Handshake,
        href: moduleHref(siteCode, "vendor/become-partner"),
        hint: "All-time vendor registrations",
      },
    ];
  }, [siteCode, totalOrders, pendingApps.length, activeCreds.length, applications.length]);

  return (
    <AdminAppShell
      siteCode={siteCode}
      title="Vendor / Partner Section"
      description="Manage vendor applications, monitor partner login accounts, and track vendor order transactions."
    >
      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Error loading vendor data</AlertTitle>
          <AlertDescription className="flex items-center justify-between">
            <span>{error}</span>
            <Button variant="outline" size="sm" onClick={() => void load()}>
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      ) : null}

      {/* Top Stat Cards */}
      {isLoading ? (
        <StatCardsSkeleton count={4} />
      ) : (
        <StatCards items={stats} />
      )}

      {/* Quick Navigation Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="shadow-(--shadow-card) hover:border-primary/50 transition-all flex flex-col justify-between">
          <CardHeader>
            <div className="flex items-center gap-2 text-primary mb-1">
              <Truck className="size-5" />
              <CardTitle className="text-base">Vendor Orders</CardTitle>
            </div>
            <CardDescription>
              Review all completed and processed orders placed through authorized partner vendors.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <Button asChild className="w-full" variant="outline">
              <Link href={moduleHref(siteCode, "orders/vendor")}>
                Open Vendor Order Log <ArrowRight className="ml-2 size-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-(--shadow-card) hover:border-primary/50 transition-all flex flex-col justify-between">
          <CardHeader>
            <div className="flex items-center gap-2 text-primary mb-1">
              <Handshake className="size-5" />
              <CardTitle className="text-base">Pending Vendor Requests</CardTitle>
            </div>
            <CardDescription>
              Inspect incoming partner applications, verify KYC certificates, and approve accounts.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <Button asChild className="w-full" variant="outline">
              <Link href={moduleHref(siteCode, "vendor/become-partner")}>
                Review Applications ({pendingApps.length}) <ArrowRight className="ml-2 size-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-(--shadow-card) hover:border-primary/50 transition-all flex flex-col justify-between">
          <CardHeader>
            <div className="flex items-center gap-2 text-primary mb-1">
              <Users className="size-5" />
              <CardTitle className="text-base">Partner Login Details</CardTitle>
            </div>
            <CardDescription>
              Manage active vendor usernames, generate new credentials, or toggle account access.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <Button asChild className="w-full" variant="outline">
              <Link href={moduleHref(siteCode, "vendor/partner-login-details")}>
                Manage Partner Logins <ArrowRight className="ml-2 size-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Comprehensive Tabs View */}
      <Tabs defaultValue="orders" className="w-full space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b pb-3">
          <TabsList className="h-10">
            <TabsTrigger value="orders" className="gap-2">
              <Truck className="size-4" />
              Vendor Orders ({totalOrders})
            </TabsTrigger>
            <TabsTrigger value="requests" className="gap-2">
              <Handshake className="size-4" />
              Partner Applications ({applications.length})
            </TabsTrigger>
            <TabsTrigger value="credentials" className="gap-2">
              <Users className="size-4" />
              Partner Logins ({credentials.length})
            </TabsTrigger>
          </TabsList>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => void load()}
            disabled={isLoading}
            className="text-xs"
          >
            <RefreshCw className={cn("mr-1.5 size-3.5", isLoading && "animate-spin")} />
            Refresh Data
          </Button>
        </div>

        {/* Tab 1: Vendor Orders */}
        <TabsContent value="orders" className="space-y-4">
          <Card className="shadow-(--shadow-card)">
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-3">
              <div>
                <CardTitle className="text-base">Recent Vendor Orders</CardTitle>
                <CardDescription>Verified order records placed by vendor partners</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative w-64">
                  <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search by order or email..."
                    value={orderSearch}
                    onChange={(e) => setOrderSearch(e.target.value)}
                    className="pl-8 h-9 text-sm"
                  />
                </div>
                <Button asChild size="sm">
                  <Link href={moduleHref(siteCode, "orders/vendor")}>View Full Log</Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {filteredOrders.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                  <Truck className="size-10 mb-2 opacity-40" />
                  <p className="text-sm font-medium">No vendor orders found</p>
                  <p className="text-xs mt-1">Vendor orders with completed payment will show up here.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[640px] text-left text-sm">
                    <thead className="text-muted-foreground">
                      <tr className="border-b">
                        <th className="py-2.5 pr-3 font-medium">Order Number</th>
                        <th className="py-2.5 pr-3 font-medium">Vendor / Customer</th>
                        <th className="py-2.5 pr-3 font-medium">Items</th>
                        <th className="py-2.5 pr-3 font-medium">Payment</th>
                        <th className="py-2.5 pr-3 font-medium">Grand Total</th>
                        <th className="py-2.5 pr-3 font-medium">Placed</th>
                        <th className="py-2.5 pr-3 font-medium">Status</th>
                        <th className="py-2.5 font-medium text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredOrders.map((order) => (
                        <tr
                          key={order.id}
                          className="border-b border-border/60 hover:bg-muted/30 transition-colors"
                        >
                          <td className="py-3 pr-3 font-semibold text-primary">
                            <Link
                              href={moduleHref(siteCode, "orders/vendor")}
                              className="hover:underline"
                            >
                              {order.orderNumber}
                            </Link>
                          </td>
                          <td className="py-3 pr-3 text-muted-foreground">
                            {order.customerEmail ?? "—"}
                          </td>
                          <td className="py-3 pr-3">
                            <Badge variant="outline" className="font-normal text-xs">
                              {order.itemCount} item{order.itemCount === 1 ? "" : "s"}
                            </Badge>
                          </td>
                          <td className="py-3 pr-3">
                            <Badge variant="secondary" className="text-xs">
                              {order.paymentMethod || "CAPTURED"}
                            </Badge>
                          </td>
                          <td className="py-3 pr-3 font-medium">
                            {formatCurrency(order.grandTotal, order.currency)}
                          </td>
                          <td className="py-3 pr-3 text-muted-foreground text-xs">
                            {new Date(order.createdAt).toLocaleDateString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </td>
                          <td className="py-3 pr-3">
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
                          <td className="py-3 text-right">
                            <Button asChild variant="ghost" size="sm" className="h-8 text-xs">
                              <Link href={moduleHref(siteCode, "orders/vendor")}>
                                Details <ArrowRight className="ml-1 size-3" />
                              </Link>
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Partner Applications */}
        <TabsContent value="requests" className="space-y-4">
          <Card className="shadow-(--shadow-card)">
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-3">
              <div>
                <CardTitle className="text-base">Partner Applications</CardTitle>
                <CardDescription>
                  Review registration documents and approve onboarding requests
                </CardDescription>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1 bg-muted p-1 rounded-md text-xs">
                  {(["ALL", "PENDING", "APPROVED", "REJECTED"] as const).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setAppStatusFilter(st)}
                      className={cn(
                        "px-2.5 py-1 rounded text-xs font-medium transition-colors",
                        appStatusFilter === st
                          ? "bg-background text-foreground shadow-xs"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {st}
                    </button>
                  ))}
                </div>
                <div className="relative w-56">
                  <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search applicant..."
                    value={appSearch}
                    onChange={(e) => setAppSearch(e.target.value)}
                    className="pl-8 h-9 text-sm"
                  />
                </div>
                <Button asChild size="sm">
                  <Link href={moduleHref(siteCode, "vendor/become-partner")}>
                    Manage Requests
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {filteredApplications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                  <Handshake className="size-10 mb-2 opacity-40" />
                  <p className="text-sm font-medium">No partner applications match the criteria</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[640px] text-left text-sm">
                    <thead className="text-muted-foreground">
                      <tr className="border-b">
                        <th className="py-2.5 pr-3 font-medium">Business Name</th>
                        <th className="py-2.5 pr-3 font-medium">Contact Person</th>
                        <th className="py-2.5 pr-3 font-medium">Contact Info</th>
                        <th className="py-2.5 pr-3 font-medium">GST Number</th>
                        <th className="py-2.5 pr-3 font-medium">Applied Date</th>
                        <th className="py-2.5 pr-3 font-medium">Status</th>
                        <th className="py-2.5 font-medium text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredApplications.map((app) => (
                        <tr
                          key={app.id}
                          className="border-b border-border/60 hover:bg-muted/30 transition-colors"
                        >
                          <td className="py-3 pr-3 font-semibold text-primary">
                            <Link
                              href={moduleHref(siteCode, "vendor/become-partner")}
                              className="hover:underline"
                            >
                              {app.businessName}
                            </Link>
                          </td>
                          <td className="py-3 pr-3 text-foreground font-medium">
                            {app.contactPerson}
                          </td>
                          <td className="py-3 pr-3 text-muted-foreground text-xs">
                            <div>{app.email}</div>
                            <div>{app.mobile}</div>
                          </td>
                          <td className="py-3 pr-3 text-muted-foreground font-mono text-xs">
                            {app.gstNumber ?? "—"}
                          </td>
                          <td className="py-3 pr-3 text-muted-foreground text-xs">
                            {new Date(app.createdAt).toLocaleDateString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </td>
                          <td className="py-3 pr-3">
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
                          <td className="py-3 text-right">
                            <Button asChild variant="outline" size="sm" className="h-8 text-xs">
                              <Link href={moduleHref(siteCode, "vendor/become-partner")}>
                                <Eye className="mr-1 size-3.5" /> Review
                              </Link>
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Partner Logins */}
        <TabsContent value="credentials" className="space-y-4">
          <Card className="shadow-(--shadow-card)">
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-3">
              <div>
                <CardTitle className="text-base">Vendor Partner Login Accounts</CardTitle>
                <CardDescription>
                  Active partner accounts with portal access credentials
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative w-64">
                  <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search by business, user, email..."
                    value={credSearch}
                    onChange={(e) => setCredSearch(e.target.value)}
                    className="pl-8 h-9 text-sm"
                  />
                </div>
                <Button asChild size="sm">
                  <Link href={moduleHref(siteCode, "vendor/partner-login-details")}>
                    Manage Logins
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {filteredCredentials.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                  <Users className="size-10 mb-2 opacity-40" />
                  <p className="text-sm font-medium">No partner credentials found</p>
                  <p className="text-xs mt-1">Credentials generated upon vendor approval will appear here.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[640px] text-left text-sm">
                    <thead className="text-muted-foreground">
                      <tr className="border-b">
                        <th className="py-2.5 pr-3 font-medium">Business Name</th>
                        <th className="py-2.5 pr-3 font-medium">Contact Person</th>
                        <th className="py-2.5 pr-3 font-medium">Username</th>
                        <th className="py-2.5 pr-3 font-medium">Email</th>
                        <th className="py-2.5 pr-3 font-medium">Access Status</th>
                        <th className="py-2.5 font-medium text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCredentials.map((cred) => (
                        <tr
                          key={cred.id}
                          className="border-b border-border/60 hover:bg-muted/30 transition-colors"
                        >
                          <td className="py-3 pr-3 font-semibold text-primary">
                            <Link
                              href={moduleHref(siteCode, "vendor/partner-login-details")}
                              className="hover:underline"
                            >
                              {cred.businessName}
                            </Link>
                          </td>
                          <td className="py-3 pr-3 text-foreground">{cred.contactPerson}</td>
                          <td className="py-3 pr-3 font-mono text-xs">{cred.username}</td>
                          <td className="py-3 pr-3 text-muted-foreground text-xs">{cred.email}</td>
                          <td className="py-3 pr-3">
                            <span
                              className={cn(
                                "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                                cred.isActive
                                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                  : "bg-red-500/10 text-red-600 dark:text-red-400",
                              )}
                            >
                              {cred.isActive ? "Active" : "Deactivated"}
                            </span>
                          </td>
                          <td className="py-3 text-right">
                            <Button asChild variant="ghost" size="sm" className="h-8 text-xs">
                              <Link href={moduleHref(siteCode, "vendor/partner-login-details")}>
                                Manage <ArrowRight className="ml-1 size-3" />
                              </Link>
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AdminAppShell>
  );
}
