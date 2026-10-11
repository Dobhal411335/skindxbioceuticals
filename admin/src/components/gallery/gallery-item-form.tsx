"use client";

import { useRef, useState } from "react";
import { LayoutTemplate, Loader2, UploadCloud, Video } from "lucide-react";

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
import { showError, showSuccess } from "@/lib/toast";
import type { GalleryItemFormErrors } from "@/schemas/gallery-schema";
import {
  uploadGalleryImage,
  uploadGalleryVideo,
} from "@/services/api/gallery";
import { ApiError } from "@/services/api/errors";
import type { SiteCode } from "@/types/auth";
import type { GalleryItemFormValues, GalleryMediaType } from "@/types/gallery";

type GalleryItemFormProps = {
  siteCode: SiteCode;
  values: GalleryItemFormValues;
  errors: GalleryItemFormErrors;
  isSubmitting: boolean;
  isEditing: boolean;
  editingId: string | null;
  onChange: (values: GalleryItemFormValues) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onReset: () => void;
};

function detectMediaType(file: File): GalleryMediaType | null {
  if (file.type.startsWith("image/")) return "image";
  if (file.type.startsWith("video/")) return "video";
  const name = file.name.toLowerCase();
  if (/\.(jpe?g|png|webp)$/.test(name)) return "image";
  if (/\.(mp4|webm|mov)$/.test(name)) return "video";
  return null;
}

export function GalleryItemForm({
  siteCode,
  values,
  errors,
  isSubmitting,
  isEditing,
  editingId,
  onChange,
  onSubmit,
  onReset,
}: GalleryItemFormProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const mediaType = detectMediaType(file);
    if (!mediaType) {
      showError("Unsupported file type");
      event.target.value = "";
      return;
    }

    setUploading(true);
    try {
      const uploaded =
        mediaType === "video"
          ? await uploadGalleryVideo(siteCode, file, editingId)
          : await uploadGalleryImage(siteCode, file, editingId);
      onChange({
        ...values,
        mediaType,
        mediaUrl: uploaded.url,
        mediaPublicId: uploaded.publicId,
      });
      showSuccess(mediaType === "video" ? "Video uploaded" : "Image uploaded");
    } catch (error) {
      showError(
        error instanceof ApiError ? error.message : "Media upload failed",
      );
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  return (
    <Card className="overflow-hidden border-border bg-card shadow-sm">
      <CardHeader className="border-b border-border/70 pb-5">
        <div className="flex items-center gap-2">
          <LayoutTemplate className="h-5 w-5 text-muted-foreground" />
          <CardTitle className="text-lg font-semibold">
            {isEditing ? "Edit Gallery Item" : "Edit Selected Item"}
          </CardTitle>
        </div>
        <CardDescription>
          Update title, caption, order, or replace the media file for an existing
          item. Use the upload panel above to add many files at once.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <form onSubmit={onSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="space-y-3">
              <Label className="text-sm font-semibold">
                Media preview <span className="text-destructive">*</span>
              </Label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime,.jpg,.jpeg,.png,.webp,.mp4,.webm,.mov"
                className="hidden"
                onChange={(event) => void handleUpload(event)}
              />
              <div className="relative aspect-video overflow-hidden rounded-xl border border-border bg-muted/40">
                {values.mediaUrl ? (
                  values.mediaType === "video" ? (
                    <video
                      src={values.mediaUrl}
                      className="h-full w-full object-cover"
                      muted
                      playsInline
                      controls
                    />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element -- remote Cloudinary previews
                    <img
                      src={values.mediaUrl}
                      alt={values.title || "Gallery preview"}
                      className="h-full w-full object-cover"
                    />
                  )
                ) : (
                  <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
                    <Video className="size-8 opacity-40" />
                    <p className="text-sm">No media selected</p>
                  </div>
                )}
              </div>
              {errors.mediaUrl ? (
                <p className="text-sm text-destructive">{errors.mediaUrl}</p>
              ) : null}
              <Button
                type="button"
                variant="outline"
                disabled={uploading || !isEditing}
                onClick={() => fileInputRef.current?.click()}
              >
                {uploading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <UploadCloud className="size-4" />
                )}
                Replace media
              </Button>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="gallery-title">Title</Label>
                <Input
                  id="gallery-title"
                  value={values.title}
                  disabled={!isEditing}
                  onChange={(event) =>
                    onChange({ ...values, title: event.target.value })
                  }
                  placeholder="Optional headline"
                />
                {errors.title ? (
                  <p className="text-sm text-destructive">{errors.title}</p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="gallery-caption">Caption</Label>
                <Input
                  id="gallery-caption"
                  value={values.caption}
                  disabled={!isEditing}
                  onChange={(event) =>
                    onChange({ ...values, caption: event.target.value })
                  }
                  placeholder="Optional alt / caption"
                />
                {errors.caption ? (
                  <p className="text-sm text-destructive">{errors.caption}</p>
                ) : null}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="gallery-order">Order</Label>
                  <Input
                    id="gallery-order"
                    type="number"
                    min={0}
                    value={values.order}
                    disabled={!isEditing}
                    onChange={(event) =>
                      onChange({ ...values, order: event.target.value })
                    }
                  />
                  {errors.order ? (
                    <p className="text-sm text-destructive">{errors.order}</p>
                  ) : null}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gallery-active">Active</Label>
                  <select
                    id="gallery-active"
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:opacity-50"
                    value={values.active ? "true" : "false"}
                    disabled={!isEditing}
                    onChange={(event) =>
                      onChange({
                        ...values,
                        active: event.target.value === "true",
                      })
                    }
                  >
                    <option value="true">Visible</option>
                    <option value="false">Hidden</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                <Button type="submit" disabled={!isEditing || isSubmitting || uploading}>
                  {isSubmitting ? "Saving…" : "Save changes"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={!isEditing || isSubmitting}
                  onClick={onReset}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
