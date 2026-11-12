"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ExternalLink,
  Loader2,
  Newspaper,
  Plus,
  Trash2,
  UploadCloud,
} from "lucide-react";

import { RichTextEditor } from "@/components/editor/rich-text-editor";
import { AdminAppShell } from "@/components/layout/admin-app-shell";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { storefrontBaseUrl } from "@/config/env";
import {
  BLOG_GALLERY_MAX_IMAGES,
  normalizeAccordionItems,
  normalizeGalleryImages,
  normalizeVideoItems,
  toDateInputValue,
  validateBlogEditForm,
  type BlogEditFormErrors,
} from "@/schemas/blog-schema";
import { fetchBlog, updateBlog, uploadBlogImage } from "@/services/api/blog";
import { ApiError } from "@/services/api/errors";
import { showError, showSuccess } from "@/lib/toast";
import type { SiteCode } from "@/types/auth";
import type {
  BlogDto,
  BlogEditFormValues,
  BlogGalleryPendingUpload,
} from "@/types/blog";

function createPendingId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `pending-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function createEmptyEditValues(): BlogEditFormValues {
  return {
    badgeText: "",
    stat1Number: "",
    stat1Name: "",
    stat1Text: "",
    stat2Number: "",
    stat2Name: "",
    stat2Text: "",
    title: "",
    publishedAt: "",
    createdBy: "",
    imageUrl: "",
    imagePublicId: "",
    description: "",
    blockquote: "",
    accordionItems: [{ question: "", description: "" }],
    galleryImages: [],
    videos: [{ name: "", url: "" }],
    extraDescription: "",
    active: true,
  };
}

function dtoToEditValues(blog: BlogDto): BlogEditFormValues {
  return {
    badgeText: blog.badgeText,
    stat1Number: blog.stat1Number,
    stat1Name: blog.stat1Name,
    stat1Text: blog.stat1Text,
    stat2Number: blog.stat2Number,
    stat2Name: blog.stat2Name,
    stat2Text: blog.stat2Text,
    title: blog.title || blog.name,
    publishedAt: toDateInputValue(blog.publishedAt),
    createdBy: blog.createdBy,
    imageUrl: blog.imageUrl,
    imagePublicId: blog.imagePublicId,
    description: blog.description,
    blockquote: blog.blockquote,
    accordionItems: normalizeAccordionItems(blog.accordionItems),
    galleryImages: normalizeGalleryImages(blog.galleryImages),
    videos: normalizeVideoItems(blog.videos),
    extraDescription: blog.extraDescription || "",
    active: blog.active,
  };
}

function publicBlogUrl(siteCode: SiteCode, slug: string): string {
  return `${storefrontBaseUrl(siteCode)}/blog/${encodeURIComponent(slug)}`;
}

export function EditBlogPage({
  siteCode,
  blogId,
}: {
  siteCode: SiteCode;
  blogId: string;
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);
  const [blog, setBlog] = useState<BlogDto | null>(null);
  const [values, setValues] = useState<BlogEditFormValues>(createEmptyEditValues);
  const [errors, setErrors] = useState<BlogEditFormErrors>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [galleryPending, setGalleryPending] = useState<BlogGalleryPendingUpload[]>(
    [],
  );
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const data = await fetchBlog(siteCode, blogId);
      setBlog(data);
      setValues(dtoToEditValues(data));
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : "Failed to load blog";
      setLoadError(message);
      showError(message);
    } finally {
      setIsLoading(false);
    }
  }, [siteCode, blogId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial blog load
    void load();
  }, [load]);

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const uploaded = await uploadBlogImage(siteCode, file, blogId);
      setValues((prev) => ({
        ...prev,
        imageUrl: uploaded.url,
        imagePublicId: uploaded.publicId,
      }));
      showSuccess("Image uploaded successfully");
    } catch (error) {
      showError(
        error instanceof ApiError ? error.message : "Image upload failed",
      );
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  const handleInlineImageUpload = async (file: File): Promise<string> => {
    const uploaded = await uploadBlogImage(siteCode, file, blogId);
    return uploaded.url;
  };

  const handleGalleryUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    const remainingSlots =
      BLOG_GALLERY_MAX_IMAGES - values.galleryImages.length - galleryPending.length;
    if (remainingSlots <= 0) {
      showError(`You can upload up to ${BLOG_GALLERY_MAX_IMAGES} gallery images`);
      event.target.value = "";
      return;
    }

    const selected = files.slice(0, remainingSlots);
    if (files.length > remainingSlots) {
      showError(
        `Only ${remainingSlots} more image${remainingSlots === 1 ? "" : "s"} can be added`,
      );
    }

    const queued = selected.map((file) => ({
      file,
      pending: {
        id: createPendingId(),
        fileName: file.name,
        previewUrl: URL.createObjectURL(file),
      } satisfies BlogGalleryPendingUpload,
    }));

    setGalleryPending((prev) => [...prev, ...queued.map((entry) => entry.pending)]);

    let uploadedCount = 0;
    let failedCount = 0;

    for (const entry of queued) {
      try {
        const uploaded = await uploadBlogImage(siteCode, entry.file, blogId);
        setValues((prev) => {
          if (prev.galleryImages.length >= BLOG_GALLERY_MAX_IMAGES) {
            return prev;
          }
          return {
            ...prev,
            galleryImages: [
              ...prev.galleryImages,
              { url: uploaded.url, publicId: uploaded.publicId },
            ],
          };
        });
        uploadedCount += 1;
      } catch {
        failedCount += 1;
      } finally {
        URL.revokeObjectURL(entry.pending.previewUrl);
        setGalleryPending((prev) =>
          prev.filter((item) => item.id !== entry.pending.id),
        );
      }
    }

    if (uploadedCount > 0) {
      showSuccess(
        uploadedCount === 1
          ? "Gallery image uploaded"
          : `${uploadedCount} gallery images uploaded`,
      );
    }
    if (failedCount > 0) {
      showError(
        failedCount === 1
          ? "One gallery image failed to upload"
          : `${failedCount} gallery images failed to upload`,
      );
    }

    event.target.value = "";
  };

  const removeGalleryImage = (index: number) => {
    setValues((prev) => ({
      ...prev,
      galleryImages: prev.galleryImages.filter((_, itemIndex) => itemIndex !== index),
    }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!blog) return;

    const validated = validateBlogEditForm(values, {
      name: blog.name,
      slug: blog.slug,
      category: blog.category,
    });
    if (!validated.ok) {
      setErrors(validated.errors);
      showError("Please fix the highlighted fields");
      return;
    }

    setIsSubmitting(true);
    setErrors({});
    try {
      const updated = await updateBlog(siteCode, blogId, validated.data);
      setBlog(updated);
      setValues(dtoToEditValues(updated));
      showSuccess("Blog saved");
    } catch (error) {
      showError(
        error instanceof ApiError ? error.message : "Failed to save blog",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const listHref = `/admin/${siteCode.toLowerCase()}/blog`;

  return (
    <AdminAppShell
      siteCode={siteCode}
      title="Edit Blog"
      description="Update publish details, cover image, and rich article content."
    >
      <div className="mx-auto max-w-4xl space-y-6">
        <Button asChild variant="outline" size="sm">
          <Link href={listHref}>
            <ArrowLeft className="mr-1.5 size-4" aria-hidden />
            Back to Manage Blog
          </Link>
        </Button>

        {loadError ? (
          <Alert variant="destructive">
            <AlertTitle>Could not load blog</AlertTitle>
            <AlertDescription>{loadError}</AlertDescription>
          </Alert>
        ) : null}

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading blog…</p>
        ) : blog ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            <Card className="border-border bg-card shadow-sm">
              <CardHeader className="border-b border-border/70">
                <div className="flex items-center gap-2">
                  <Newspaper className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg font-semibold">
                    Blog details
                  </CardTitle>
                </div>
                <CardDescription>
                  Category and blog name are set on create. Change the name from
                  the Manage Blog list.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5 pt-6">
                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Blog category</Label>
                    <Input value={blog.category} readOnly disabled />
                  </div>
                  <div className="space-y-2">
                    <Label>Blog name</Label>
                    <Input value={blog.name} readOnly disabled />
                  </div>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="blog-date">Date</Label>
                    <Input
                      id="blog-date"
                      type="date"
                      value={values.publishedAt}
                      onChange={(event) =>
                        setValues((prev) => ({
                          ...prev,
                          publishedAt: event.target.value,
                        }))
                      }
                      aria-invalid={Boolean(errors.publishedAt)}
                    />
                    {errors.publishedAt ? (
                      <p className="text-sm text-destructive">
                        {errors.publishedAt}
                      </p>
                    ) : null}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="blog-created-by">Created by</Label>
                    <Input
                      id="blog-created-by"
                      value={values.createdBy}
                      onChange={(event) =>
                        setValues((prev) => ({
                          ...prev,
                          createdBy: event.target.value,
                        }))
                      }
                      placeholder="e.g. SkinDx Editorial"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="blog-title">Title</Label>
                  <Input
                    id="blog-title"
                    value={values.title}
                    onChange={(event) =>
                      setValues((prev) => ({
                        ...prev,
                        title: event.target.value,
                      }))
                    }
                    aria-invalid={Boolean(errors.title)}
                  />
                  {errors.title ? (
                    <p className="text-sm text-destructive">{errors.title}</p>
                  ) : null}
                  <a
                    href={publicBlogUrl(siteCode, blog.slug)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                  >
                    View public page /blog/{blog.slug}
                    <ExternalLink className="size-3.5" aria-hidden />
                  </a>
                </div>

                <div className="space-y-4 rounded-lg border border-border/70 p-4">
                  <div className="space-y-2">
                    <Label htmlFor="blog-badge">Landing card badge (optional)</Label>
                    <Input
                      id="blog-badge"
                      value={values.badgeText}
                      onChange={(event) =>
                        setValues((prev) => ({ ...prev, badgeText: event.target.value }))
                      }
                      placeholder="e.g. Transformation · Technology"
                    />
                  </div>
                  <div className="grid gap-4 lg:grid-cols-2">
                    {([1, 2] as const).map((number) => (
                      <div key={number} className="space-y-3 rounded-md bg-muted/30 p-3">
                        <p className="text-sm font-medium">Stat card {number} (optional)</p>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <Input
                            value={values[`stat${number}Number`]}
                            onChange={(event) =>
                              setValues((prev) => ({
                                ...prev,
                                [`stat${number}Number`]: event.target.value,
                              }))
                            }
                            placeholder="Number, e.g. 32%"
                            aria-label={`Stat card ${number} number`}
                          />
                          <Input
                            value={values[`stat${number}Name`]}
                            onChange={(event) =>
                              setValues((prev) => ({
                                ...prev,
                                [`stat${number}Name`]: event.target.value,
                              }))
                            }
                            placeholder="Name, e.g. faster decisions"
                            aria-label={`Stat card ${number} name`}
                          />
                        </div>
                        <Input
                          value={values[`stat${number}Text`]}
                          onChange={(event) =>
                            setValues((prev) => ({
                              ...prev,
                              [`stat${number}Text`]: event.target.value,
                            }))
                          }
                          placeholder="Optional supporting text"
                          aria-label={`Stat card ${number} supporting text`}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
                  <div>
                    <Label htmlFor="blog-active">Active</Label>
                    <p className="text-xs text-muted-foreground">
                      Inactive posts are hidden from public list and detail pages.
                    </p>
                  </div>
                  <Switch
                    id="blog-active"
                    checked={values.active}
                    onCheckedChange={(checked) =>
                      setValues((prev) => ({ ...prev, active: checked }))
                    }
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="border-border bg-card shadow-sm">
              <CardHeader className="border-b border-border/70">
                <CardTitle className="text-lg font-semibold">Cover image</CardTitle>
                <CardDescription>
                  Upload via Cloudinary media APIs (`feature=blog`). Prefer HTTPS
                  URLs.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={(event) => void handleUpload(event)}
                />
                {!values.imageUrl ? (
                  <button
                    type="button"
                    disabled={uploading}
                    onClick={() => fileInputRef.current?.click()}
                    className="flex h-56 w-full flex-col items-center justify-center gap-3 rounded-[14px] border-2 border-dashed border-border bg-muted/30 transition-colors hover:bg-muted/50 disabled:cursor-not-allowed"
                  >
                    {uploading ? (
                      <>
                        <div className="size-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                        <p className="text-sm font-medium text-muted-foreground">
                          Uploading…
                        </p>
                      </>
                    ) : (
                      <>
                        <div className="flex size-12 items-center justify-center rounded-full bg-background shadow-sm">
                          <UploadCloud className="size-5 text-primary" />
                        </div>
                        <div className="px-4 text-center">
                          <p className="text-sm font-medium">Upload image</p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            JPG, PNG, or WebP
                          </p>
                        </div>
                      </>
                    )}
                  </button>
                ) : (
                  <div className="space-y-3">
                    <div className="relative mx-auto aspect-[16/9] w-full max-w-xl overflow-hidden rounded-[14px] border border-border bg-muted/40">
                      {/* eslint-disable-next-line @next/next/no-img-element -- remote Cloudinary previews */}
                      <img
                        src={values.imageUrl}
                        alt="Blog cover preview"
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                      >
                        {uploading ? "Uploading…" : "Replace"}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          setValues((prev) => ({
                            ...prev,
                            imageUrl: "",
                            imagePublicId: "",
                          }))
                        }
                        disabled={uploading}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-border bg-card shadow-sm">
              <CardHeader className="border-b border-border/70">
                <CardTitle className="text-lg font-semibold">
                  Description
                </CardTitle>
                <CardDescription>
                  Rich text shown on the public article page.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <RichTextEditor
                  value={values.description}
                  onChange={(html) =>
                    setValues((prev) => ({ ...prev, description: html }))
                  }
                  onUploadImage={handleInlineImageUpload}
                  placeholder="Write the article…"
                  minHeightClassName="min-h-[280px]"
                />
              </CardContent>
            </Card>

            <Card className="border-border bg-card shadow-sm">
              <CardHeader className="border-b border-border/70">
                <CardTitle className="text-lg font-semibold">Blockquote</CardTitle>
                <CardDescription>
                  Optional pull quote shown on the article page.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <Textarea
                  value={values.blockquote}
                  onChange={(event) =>
                    setValues((prev) => ({
                      ...prev,
                      blockquote: event.target.value,
                    }))
                  }
                  rows={4}
                  placeholder="Optional featured quote"
                />
              </CardContent>
            </Card>

            <Card className="border-border bg-card shadow-sm">
              <CardHeader className="border-b border-border/70">
                <CardTitle className="text-lg font-semibold">Accordion</CardTitle>
                <CardDescription>
                  Optional FAQ-style questions and descriptions shown after the
                  blockquote on the public article page.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 pt-6">
                {values.accordionItems.map((item, index) => (
                  <div
                    key={index}
                    className="grid items-start gap-3 rounded-xl border border-border/60 bg-muted/20 p-3 md:grid-cols-[1fr_2fr_auto]"
                  >
                    <div className="space-y-2">
                      <Label htmlFor={`blog-accordion-question-${index}`}>
                        Question
                      </Label>
                      <Input
                        id={`blog-accordion-question-${index}`}
                        value={item.question}
                        onChange={(event) =>
                          setValues((prev) => {
                            const next = [...prev.accordionItems];
                            next[index] = {
                              ...next[index],
                              question: event.target.value,
                            };
                            return { ...prev, accordionItems: next };
                          })
                        }
                        placeholder="e.g. How often should I use this?"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`blog-accordion-description-${index}`}>
                        Description
                      </Label>
                      <Textarea
                        id={`blog-accordion-description-${index}`}
                        value={item.description}
                        onChange={(event) =>
                          setValues((prev) => {
                            const next = [...prev.accordionItems];
                            next[index] = {
                              ...next[index],
                              description: event.target.value,
                            };
                            return { ...prev, accordionItems: next };
                          })
                        }
                        rows={3}
                        placeholder="Answer or supporting details"
                      />
                    </div>
                    <div className="flex gap-1.5 md:pt-7">
                      <Button
                        type="button"
                        size="icon"
                        onClick={() =>
                          setValues((prev) => ({
                            ...prev,
                            accordionItems: [
                              ...prev.accordionItems,
                              { question: "", description: "" },
                            ],
                          }))
                        }
                        aria-label="Add accordion item"
                      >
                        <Plus className="size-4" />
                      </Button>
                      {values.accordionItems.length > 1 ? (
                        <Button
                          type="button"
                          size="icon"
                          variant="outline"
                          className="border-rose-200 text-rose-600"
                          onClick={() =>
                            setValues((prev) => ({
                              ...prev,
                              accordionItems: prev.accordionItems.filter(
                                (_, itemIndex) => itemIndex !== index,
                              ),
                            }))
                          }
                          aria-label={`Remove accordion item ${index + 1}`}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      ) : null}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-border bg-card shadow-sm">
              <CardHeader className="border-b border-border/70">
                <CardTitle className="text-lg font-semibold">
                  Gallery images
                </CardTitle>
                <CardDescription>
                  Optional multi-image gallery for the article page (max{" "}
                  {BLOG_GALLERY_MAX_IMAGES}). Images upload to Cloudinary as you
                  select them.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                <input
                  ref={galleryInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="sr-only"
                  onChange={(event) => void handleGalleryUpload(event)}
                />
                <Button
                  type="button"
                  variant="outline"
                  disabled={
                    values.galleryImages.length + galleryPending.length >=
                    BLOG_GALLERY_MAX_IMAGES
                  }
                  onClick={() => galleryInputRef.current?.click()}
                >
                  <UploadCloud className="mr-1.5 size-4" aria-hidden />
                  Upload gallery images
                </Button>
                <p className="text-xs text-muted-foreground">
                  {values.galleryImages.length}/{BLOG_GALLERY_MAX_IMAGES} uploaded
                  {galleryPending.length > 0
                    ? ` · ${galleryPending.length} uploading`
                    : ""}
                </p>

                {values.galleryImages.length === 0 &&
                galleryPending.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No gallery images yet.
                  </p>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                    {values.galleryImages.map((image, index) => (
                      <div
                        key={`${image.publicId || image.url}-${index}`}
                        className="group relative overflow-hidden rounded-xl border border-border bg-muted/30"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element -- remote Cloudinary previews */}
                        <img
                          src={image.url}
                          alt={`Gallery image ${index + 1}`}
                          className="aspect-[4/3] h-full w-full object-cover"
                        />
                        <Button
                          type="button"
                          size="icon"
                          variant="outline"
                          className="absolute top-2 right-2 size-8 border-rose-200 bg-background/90 text-rose-600 opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                          onClick={() => removeGalleryImage(index)}
                          aria-label={`Remove gallery image ${index + 1}`}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    ))}
                    {galleryPending.map((pending) => (
                      <div
                        key={pending.id}
                        className="relative overflow-hidden rounded-xl border border-border bg-muted/30"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element -- local object URL preview */}
                        <img
                          src={pending.previewUrl}
                          alt={`Uploading ${pending.fileName}`}
                          className="aspect-[4/3] h-full w-full object-cover opacity-60"
                        />
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-background/55">
                          <Loader2 className="size-6 animate-spin text-primary" />
                          <p className="px-2 text-center text-xs font-medium text-muted-foreground">
                            Uploading…
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-border bg-card shadow-sm">
              <CardHeader className="border-b border-border/70">
                <CardTitle className="text-lg font-semibold">Videos</CardTitle>
                <CardDescription>
                  Optional YouTube watch URLs or direct `.mp4` links, each with a
                  display name.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 pt-6">
                {values.videos.map((item, index) => (
                  <div
                    key={index}
                    className="grid items-start gap-3 rounded-xl border border-border/60 bg-muted/20 p-3 md:grid-cols-[1fr_1.4fr_auto]"
                  >
                    <div className="space-y-2">
                      <Label htmlFor={`blog-video-name-${index}`}>
                        Video name
                      </Label>
                      <Input
                        id={`blog-video-name-${index}`}
                        value={item.name}
                        onChange={(event) =>
                          setValues((prev) => {
                            const next = [...prev.videos];
                            next[index] = {
                              ...next[index],
                              name: event.target.value,
                            };
                            return { ...prev, videos: next };
                          })
                        }
                        placeholder="e.g. Formulation walkthrough"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`blog-video-url-${index}`}>
                        YouTube or video URL
                      </Label>
                      <Input
                        id={`blog-video-url-${index}`}
                        value={item.url}
                        onChange={(event) =>
                          setValues((prev) => {
                            const next = [...prev.videos];
                            next[index] = {
                              ...next[index],
                              url: event.target.value,
                            };
                            return { ...prev, videos: next };
                          })
                        }
                        placeholder="https://www.youtube.com/watch?v=… or .mp4 URL"
                      />
                    </div>
                    <div className="flex gap-1.5 md:pt-7">
                      <Button
                        type="button"
                        size="icon"
                        onClick={() =>
                          setValues((prev) => ({
                            ...prev,
                            videos: [...prev.videos, { name: "", url: "" }],
                          }))
                        }
                        aria-label="Add video"
                      >
                        <Plus className="size-4" />
                      </Button>
                      {values.videos.length > 1 ? (
                        <Button
                          type="button"
                          size="icon"
                          variant="outline"
                          className="border-rose-200 text-rose-600"
                          onClick={() =>
                            setValues((prev) => ({
                              ...prev,
                              videos: prev.videos.filter(
                                (_, itemIndex) => itemIndex !== index,
                              ),
                            }))
                          }
                          aria-label={`Remove video ${index + 1}`}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      ) : null}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-border bg-card shadow-sm">
              <CardHeader className="border-b border-border/70">
                <CardTitle className="text-lg font-semibold">
                  Extra description
                </CardTitle>
                <CardDescription>
                  Optional second rich-text block shown after gallery and videos
                  on the public article page.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <RichTextEditor
                  value={values.extraDescription}
                  onChange={(html) =>
                    setValues((prev) => ({ ...prev, extraDescription: html }))
                  }
                  onUploadImage={handleInlineImageUpload}
                  placeholder="Write additional article content…"
                  minHeightClassName="min-h-[220px]"
                />
              </CardContent>
            </Card>

            <div className="flex flex-wrap gap-3">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving…" : "Save blog"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push(listHref)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            </div>
          </form>
        ) : null}
      </div>
    </AdminAppShell>
  );
}
