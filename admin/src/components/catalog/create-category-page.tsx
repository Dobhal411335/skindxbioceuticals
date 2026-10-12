"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { FolderOpen, Pencil, Trash2 } from "lucide-react";

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
  validateCategoryForm,
  type CategoryFormErrors,
} from "@/schemas/catalog-schema";
import {
  createCategory,
  deleteCategory,
  fetchCategories,
  updateCategory,
} from "@/services/api/catalog";
import { ApiError } from "@/services/api/errors";
import { showError, showSuccess } from "@/lib/toast";
import type { SiteCode } from "@/types/auth";
import type { CategoryDto, CategoryFormValues } from "@/types/catalog";

function createEmptyValues(): CategoryFormValues {
  return {
    name: "",
    active: true,
  };
}

function toFormValues(category: CategoryDto): CategoryFormValues {
  return {
    name: category.name,
    active: category.active,
  };
}

export function CreateCategoryPage({ siteCode }: { siteCode: SiteCode }) {
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [values, setValues] = useState<CategoryFormValues>(createEmptyValues);
  const [errors, setErrors] = useState<CategoryFormErrors>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<CategoryDto | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadCategories = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const data = await fetchCategories(siteCode);
      setCategories(data);
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : "Failed to load categories";
      setLoadError(message);
      showError(message);
    } finally {
      setIsLoading(false);
    }
  }, [siteCode]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial category list
    void loadCategories();
  }, [loadCategories]);

  const resetForm = () => {
    setValues(createEmptyValues());
    setEditingId(null);
    setErrors({});
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validated = validateCategoryForm(values);
    if (!validated.ok) {
      setErrors(validated.errors);
      showError("Please fix the highlighted fields");
      return;
    }

    setIsSubmitting(true);
    setErrors({});
    try {
      if (editingId) {
        await updateCategory(siteCode, editingId, validated.data);
        showSuccess("Category updated");
      } else {
        await createCategory(siteCode, validated.data);
        showSuccess("Category created");
      }
      resetForm();
      await loadCategories();
    } catch (error) {
      showError(
        error instanceof ApiError
          ? error.message
          : editingId
            ? "Failed to update category"
            : "Failed to create category",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (category: CategoryDto) => {
    setEditingId(category.id);
    setValues(toFormValues(category));
    setErrors({});
    setPendingDelete(null);
  };

  const handleDelete = async () => {
    if (!pendingDelete) return;
    setIsDeleting(true);
    try {
      await deleteCategory(siteCode, pendingDelete.id);
      showSuccess("Category deleted");
      if (editingId === pendingDelete.id) {
        resetForm();
      }
      setPendingDelete(null);
      await loadCategories();
    } catch (error) {
      showError(error instanceof ApiError ? error.message : "Failed to delete category");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AdminAppShell
      siteCode={siteCode}
      title="Create Category"
      description="Add main product category names for this site."
    >
      <div className="mx-auto max-w-3xl space-y-6">
        {loadError ? (
          <Alert variant="destructive">
            <AlertTitle>Could not load categories</AlertTitle>
            <AlertDescription>{loadError}</AlertDescription>
          </Alert>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="border-border bg-card shadow-sm">
            <CardHeader className="border-b border-border/70">
              <div className="flex items-center gap-2">
                <FolderOpen className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg font-semibold">
                  {editingId ? "Edit category" : "Category details"}
                </CardTitle>
              </div>
              <CardDescription>
                {editingId
                  ? "Update the category name or active status."
                  : "Main categories appear on the storefront `/category` grid. Add banners on Manage Products & Category for each subcategory."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5 pt-6">
              <div className="space-y-2">
                <Label htmlFor="category-name">Category name</Label>
                <Input
                  id="category-name"
                  value={values.name}
                  onChange={(event) =>
                    setValues((prev) => ({ ...prev, name: event.target.value }))
                  }
                  placeholder="e.g. Serums"
                />
                {errors.name ? (
                  <p className="text-sm text-destructive">{errors.name}</p>
                ) : null}
              </div>

              <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                <div>
                  <p className="text-sm font-medium">Active</p>
                  <p className="text-xs text-muted-foreground">
                    Inactive categories are hidden on the storefront.
                  </p>
                </div>
                <Switch
                  checked={values.active}
                  onCheckedChange={(checked) =>
                    setValues((prev) => ({ ...prev, active: checked }))
                  }
                />
              </div>
            </CardContent>
          </Card>
          <div className="flex justify-end gap-2">
            {editingId ? (
              <Button type="button" variant="ghost" onClick={resetForm}>
                Cancel
              </Button>
            ) : null}
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? "Saving…"
                : editingId
                  ? "Update category"
                  : "Save category"}
            </Button>
          </div>
        </form>

        <Card className="border-border bg-card shadow-sm">
          <CardHeader className="border-b border-border/70">
            <CardTitle className="text-lg font-semibold">Existing categories</CardTitle>
            <CardDescription>
              Edit a category name or delete a category that has no subcategories.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            {isLoading ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Loading categories…
              </p>
            ) : categories.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No categories yet. Create one above.
              </p>
            ) : (
              <Table className="min-w-[520px]">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">S.No</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories.map((category, index) => (
                    <TableRow key={category.id}>
                      <TableCell className="text-muted-foreground">
                        {index + 1}
                      </TableCell>
                      <TableCell className="font-medium">{category.name}</TableCell>
                      <TableCell>
                        {category.active ? "Active" : "Inactive"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="gap-1.5"
                            onClick={() => handleEdit(category)}
                            aria-label={`Edit ${category.name}`}
                          >
                            <Pencil className="h-4 w-4" />
                            Edit
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="gap-1.5 text-destructive hover:text-destructive"
                            onClick={() => setPendingDelete(category)}
                            aria-label={`Delete ${category.name}`}
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete
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
                Delete {pendingDelete?.name ?? "category"}?
              </AlertDialogTitle>
              <AlertDialogDescription>
                This cannot be undone. Remove all subcategories first if delete
                fails.
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
                {isDeleting ? "Deleting…" : "Delete category"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminAppShell>
  );
}
