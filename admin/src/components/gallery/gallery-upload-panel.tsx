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
import type { GalleryMediaType, GalleryPendingUpload } from "@/types/gallery";

type GalleryUploadPanelProps = {
  siteCode: SiteCode;
  onQueuePending: (pending: GalleryPendingUpload[]) => void;
  onPendingComplete: (id: string) => void;
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

function createPendingId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `pending-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function GalleryUploadPanel({
  siteCode,
  onQueuePending,
  onPendingComplete,
  onUploaded,
}: GalleryUploadPanelProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    const queued: Array<{
      pending: GalleryPendingUpload;
      file: File;
      mediaType: GalleryMediaType;
    }> = [];
    let unsupported = 0;

    for (const file of files) {
      const mediaType = detectMediaType(file);
      if (!mediaType) {
        unsupported += 1;
        continue;
      }
      queued.push({
        file,
        mediaType,
        pending: {
          id: createPendingId(),
          fileName: file.name,
          mediaType,
          previewUrl: URL.createObjectURL(file),
        },
      });
    }

    if (queued.length === 0) {
      showError(
        unsupported > 0
          ? "No supported files selected"
          : "No files selected",
      );
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    onQueuePending(queued.map((entry) => entry.pending));
    setUploading(true);
    let created = 0;
    let failed = unsupported;

    try {
      for (const entry of queued) {
        try {
          const uploaded =
            entry.mediaType === "video"
              ? await uploadGalleryVideo(siteCode, entry.file)
              : await uploadGalleryImage(siteCode, entry.file);

          await createGalleryItem(siteCode, {
            mediaType: entry.mediaType,
            mediaUrl: uploaded.url,
            mediaPublicId: uploaded.publicId,
            active: true,
          });
          created += 1;
        } catch {
          failed += 1;
        } finally {
          onPendingComplete(entry.pending.id);
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
      for (const entry of queued) {
        onPendingComplete(entry.pending.id);
      }
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
          Add multiple images and short videos at once. Previews appear in Gallery
          Items while each file uploads.
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
