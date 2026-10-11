"use client";

import {
  ArrowDown,
  ArrowUp,
  ImageIcon,
  Pencil,
  Trash2,
  Video,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { GalleryItemDto } from "@/types/gallery";

type GalleryItemsGridProps = {
  items: GalleryItemDto[];
  pendingDeleteId: string | null;
  isDeleting: boolean;
  onEdit: (item: GalleryItemDto) => void;
  onRequestDelete: (item: GalleryItemDto) => void;
  onCancelDelete: () => void;
  onConfirmDelete: (item: GalleryItemDto) => void;
  onToggleActive: (item: GalleryItemDto) => void;
  onMove: (item: GalleryItemDto, direction: "up" | "down") => void;
};

export function GalleryItemsGrid({
  items,
  pendingDeleteId,
  isDeleting,
  onEdit,
  onRequestDelete,
  onCancelDelete,
  onConfirmDelete,
  onToggleActive,
  onMove,
}: GalleryItemsGridProps) {
  const sorted = [...items].sort(
    (left, right) => (left.order || 0) - (right.order || 0),
  );

  return (
    <Card className="overflow-hidden border-border bg-card shadow-sm">
      <CardHeader className="border-b border-border/70 pb-5">
        <div className="flex items-center gap-2">
          <ImageIcon className="h-5 w-5 text-muted-foreground" />
          <CardTitle className="text-lg font-semibold">Gallery Items</CardTitle>
        </div>
        <CardDescription>
          Reorder, edit captions, toggle visibility, or remove media from the
          lookbook.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        {sorted.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No gallery media uploaded yet.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {sorted.map((item, index) => (
              <div
                key={item.id}
                className="group relative overflow-hidden rounded-xl border border-border bg-muted/20"
              >
                <div className="relative aspect-video overflow-hidden bg-muted/40">
                  {item.mediaType === "video" ? (
                    <video
                      src={item.mediaUrl}
                      className="h-full w-full object-cover"
                      muted
                      playsInline
                      preload="metadata"
                    />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element -- remote Cloudinary thumbnails
                    <img
                      src={item.mediaUrl}
                      alt={item.title || item.caption || `Gallery item ${index + 1}`}
                      className="h-full w-full object-cover"
                    />
                  )}
                  <div className="absolute left-2 top-2 flex gap-1">
                    <Badge variant="secondary" className="bg-background/90">
                      {item.mediaType === "video" ? (
                        <span className="inline-flex items-center gap-1">
                          <Video className="size-3" /> Video
                        </span>
                      ) : (
                        "Image"
                      )}
                    </Badge>
                    <Badge
                      variant="secondary"
                      className={
                        item.active
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-muted text-muted-foreground"
                      }
                    >
                      {item.active ? "Active" : "Hidden"}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-3 p-3">
                  <div>
                    <p className="truncate text-sm font-medium">
                      {item.title || `Item #${index + 1}`}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {item.caption || "No caption"} · Order {item.order}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      aria-label="Move up"
                      onClick={() => onMove(item, "up")}
                      disabled={index === 0}
                    >
                      <ArrowUp className="size-4" />
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      aria-label="Move down"
                      onClick={() => onMove(item, "down")}
                      disabled={index === sorted.length - 1}
                    >
                      <ArrowDown className="size-4" />
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => onToggleActive(item)}
                    >
                      {item.active ? "Hide" : "Show"}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => onEdit(item)}
                    >
                      <Pencil className="size-3.5" />
                      Edit
                    </Button>
                    {pendingDeleteId === item.id ? (
                      <div className="flex w-full flex-col gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-2 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-xs text-muted-foreground">
                          Remove this item permanently?
                        </p>
                        <div className="flex gap-1">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={isDeleting}
                            onClick={onCancelDelete}
                          >
                            Cancel
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="destructive"
                            disabled={isDeleting}
                            onClick={() => onConfirmDelete(item)}
                          >
                            {isDeleting ? "Deleting…" : "Confirm delete"}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        onClick={() => onRequestDelete(item)}
                      >
                        <Trash2 className="size-3.5" />
                        Delete
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
