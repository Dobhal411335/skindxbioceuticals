"use client";

import type { ReactNode } from "react";
import { Eye, Pencil, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { stripHtmlToText } from "@/lib/tiptap/extensions";
import type {
  ProductEditDto,
  ProductEditorialReviewDto,
  ProductVideoDto,
} from "@/types/product-edit";

function StatusBadge({ active }: { active: boolean }) {
  return (
    <Badge variant={active ? "default" : "outline"}>
      {active ? "Active" : "Inactive"}
    </Badge>
  );
}

function EmptyRow({ colSpan, label }: { colSpan: number; label: string }) {
  return (
    <TableRow>
      <TableCell
        colSpan={colSpan}
        className="py-6 text-center text-muted-foreground"
      >
        {label}
      </TableCell>
    </TableRow>
  );
}

function SectionTableShell({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2 rounded-lg border border-border bg-muted/20 p-3">
      <p className="text-sm font-medium text-foreground">{title}</p>
      <div className="overflow-hidden rounded-md border border-border bg-card">
        {children}
      </div>
    </div>
  );
}

function truncate(value: string, max = 80): string {
  const trimmed = value.trim();
  if (trimmed.length <= max) return trimmed || "—";
  return `${trimmed.slice(0, max)}…`;
}

function truncateHtml(value: string, max = 80): string {
  return truncate(stripHtmlToText(value), max);
}

export function ColorsCurrentTable({
  data,
  onEdit,
  onDelete,
}: {
  data: ProductEditDto;
  onEdit?: (colorId: string) => void;
  onDelete?: (colorId: string) => void;
}) {
  const rows = [...data.colors].sort((a, b) => a.sortOrder - b.sortOrder);
  const showActions = Boolean(onEdit || onDelete);
  return (
    <SectionTableShell title="Current product colors">
      <Table className="min-w-[680px]">
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">#</TableHead>
            <TableHead>Color</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Hex</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Sort</TableHead>
            {showActions ? <TableHead className="w-[110px]">Actions</TableHead> : null}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <EmptyRow colSpan={showActions ? 7 : 6} label="No colors saved for this product yet." />
          ) : (
            rows.map((row, index) => (
              <TableRow key={row.id}>
                <TableCell className="text-muted-foreground">{index + 1}</TableCell>
                <TableCell>
                  {row.hex ? (
                    <span
                      className="inline-block h-6 w-6 rounded-full border border-border"
                      style={{ backgroundColor: row.hex }}
                      title={row.hex}
                    />
                  ) : (
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-dashed border-border text-[10px] text-muted-foreground">
                      —
                    </span>
                  )}
                </TableCell>
                <TableCell className="font-medium">{row.name}</TableCell>
                <TableCell>
                  {row.hex ? (
                    <span className="font-mono text-xs">{row.hex}</span>
                  ) : (
                    "—"
                  )}
                </TableCell>
                <TableCell>
                  <StatusBadge active={row.active} />
                </TableCell>
                <TableCell>{row.sortOrder}</TableCell>
                {showActions ? (
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {onEdit ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          aria-label={`Edit ${row.name}`}
                          onClick={() => onEdit(row.id)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      ) : null}
                      {onDelete ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          aria-label={`Delete ${row.name}`}
                          onClick={() => onDelete(row.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      ) : null}
                    </div>
                  </TableCell>
                ) : null}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </SectionTableShell>
  );
}

export function VariantsCurrentTable({
  data,
  onEdit,
  onDelete,
  deletingId,
  editingId,
}: {
  data: ProductEditDto;
  onEdit?: (variantId: string) => void;
  onDelete?: (variantId: string) => void;
  deletingId?: string | null;
  editingId?: string | null;
}) {
  const showActions = Boolean(onEdit || onDelete);
  const colSpan = showActions ? 11 : 10;

  return (
    <SectionTableShell title="Current price / quantity offers">
      <Table className="min-w-[960px]">
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">#</TableHead>
            <TableHead>Size</TableHead>
            <TableHead>Color</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Vendor</TableHead>
            <TableHead>Qty</TableHead>
            <TableHead>Weight (g)</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Image</TableHead>
            {showActions ? <TableHead className="w-[120px]">Actions</TableHead> : null}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.variants.length === 0 ? (
            <EmptyRow
              colSpan={colSpan}
              label="No price / quantity rows saved for this product yet."
            />
          ) : (
            data.variants.map((row, index) => (
              <TableRow
                key={row.id}
                className={editingId === row.id ? "bg-muted/40" : undefined}
              >
                <TableCell className="text-muted-foreground">{index + 1}</TableCell>
                <TableCell>{row.sizeLabel || "—"}</TableCell>
                <TableCell>{row.colorLabel || "—"}</TableCell>
                <TableCell>₹{row.price}</TableCell>
                <TableCell>
                  {row.vendorPrice != null ? `₹${row.vendorPrice}` : "—"}
                </TableCell>
                <TableCell>{row.quantity}</TableCell>
                <TableCell>{row.weightGrams ?? "—"}</TableCell>
                <TableCell>
                  <StatusBadge active={row.isActive} />
                </TableCell>
                <TableCell>
                  {row.profileImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={row.profileImage.url}
                      alt=""
                      className="h-10 w-10 rounded object-cover"
                    />
                  ) : (
                    "—"
                  )}
                </TableCell>
                {showActions ? (
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {onEdit ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          aria-label={
                            row.sku
                              ? `Edit offer ${row.sku}`
                              : `Edit offer ${index + 1}`
                          }
                          onClick={() => onEdit(row.id)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      ) : null}
                      {onDelete ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          aria-label={
                            row.sku
                              ? `Delete offer ${row.sku}`
                              : `Delete offer ${index + 1}`
                          }
                          disabled={deletingId === row.id}
                          onClick={() => onDelete(row.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      ) : null}
                    </div>
                  </TableCell>
                ) : null}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </SectionTableShell>
  );
}

function formatCouponValue(type: string, value: number): string {
  if (type === "PERCENTAGE") return `${value}%`;
  if (type === "FIXED_AMOUNT") return `₹${value}`;
  return String(value);
}

export function CouponCurrentTable({ data }: { data: ProductEditDto }) {
  return (
    <SectionTableShell title="Assigned coupon">
      <Table className="min-w-[480px]">
        <TableHeader>
          <TableRow>
            <TableHead>Code</TableHead>
            <TableHead>Discount</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {!data.coupon ? (
            <EmptyRow colSpan={4} label="No coupon assigned to this product." />
          ) : (
            <TableRow>
              <TableCell className="font-medium">{data.coupon.code}</TableCell>
              <TableCell>
                {formatCouponValue(data.coupon.type, data.coupon.value)}
              </TableCell>
              <TableCell>
                {data.coupon.type === "PERCENTAGE"
                  ? "Percent"
                  : data.coupon.type === "FIXED_AMOUNT"
                    ? "Amount"
                    : data.coupon.type}
              </TableCell>
              <TableCell>
                <Badge variant="default">Assigned</Badge>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </SectionTableShell>
  );
}

export function VideosCurrentTable({
  data,
  onEdit,
  onDelete,
  deletingId,
  editingId,
}: {
  data: ProductEditDto;
  onEdit?: (video: ProductVideoDto) => void;
  onDelete?: (videoId: string) => void;
  deletingId?: string | null;
  editingId?: string | null;
}) {
  const rows = [...data.videos].sort((a, b) => a.sortOrder - b.sortOrder);
  const showActions = Boolean(onEdit || onDelete);
  return (
    <SectionTableShell title="Current videos">
      <Table className="min-w-[720px]">
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">#</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>URL</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Sort</TableHead>
            {showActions ? (
              <TableHead className="text-right">Actions</TableHead>
            ) : null}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <EmptyRow
              colSpan={showActions ? 6 : 5}
              label="No videos saved for this product yet."
            />
          ) : (
            rows.map((row, index) => (
              <TableRow
                key={row.id}
                className={editingId === row.id ? "bg-muted/40" : undefined}
              >
                <TableCell className="text-muted-foreground">{index + 1}</TableCell>
                <TableCell className="font-medium">{row.name}</TableCell>
                <TableCell className="max-w-[240px]">
                  <a
                    href={row.url}
                    target="_blank"
                    rel="noreferrer"
                    className="block truncate text-primary underline-offset-2 hover:underline"
                  >
                    {row.url}
                  </a>
                </TableCell>
                <TableCell className="max-w-[240px] whitespace-normal">
                  {truncateHtml(row.description)}
                </TableCell>
                <TableCell>{row.sortOrder}</TableCell>
                {showActions ? (
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {onEdit ? (
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          onClick={() => onEdit(row)}
                          aria-label={`Edit video ${row.name}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      ) : null}
                      {onDelete ? (
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          disabled={deletingId === row.id}
                          onClick={() => onDelete(row.id)}
                          aria-label={`Delete video ${row.name}`}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      ) : null}
                    </div>
                  </TableCell>
                ) : null}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </SectionTableShell>
  );
}

export function ReviewsCurrentTable({
  data,
  onEdit,
  onDelete,
  onView,
  editingId,
}: {
  data: ProductEditDto;
  onEdit: (review: ProductEditorialReviewDto) => void;
  onDelete: (reviewId: string) => void;
  onView: (review: ProductEditorialReviewDto) => void;
  editingId?: string | null;
}) {
  const rows = [...data.editorialReviews].sort(
    (a, b) => a.sortOrder - b.sortOrder,
  );
  return (
    <SectionTableShell title="Current editorial reviews">
      <Table className="min-w-[780px]">
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">#</TableHead>
            <TableHead>Created by</TableHead>
            <TableHead>Rating</TableHead>
            <TableHead>Title</TableHead>
            <TableHead>Body</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <EmptyRow colSpan={7} label="No editorial reviews yet." />
          ) : (
            rows.map((row, index) => (
              <TableRow
                key={row.id}
                className={editingId === row.id ? "bg-muted/40" : undefined}
              >
                <TableCell className="text-muted-foreground">{index + 1}</TableCell>
                <TableCell className="font-medium">{row.createdByName}</TableCell>
                <TableCell>{row.rating}/5</TableCell>
                <TableCell>{row.title || "—"}</TableCell>
                <TableCell className="max-w-[260px] whitespace-normal">
                  {truncateHtml(row.body)}
                </TableCell>
                <TableCell>
                  <StatusBadge active={row.active} />
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={() => onView(row)}
                      aria-label={`View review by ${row.createdByName}`}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={() => onEdit(row)}
                      aria-label={`Edit review by ${row.createdByName}`}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={() => onDelete(row.id)}
                      aria-label={`Delete review by ${row.createdByName}`}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </SectionTableShell>
  );
}

export function TagsCurrentTable({
  data,
  onEdit,
  onDelete,
  deletingId,
  editingId,
}: {
  data: ProductEditDto;
  onEdit: (tag: { id: string; name: string }) => void;
  onDelete: (tagId: string) => void;
  deletingId?: string | null;
  editingId?: string | null;
}) {
  return (
    <SectionTableShell title="Current tags">
      <Table className="min-w-[420px]">
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">#</TableHead>
            <TableHead>Tag</TableHead>
            <TableHead className="w-[120px] text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.tags.length === 0 ? (
            <EmptyRow colSpan={3} label="No tags saved for this product yet." />
          ) : (
            data.tags.map((row, index) => (
              <TableRow
                key={row.id}
                className={editingId === row.id ? "bg-muted/40" : undefined}
              >
                <TableCell className="text-muted-foreground">{index + 1}</TableCell>
                <TableCell className="font-medium">{row.name}</TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={() => onEdit(row)}
                      aria-label={`Edit tag ${row.name}`}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      disabled={deletingId === row.id}
                      onClick={() => onDelete(row.id)}
                      aria-label={`Delete tag ${row.name}`}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </SectionTableShell>
  );
}
