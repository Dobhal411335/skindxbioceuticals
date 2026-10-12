"use client";

import { BadgePercent, Pencil, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { CouponDto } from "@/types/coupon";

type CouponTableProps = {
  coupons: CouponDto[];
  onEdit: (coupon: CouponDto) => void;
  onDelete: (coupon: CouponDto) => void;
  onToggleActive: (coupon: CouponDto) => void;
};

function formatDiscount(coupon: CouponDto): string {
  if (coupon.percent != null) {
    return `${coupon.percent}%`;
  }
  if (coupon.amount != null) {
    return `₹${coupon.amount}`;
  }
  return `${coupon.type} ${coupon.value}`;
}

function formatDate(value: string | null): string {
  return value ?? "—";
}

export function CouponTable({
  coupons,
  onEdit,
  onDelete,
  onToggleActive,
}: CouponTableProps) {
  return (
    <Card className="overflow-hidden border-border bg-card shadow-sm">
      <CardHeader className="border-b border-border/70 pb-5">
        <div className="flex items-center gap-2">
          <BadgePercent className="h-5 w-5 text-muted-foreground" />
          <CardTitle className="text-lg font-semibold">All coupon codes</CardTitle>
        </div>
        <CardDescription>
          Edit, delete, or toggle active status for this site&apos;s coupons.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <Table className="min-w-[760px]">
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="px-4">Code</TableHead>
              <TableHead>Discount</TableHead>
              <TableHead>Start</TableHead>
              <TableHead>End</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="px-4 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {coupons.length > 0 ? (
              coupons.map((coupon) => (
                <TableRow key={coupon.id}>
                  <TableCell className="px-4 font-medium">{coupon.code}</TableCell>
                  <TableCell>{formatDiscount(coupon)}</TableCell>
                  <TableCell>{formatDate(coupon.startsAt)}</TableCell>
                  <TableCell>{formatDate(coupon.endsAt)}</TableCell>
                  <TableCell className="text-center">
                    <div className="inline-flex items-center gap-2">
                      <Switch
                        checked={coupon.isActive}
                        onCheckedChange={() => onToggleActive(coupon)}
                        aria-label={`Toggle ${coupon.code} active`}
                      />
                      <Badge variant={coupon.isActive ? "default" : "secondary"}>
                        {coupon.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="px-4 text-right">
                    <div className="inline-flex gap-1">
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="size-8"
                        onClick={() => onEdit(coupon)}
                        aria-label={`Edit ${coupon.code}`}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="size-8 text-destructive"
                        onClick={() => onDelete(coupon)}
                        aria-label={`Delete ${coupon.code}`}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="px-4 py-10 text-center text-sm text-muted-foreground"
                >
                  No coupons yet. Create the first coupon code above.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
