"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import {
  Boxes,
  ChevronRight,
  ImagePlus,
  Pencil,
  Plus,
  Trash2,
  Upload,
} from "lucide-react";

import { AdminAppShell } from "@/components/layout/admin-app-shell";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  validateSubcategoryForm,
  type SubcategoryFormErrors,
} from "@/schemas/catalog-schema";
import {
  createSubcategory,
  deleteSubcategory,
  fetchCategories,
  fetchSubcategories,
  updateSubcategory,
  uploadCategoryBanner,
} from "@/services/api/catalog";
import { ApiError } from "@/services/api/errors";
import { showError, showSuccess } from "@/lib/toast";
import type { SiteCode } from "@/types/auth";
import type { CategoryDto, SubcategoryFormValues } from "@/types/catalog";

function createEmptyValues(): SubcategoryFormValues {
  return {
    name: "",
    bannerUrl: "",
    bannerPublicId: "",
    active: true,
  };
}

function toFormValues(subcategory: CategoryDto): SubcategoryFormValues {
  return {
    name: subcategory.name,
    bannerUrl: subcategory.bannerUrl ?? "",
    bannerPublicId: subcategory.bannerPublicId ?? "",
    active: subcategory.active,
  };
}

export function ManageCategoryPage({ siteCode }: { siteCode: SiteCode }) {
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [subcategories, setSubcategories] = useState<CategoryDto[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [values, setValues] = useState<SubcategoryFormValues>(createEmptyValues);
  const [errors, setErrors] = useState<SubcategoryFormErrors>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<CategoryDto | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingSubs, setIsLoadingSubs] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const loadCategories = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const data = await fetchCategories(siteCode);
      setCategories(data);
      setSelectedCategoryId((current) => current || data[0]?.id || "");
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : "Failed to load categories";
      setLoadError(message);
      showError(message);
    } finally {
      setIsLoading(false);
    }
  }, [siteCode]);

  const loadSubcategories = useCallback(
    async (categoryId: string) => {
      if (!categoryId) {
        setSubcategories([]);
        return;
      }
      setIsLoadingSubs(true);
      try {
        const data = await fetchSubcategories(siteCode, categoryId);
        setSubcategories(data);
      } catch (error) {
        showError(
          error instanceof ApiError
            ? error.message
            : "Failed to load subcategories",
        );
      } finally {
        setIsLoadingSubs(false);
      }
    },
    [siteCode],
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial catalog load
    void loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- subcategory refresh on select
    void loadSubcategories(selectedCategoryId);
  }, [selectedCategoryId, loadSubcategories]);

  const resetForm = () => {
    setValues(createEmptyValues());
    setEditingId(null);
    setErrors({});
  };

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategoryId(categoryId);
    resetForm();
    setPendingDelete(null);
  };

  const handleUpload = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    try {
      const uploaded = await uploadCategoryBanner(siteCode, file, editingId);
      if (!uploaded.url) {
        throw new Error("Upload succeeded but no image URL was returned");
      }
      setValues((prev) => ({
        ...prev,
        bannerUrl: uploaded.url,
        bannerPublicId: uploaded.publicId,
      }));
      setErrors((prev) => ({ ...prev, bannerUrl: undefined }));
      showSuccess("Banner uploaded successfully");
    } catch (error) {
      showError(error instanceof ApiError ? error.message : "Cloudinary upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedCategoryId) {
      showError("Select a main category first");
      return;
    }

    const validated = validateSubcategoryForm(values);
    if (!validated.ok) {
      setErrors(validated.errors);
      showError("Please fix the highlighted fields");
      return;
    }

    setIsSubmitting(true);
    setErrors({});
    try {
      if (editingId) {
        await updateSubcategory(siteCode, selectedCategoryId, editingId, validated.data);
        showSuccess("Subcategory updated");
      } else {
        await createSubcategory(siteCode, selectedCategoryId, validated.data);
        showSuccess("Subcategory created");
      }
      resetForm();
      await loadSubcategories(selectedCategoryId);
    } catch (error) {
      showError(
        error instanceof ApiError
          ? error.message
          : editingId
            ? "Failed to update subcategory"
            : "Failed to create subcategory",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (subcategory: CategoryDto) => {
    setEditingId(subcategory.id);
    setValues(toFormValues(subcategory));
    setErrors({});
    setPendingDelete(null);
  };

  const handleDelete = async () => {
    if (!pendingDelete || !selectedCategoryId) return;
    setIsDeleting(true);
    try {
      await deleteSubcategory(siteCode, selectedCategoryId, pendingDelete.id);
      showSuccess("Subcategory deleted");
      if (editingId === pendingDelete.id) {
        resetForm();
      }
      setPendingDelete(null);
      await loadSubcategories(selectedCategoryId);
    } catch (error) {
      showError(
        error instanceof ApiError
          ? error.message
          : "Failed to delete subcategory",
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const selectedCategory = categories.find((item) => item.id === selectedCategoryId);

  return (
    <AdminAppShell
      siteCode={siteCode}
      title="Manage Products & Category"
      description="Select a main category, add subcategories with banners, then open Add Product."
    >
      <div className="space-y-6">
        {loadError ? (
          <Alert variant="destructive">
            <AlertTitle>Could not load categories</AlertTitle>
            <AlertDescription>{loadError}</AlertDescription>
          </Alert>
        ) : null}

        <Card className="border-border bg-card shadow-sm">
          <CardHeader className="border-b border-border/70">
            <div className="flex items-center gap-2">
              <Boxes className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg font-semibold">
                {editingId ? "Edit subcategory" : "Subcategory details"}
              </CardTitle>
            </div>
            <CardDescription>
              {editingId
                ? "Update the subcategory name, banner, or active status."
                : "Choose a main category, then add a subcategory with a banner image."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5 pt-6">
            <div className="space-y-2">
              <Label htmlFor="main-category">Main category</Label>
              <Select
                value={selectedCategoryId || undefined}
                onValueChange={handleCategoryChange}
                disabled={isLoading || categories.length === 0 || Boolean(editingId)}
              >
                <SelectTrigger id="main-category" className="w-full max-w-md">
                  <SelectValue
                    placeholder={
                      isLoading ? "Loading categories…" : "Select a category"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {categories.length === 0 && !isLoading ? (
                <p className="text-sm text-muted-foreground">
                  Create a category first from{" "}
                  <Link
                    href={`/admin/${siteCode.toLowerCase()}/products/create-category`}
                    className="text-primary underline-offset-4 hover:underline"
                  >
                    Create Category
                  </Link>
                  .
                </p>
              ) : null}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="subcategory-name">Subcategory name</Label>
                <Input
                  id="subcategory-name"
                  value={values.name}
                  onChange={(event) =>
                    setValues((prev) => ({ ...prev, name: event.target.value }))
                  }
                  placeholder="e.g. Vitamin C"
                  disabled={!selectedCategoryId}
                  className="max-w-md"
                />
                {errors.name ? (
                  <p className="text-sm text-destructive">{errors.name}</p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label>Subcategory banner image</Label>
                {values.bannerUrl ? (
                  <div className="max-w-md overflow-hidden rounded-lg border border-border bg-muted/20">
                    {/* eslint-disable-next-line @next/next/no-img-element -- admin Cloudinary preview */}
                    <img
                      src={values.bannerUrl}
                      alt=""
                      className="h-44 w-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="flex h-44 max-w-md items-center justify-center rounded-lg border border-dashed border-border bg-muted/10 text-muted-foreground">
                    <ImagePlus className="h-6 w-6" />
                  </div>
                )}
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    disabled={uploading || !selectedCategoryId}
                    onClick={() => fileRef.current?.click()}
                  >
                    <Upload className="h-4 w-4" />
                    {uploading ? "Uploading…" : "Upload banner"}
                  </Button>
                  {values.bannerUrl ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setValues((prev) => ({
                          ...prev,
                          bannerUrl: "",
                          bannerPublicId: "",
                        }))
                      }
                    >
                      Remove
                    </Button>
                  ) : null}
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="sr-only"
                  onChange={(event) => {
                    void handleUpload(event.target.files?.[0]);
                    event.target.value = "";
                  }}
                />
                {errors.bannerUrl ? (
                  <p className="text-sm text-destructive">{errors.bannerUrl}</p>
                ) : null}
              </div>

              <div className="flex max-w-md items-center justify-between rounded-lg border border-border px-3 py-2">
                <div>
                  <p className="text-sm font-medium">Active</p>
                  <p className="text-xs text-muted-foreground">
                    Inactive subcategories are hidden on the storefront.
                  </p>
                </div>
                <Switch
                  checked={values.active}
                  disabled={!selectedCategoryId}
                  onCheckedChange={(checked) =>
                    setValues((prev) => ({ ...prev, active: checked }))
                  }
                />
              </div>

              <div className="flex flex-wrap gap-2">
                {editingId ? (
                  <Button type="button" variant="ghost" onClick={resetForm}>
                    Cancel
                  </Button>
                ) : null}
                <Button
                  type="submit"
                  className="gap-2"
                  disabled={isSubmitting || uploading || !selectedCategoryId}
                >
                  {editingId ? null : <Plus className="h-4 w-4" />}
                  {isSubmitting
                    ? "Saving…"
                    : editingId
                      ? "Update subcategory"
                      : "Add subcategory"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="border-border bg-card shadow-sm">
          <CardHeader className="border-b border-border/70">
            <CardTitle className="text-lg font-semibold">
              Subcategories
              {selectedCategory ? ` — ${selectedCategory.name}` : ""}
            </CardTitle>
            <CardDescription>
              Edit or delete empty subcategories, or open Add Product to manage
              products.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            {isLoadingSubs ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Loading subcategories…
              </p>
            ) : subcategories.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                {selectedCategoryId
                  ? "No subcategories yet. Add one above."
                  : "Select a category to view subcategories."}
              </p>
            ) : (
              <Table className="min-w-[760px]">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-20">Banner</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subcategories.map((subcategory) => (
                    <TableRow key={subcategory.id}>
                      <TableCell>
                        {subcategory.bannerUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element -- admin Cloudinary thumb
                          <img
                            src={subcategory.bannerUrl}
                            alt=""
                            className="h-10 w-14 rounded object-cover"
                          />
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">
                        {subcategory.name}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {subcategory.slug}
                      </TableCell>
                      <TableCell>
                        {subcategory.active ? "Active" : "Inactive"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="gap-1.5"
                            onClick={() => handleEdit(subcategory)}
                            aria-label={`Edit ${subcategory.name}`}
                          >
                            <Pencil className="h-4 w-4" />
                            Edit
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="gap-1.5 text-destructive hover:text-destructive"
                            onClick={() => setPendingDelete(subcategory)}
                            aria-label={`Delete ${subcategory.name}`}
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </Button>
                          <Button variant="outline" size="sm" asChild>
                            <Link
                              href={`/admin/${siteCode.toLowerCase()}/products/subcategories/${subcategory.id}/products`}
                              className="inline-flex items-center gap-1"
                            >
                              Add Product
                              <ChevronRight className="h-4 w-4" />
                            </Link>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <AlertDialog
          open={Boolean(pendingDelete)}
          onOpenChange={(open) => {
            if (!open && !isDeleting) {
              setPendingDelete(null);
            }
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                Delete {pendingDelete?.name ?? "subcategory"}?
              </AlertDialogTitle>
              <AlertDialogDescription>
                This cannot be undone. The subcategory banner is also removed.
                Subcategories with products cannot be deleted — remove all
                products first.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                variant="destructive"
                disabled={isDeleting}
                onClick={(event) => {
                  event.preventDefault();
                  void handleDelete();
                }}
              >
                {isDeleting ? "Deleting…" : "Delete subcategory"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminAppShell>
  );
}
