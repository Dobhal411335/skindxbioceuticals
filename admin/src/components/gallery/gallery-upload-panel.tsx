"use client";

import { useRef, useState } from "react";
import { ImagePlus, Loader2, Upload, Video } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { showError, showSuccess } from "@/lib/toast";
import {
  createGalleryItem,
  uploadGalleryImage,
  uploadGalleryVideo,
} from "@/services/api/gallery";
import { ApiError } from "@/services/api/errors";
import type { SiteCode } from "@/types/auth";
import type { GalleryMediaType } from "@/types/gallery";

type GalleryUploadPanelProps = {
  siteCode: SiteCode;
  nextOrder: number;
  onUploaded: () => Promise<void>;
};

function detectMediaType(file: File): GalleryMediaType | null {
  if (file.type.startsWith("image/")) return "image";
  if (file.type.startsWith("video/")) return "video";
  const name = file.name.toLowerCase();
  if (/\.(jpe?g|png|webp)$/.test(name)) return "image";
  if (/\.(mp4|webm|mov)$/.test(name)) return "video";
  return null;
}

export function GalleryUploadPanel({
  siteCode,
  nextOrder,
  onUploaded,
}: GalleryUploadPanelProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    setUploading(true);
    let created = 0;
    let failed = 0;

    try {
      for (const [index, file] of files.entries()) {
        const mediaType = detectMediaType(file);
        if (!mediaType) {
          failed += 1;
          continue;
        }

        try {
          const uploaded =
            mediaType === "video"
              ? await uploadGalleryVideo(siteCode, file)
              : await uploadGalleryImage(siteCode, file);

          await createGalleryItem(siteCode, {
            mediaType,
            mediaUrl: uploaded.url,
            mediaPublicId: uploaded.publicId,
            title: "",
            caption: "",
            active: true,
            order: nextOrder + index,
          });
          created += 1;
        } catch {
          failed += 1;
        }
      }

      if (created > 0) {
        showSuccess(
          created === 1
            ? "Gallery item uploaded"
            : `${created} gallery items uploaded`,
        );
        await onUploaded();
      }
      if (failed > 0) {
        showError(
          failed === 1
            ? "One file failed to upload"
            : `${failed} files failed to upload`,
        );
      }
    } catch (error) {
      showError(
        error instanceof ApiError ? error.message : "Gallery upload failed",
      );
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <Card className="overflow-hidden border-border bg-card shadow-sm">
      <CardHeader className="border-b border-border/70 pb-5">
        <div className="flex items-center gap-2">
          <ImagePlus className="h-5 w-5 text-muted-foreground" />
          <CardTitle className="text-lg font-semibold">Upload Gallery Media</CardTitle>
        </div>
        <CardDescription>
          Add multiple images and short videos at once. Videos appear muted on the
          storefront lookbook.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 pt-6">
        <div className="space-y-2">
          <Label>Images &amp; videos</Label>
          <p className="text-sm text-muted-foreground">
            Images: JPG, PNG, WebP. Videos: MP4, WebM, MOV.
          </p>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime,.jpg,.jpeg,.png,.webp,.mp4,.webm,.mov"
          multiple
          className="hidden"
          onChange={(event) => void handleUpload(event)}
        />

        <div className="flex flex-wrap gap-3">
          <Button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Upload className="size-4" />
            )}
            {uploading ? "Uploading…" : "Upload media"}
          </Button>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <ImagePlus className="size-3.5" /> Images
            </span>
            <span className="inline-flex items-center gap-1">
              <Video className="size-3.5" /> Videos
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
