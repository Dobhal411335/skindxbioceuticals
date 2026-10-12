"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { ArrowLeft, Copy, Package, Pencil, Trash2 } from "lucide-react";

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
  validateCatalogProductForm,
  type CatalogProductFormErrors,
} from "@/schemas/catalog-schema";
import {
  createSubcategoryProduct,
  deleteSubcategoryProduct,
  fetchSubcategory,
  fetchSubcategoryProducts,
  patchSubcategoryProduct,
  updateSubcategoryProduct,
} from "@/services/api/catalog";
import { ApiError } from "@/services/api/errors";
import { showError, showSuccess } from "@/lib/toast";
import type { SiteCode } from "@/types/auth";
import type {
  CatalogProductDto,
  CatalogProductFormValues,
  CategoryDto,
} from "@/types/catalog";

function createEmptyValues(): CatalogProductFormValues {
  return {
    productCode: "",
    name: "",
    active: true,
  };
}

function storefrontProductUrl(slug: string): string {
  return `/shop/${slug}`;
}

export function AddProductPage({
  siteCode,
  subcategoryId,
}: {
  siteCode: SiteCode;
  subcategoryId: string;
}) {
  const [products, setProducts] = useState<CatalogProductDto[]>([]);
  const [subcategory, setSubcategory] = useState<CategoryDto | null>(null);
  const [values, setValues] = useState<CatalogProductFormValues>(createEmptyValues);
  const [errors, setErrors] = useState<CatalogProductFormErrors>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<CatalogProductDto | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const [subcategoryData, productData] = await Promise.all([
        fetchSubcategory(siteCode, subcategoryId),
        fetchSubcategoryProducts(siteCode, subcategoryId),
      ]);
      setSubcategory(subcategoryData);
      setProducts(productData);
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : "Failed to load products";
      setLoadError(message);
      showError(message);
    } finally {
      setIsLoading(false);
    }
  }, [siteCode, subcategoryId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- product list fetch
    void load();
  }, [load]);

  const resetForm = () => {
    setValues(createEmptyValues());
    setEditingId(null);
    setErrors({});
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validated = validateCatalogProductForm(values);
    if (!validated.ok) {
      setErrors(validated.errors);
      showError("Please fix the highlighted fields");
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingId) {
        await updateSubcategoryProduct(
          siteCode,
          subcategoryId,
          editingId,
          validated.data,
        );
        showSuccess("Product updated");
      } else {
        await createSubcategoryProduct(siteCode, subcategoryId, validated.data);
        showSuccess("Product saved");
      }
      resetForm();
      await load();
    } catch (error) {
      showError(error instanceof ApiError ? error.message : "Failed to save product");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (product: CatalogProductDto) => {
    try {
      await patchSubcategoryProduct(siteCode, subcategoryId, product.id, {
        active: !product.active,
      });
      showSuccess(product.active ? "Product deactivated" : "Product activated");
      await load();
    } catch (error) {
      showError(
        error instanceof ApiError ? error.message : "Failed to update product status",
      );
    }
  };

  const handleCopyUrl = async (product: CatalogProductDto) => {
    const url = storefrontProductUrl(product.slug);
    try {
      await navigator.clipboard.writeText(url);
      showSuccess("Product URL copied");
    } catch {
      showError("Could not copy URL");
    }
  };

  const handleDelete = async () => {
    if (!pendingDelete) return;
    setIsDeleting(true);
    try {
      await deleteSubcategoryProduct(siteCode, subcategoryId, pendingDelete.id);
      showSuccess("Product deleted");
      if (editingId === pendingDelete.id) {
        resetForm();
      }
      setPendingDelete(null);
      await load();
    } catch (error) {
      showError(error instanceof ApiError ? error.message : "Failed to delete product");
    } finally {
      setIsDeleting(false);
    }
  };

  const subcategoryLabel = subcategory?.name ?? "this subcategory";

  return (
    <AdminAppShell
      siteCode={siteCode}
      title={subcategory ? `Add Product — ${subcategory.name}` : "Add Product"}
      description={`Create and manage products for ${subcategoryLabel}.`}
    >
      <div className="space-y-6">
        <div className="space-y-1">
          <Link
            href={`/admin/${siteCode.toLowerCase()}/products/manage-category`}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to categories
          </Link>
          {subcategory ? (
            <p className="text-sm text-muted-foreground">
              Subcategory:{" "}
              <span className="font-medium text-foreground">{subcategory.name}</span>
            </p>
          ) : null}
        </div>

        {loadError ? (
          <Alert variant="destructive">
            <AlertTitle>Could not load products</AlertTitle>
            <AlertDescription>{loadError}</AlertDescription>
          </Alert>
        ) : null}

        <Card className="border-border bg-card shadow-sm">
          <CardHeader className="border-b border-border/70">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg font-semibold">
                {editingId ? "Edit product" : "New product"}
                {subcategory ? ` — ${subcategory.name}` : ""}
              </CardTitle>
            </div>
            <CardDescription>
              Add the product code and name for {subcategoryLabel}.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form
              onSubmit={handleSubmit}
              className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_auto_auto]"
            >
              <div className="space-y-2">
                <Label htmlFor="product-code">Product code</Label>
                <Input
                  id="product-code"
                  value={values.productCode}
                  onChange={(event) =>
                    setValues((prev) => ({
                      ...prev,
                      productCode: event.target.value,
                    }))
                  }
                  placeholder="e.g. VC-01"
                />
                {errors.productCode ? (
                  <p className="text-sm text-destructive">{errors.productCode}</p>
                ) : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="product-name">Product name</Label>
                <Input
                  id="product-name"
                  value={values.name}
                  onChange={(event) =>
                    setValues((prev) => ({ ...prev, name: event.target.value }))
                  }
                  placeholder="e.g. Vitamin C Serum"
                />
                {errors.name ? (
                  <p className="text-sm text-destructive">{errors.name}</p>
                ) : null}
              </div>
              <div className="flex items-end gap-2 pb-0.5">
                <div className="flex items-center gap-2 rounded-lg border border-border px-3 py-2">
                  <Switch
                    checked={values.active}
                    onCheckedChange={(checked) =>
                      setValues((prev) => ({ ...prev, active: checked }))
                    }
                  />
                  <span className="text-sm">Active</span>
                </div>
              </div>
              <div className="flex items-end gap-2">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Saving…" : "Save"}
                </Button>
                {editingId ? (
                  <Button type="button" variant="ghost" onClick={resetForm}>
                    Cancel
                  </Button>
                ) : null}
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="border-border bg-card shadow-sm">
          <CardHeader className="border-b border-border/70">
            <CardTitle className="text-lg font-semibold">Products</CardTitle>
            <CardDescription>
              Edit, delete, copy URL, or toggle active status.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            {isLoading ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Loading products…
              </p>
            ) : products.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No products in this subcategory yet.
              </p>
            ) : (
              <Table className="min-w-[720px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>Product name</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Active</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {product.productCode}
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={product.active}
                          onCheckedChange={() => void handleToggleActive(product)}
                          aria-label={`Toggle ${product.name}`}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => void handleCopyUrl(product)}
                            aria-label="Copy product URL"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setEditingId(product.id);
                              setValues({
                                productCode: product.productCode,
                                name: product.name,
                                active: product.active,
                              });
                            }}
                            aria-label="Edit product"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => setPendingDelete(product)}
                            aria-label="Delete product"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
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
                Delete {pendingDelete?.name ?? "product"}?
              </AlertDialogTitle>
              <AlertDialogDescription>
                This cannot be undone.
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
                {isDeleting ? "Deleting…" : "Delete product"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminAppShell>
  );
}
