"use client";

import {
  Calendar,
  CreditCard,
  ExternalLink,
  FileText,
  Loader2,
  Package,
  Truck,
  User,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { AdminOrderDetail } from "@/types/admin-orders";

interface OrderDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: AdminOrderDetail | null;
  isLoading?: boolean;
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

function getStatusBadgeClass(status: string): string {
  const s = status?.toUpperCase() || "";
  if (s === "DELIVERED") {
    return "bg-emerald-50 text-emerald-700 border-emerald-200";
  }
  if (s === "SHIPPED") {
    return "bg-indigo-50 text-indigo-700 border-indigo-200";
  }
  if (s === "PROCESSING") {
    return "bg-blue-50 text-blue-700 border-blue-200";
  }
  if (s === "CANCELLED" || s === "REFUNDED") {
    return "bg-rose-50 text-rose-700 border-rose-200";
  }
  return "bg-amber-50 text-amber-700 border-amber-200";
}

export function OrderDetailModal({
  open,
  onOpenChange,
  order,
  isLoading = false,
}: OrderDetailModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto p-6 sm:p-7 rounded-2xl">
        <DialogHeader className="border-b border-border/70 pb-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Order Details
              </span>
              <DialogTitle className="text-xl font-bold text-foreground">
                {order ? `#${order.orderNumber}` : "Loading..."}
              </DialogTitle>
            </div>
            {order && (
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className={`text-xs px-2.5 py-0.5 font-semibold ${getStatusBadgeClass(
                    order.status,
                  )}`}
                >
                  {order.status}
                </Badge>
                {order.paymentStatus && (
                  <Badge variant="secondary" className="text-xs">
                    Payment: {order.paymentStatus}
                  </Badge>
                )}
              </div>
            )}
          </div>
        </DialogHeader>

        {isLoading || !order ? (
          <div className="py-16 text-center text-muted-foreground space-y-2">
            <Loader2 className="mx-auto size-7 animate-spin text-primary" />
            <p className="text-sm">Fetching complete order details...</p>
          </div>
        ) : (
          <div className="space-y-6 pt-2 text-xs sm:text-sm">
            {/* Section 1: Customer & Contact Information */}
            <div className="rounded-xl border border-border/80 bg-muted/20 p-4 space-y-3">
              <div className="flex items-center gap-2 text-foreground font-semibold text-sm border-b border-border/60 pb-2">
                <User className="size-4 text-primary" />
                <span>Customer & Contact</span>
              </div>
              <div className="grid gap-2 sm:grid-cols-2 text-xs">
                <div>
                  <span className="text-muted-foreground">Customer Name: </span>
                  <span className="font-medium text-foreground">
                    {order.customerName || "Customer (Guest)"}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Email: </span>
                  <span className="font-medium text-foreground">
                    {order.customerEmail}
                  </span>
                </div>
                {order.customerPhone && (
                  <div>
                    <span className="text-muted-foreground">Phone: </span>
                    <span className="font-medium text-foreground">
                      {order.customerPhone}
                    </span>
                  </div>
                )}
                <div>
                  <span className="text-muted-foreground">Placed Date: </span>
                  <span className="font-medium text-foreground">
                    {formatDateTime(order.placedAt || order.createdAt)}
                  </span>
                </div>
              </div>
            </div>

            {/* Section 2: Shipping & Billing Addresses */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-border/80 bg-muted/20 p-4 space-y-2">
                <div className="flex items-center gap-2 text-foreground font-semibold text-sm border-b border-border/60 pb-1.5">
                  <Truck className="size-4 text-primary" />
                  <span>Shipping Address</span>
                </div>
                <div className="text-xs text-muted-foreground leading-relaxed">
                  {order.shippingAddress ? (
                    <>
                      <p className="font-medium text-foreground">
                        {order.shippingAddress.name ||
                          order.shippingAddress.fullName ||
                          "Recipient"}
                      </p>
                      {order.shippingAddress.phone && (
                        <p>Phone: {order.shippingAddress.phone}</p>
                      )}
                      <p>
                        {order.shippingAddress.addressLine1 ||
                          order.shippingAddress.street ||
                          ""}
                      </p>
                      {order.shippingAddress.addressLine2 && (
                        <p>{order.shippingAddress.addressLine2}</p>
                      )}
                      <p>
                        {[
                          order.shippingAddress.city,
                          order.shippingAddress.state,
                          order.shippingAddress.pincode ||
                            order.shippingAddress.postalCode,
                        ]
                          .filter(Boolean)
                          .join(", ")}
                      </p>
                    </>
                  ) : (
                    <p className="italic">No shipping address recorded</p>
                  )}
                </div>
              </div>

              <div className="rounded-xl border border-border/80 bg-muted/20 p-4 space-y-2">
                <div className="flex items-center gap-2 text-foreground font-semibold text-sm border-b border-border/60 pb-1.5">
                  <CreditCard className="size-4 text-primary" />
                  <span>Billing Address</span>
                </div>
                <div className="text-xs text-muted-foreground leading-relaxed">
                  {order.billingAddress ? (
                    <>
                      <p className="font-medium text-foreground">
                        {order.billingAddress.name ||
                          order.billingAddress.fullName ||
                          "Payer"}
                      </p>
                      <p>
                        {order.billingAddress.addressLine1 ||
                          order.billingAddress.street ||
                          ""}
                      </p>
                      <p>
                        {[
                          order.billingAddress.city,
                          order.billingAddress.state,
                          order.billingAddress.pincode ||
                            order.billingAddress.postalCode,
                        ]
                          .filter(Boolean)
                          .join(", ")}
                      </p>
                    </>
                  ) : (
                    <p className="italic">Same as shipping address</p>
                  )}
                </div>
              </div>
            </div>

            {/* Section: Prescription Image */}
            <div className="rounded-xl border border-border/80 bg-white p-4 space-y-3 shadow-xs">
              <div className="flex items-center justify-between border-b border-border/60 pb-2">
                <div className="flex items-center gap-2 font-semibold text-sm text-foreground">
                  <FileText className="size-4 text-primary" />
                  <span>Prescription Image</span>
                </div>
                {order.prescriptionImageUrl ? (
                  <Badge
                    variant="outline"
                    className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200"
                  >
                    Uploaded
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="text-xs text-muted-foreground">
                    Not Uploaded
                  </Badge>
                )}
              </div>

              {order.prescriptionImageUrl ? (
                <div className="space-y-3">
                  <div className="relative group overflow-hidden rounded-xl border border-border/80 bg-muted/20 flex flex-col items-center justify-center p-3">
                    <a
                      href={order.prescriptionImageUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block max-h-80 overflow-hidden rounded-lg transition-transform duration-200 hover:scale-[1.01]"
                      title="Click to view full image in new tab"
                    >
                      <img
                        src={order.prescriptionImageUrl}
                        alt={`Prescription for Order #${order.orderNumber}`}
                        className="max-h-80 w-auto rounded-lg object-contain shadow-xs border border-border/40"
                      />
                    </a>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs text-muted-foreground">
                      Customer uploaded doctor prescription
                    </span>
                    <Button asChild size="sm" variant="default" className="gap-1.5 text-xs">
                      <a
                        href={order.prescriptionImageUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="size-3.5" />
                        View Full Image
                      </a>
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-xs italic text-muted-foreground py-1">
                  No prescription was uploaded for this order (optional).
                </p>
              )}
            </div>

            {/* Section 3: Ordered Items Table */}
            <div className="rounded-xl border border-border/80 bg-white p-4 space-y-3 shadow-xs">
              <div className="flex items-center justify-between border-b border-border/60 pb-2">
                <div className="flex items-center gap-2 font-semibold text-sm text-foreground">
                  <Package className="size-4 text-primary" />
                  <span>Ordered Products ({order.items.length})</span>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-border/60 text-muted-foreground">
                      <th className="py-2 font-medium">Product</th>
                      <th className="py-2 font-medium">SKU</th>
                      <th className="py-2 font-medium text-right">Price</th>
                      <th className="py-2 font-medium text-center">Qty</th>
                      <th className="py-2 font-medium text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {order.items.map((item) => (
                      <tr key={item.id} className="py-2">
                        <td className="py-2.5 pr-2">
                          <div className="font-medium text-foreground">
                            {item.productName}
                          </div>
                          {item.variantName && (
                            <div className="text-[11px] text-muted-foreground">
                              {item.variantName}
                            </div>
                          )}
                        </td>
                        <td className="py-2.5 text-muted-foreground">
                          {item.sku || "—"}
                        </td>
                        <td className="py-2.5 text-right text-foreground font-medium">
                          {formatCurrency(item.unitPrice, order.currency)}
                        </td>
                        <td className="py-2.5 text-center text-foreground font-medium">
                          {item.quantity}
                        </td>
                        <td className="py-2.5 text-right font-bold text-foreground">
                          {formatCurrency(item.lineTotal, order.currency)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Section 4: Financial Summary */}
            <div className="rounded-xl border border-border/80 bg-muted/20 p-4 space-y-2">
              <div className="flex items-center justify-between border-b border-border/60 pb-2 text-sm font-semibold text-foreground">
                <span>Payment & Financial Summary</span>
                <Badge variant="outline" className="text-xs">
                  {order.paymentMethod || "ONLINE"}
                </Badge>
              </div>
              <div className="space-y-1.5 text-xs text-muted-foreground max-w-sm ml-auto">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span className="font-medium text-foreground">
                    {formatCurrency(order.subtotal, order.currency)}
                  </span>
                </div>
                {order.discountTotal > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Discount:</span>
                    <span className="font-medium">
                      -{formatCurrency(order.discountTotal, order.currency)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Shipping Total:</span>
                  <span className="font-medium text-foreground">
                    {order.shippingTotal > 0
                      ? formatCurrency(order.shippingTotal, order.currency)
                      : "Free"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Tax (GST):</span>
                  <span className="font-medium text-foreground">
                    {formatCurrency(order.taxTotal, order.currency)}
                  </span>
                </div>
                <div className="flex justify-between border-t border-border/60 pt-2 text-sm font-bold text-foreground">
                  <span>Grand Total:</span>
                  <span>{formatCurrency(order.grandTotal, order.currency)}</span>
                </div>
              </div>
            </div>

            {/* Section 5: Status History & Timeline */}
            {order.statusHistory && order.statusHistory.length > 0 && (
              <div className="rounded-xl border border-border/80 bg-white p-4 space-y-3 shadow-xs">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground border-b border-border/60 pb-2">
                  <Calendar className="size-4 text-primary" />
                  <span>Status Update Timeline</span>
                </div>
                <div className="space-y-3 text-xs">
                  {order.statusHistory.map((h, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-3 border-l-2 border-blue-500 pl-3"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-foreground uppercase tracking-wider text-[11px]">
                            {h.status}
                          </span>
                          <span className="text-muted-foreground text-[10px]">
                            {formatDateTime(h.updatedAt)}
                          </span>
                        </div>
                        {h.message && (
                          <p className="mt-1 text-slate-700 bg-slate-50 p-2 rounded-md border border-slate-200">
                            {h.message}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Section 6: Customer Checkout Notes (if present) */}
            {order.customerNotes && (
              <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-3 text-xs text-amber-900">
                <span className="font-semibold uppercase tracking-wider text-[10px] text-amber-800 block mb-0.5">
                  Customer Checkout Notes:
                </span>
                <p>{order.customerNotes}</p>
              </div>
            )}
          </div>
        )}

        <DialogFooter className="pt-3 border-t border-border/60">
          <DialogClose asChild>
            <Button type="button" variant="outline" size="sm">
              Close
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
