"use client";

import { useMemo, useState } from "react";

import { ColorsCurrentTable } from "@/components/catalog/edit-product-section-tables";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { showError, showSuccess } from "@/lib/toast";
import { ApiError } from "@/services/api/errors";
import {
  createCatalogColor,
  updateProductColors,
} from "@/services/api/product-edit";
import type { SiteCode } from "@/types/auth";
import type {
  CatalogColorDto,
  ProductColorDto,
  ProductEditDto,
} from "@/types/product-edit";

/** Common named colors shown when the site master list is empty or sparse. */
export const DEFAULT_COLOR_PALETTE: Array<{ name: string; hex: string }> = [
  { name: "Red", hex: "#FF0000" },
  { name: "Green", hex: "#008000" },
  { name: "Blue", hex: "#0000FF" },
  { name: "Yellow", hex: "#FFFF00" },
  { name: "Orange", hex: "#FFA500" },
  { name: "Purple", hex: "#800080" },
  { name: "Black", hex: "#000000" },
  { name: "White", hex: "#FFFFFF" },
  { name: "Gray", hex: "#808080" },
  { name: "Brown", hex: "#A52A2A" },
  { name: "Teal", hex: "#008080" },
  { name: "Dark Turquoise", hex: "#00CED1" },
  { name: "Navy", hex: "#000080" },
  { name: "Gold", hex: "#FFD700" },
  { name: "Wheat", hex: "#F5DEB3" },
  { name: "Pink", hex: "#FFC0CB" },
  { name: "Coral", hex: "#FF7F50" },
  { name: "Crimson", hex: "#DC143C" },
  { name: "Indigo", hex: "#4B0082" },
  { name: "Olive", hex: "#808000" },
  { name: "Maroon", hex: "#800000" },
  { name: "Cyan", hex: "#00FFFF" },
  { name: "Magenta", hex: "#FF00FF" },
  { name: "Silver", hex: "#C0C0C0" },
  { name: "Beige", hex: "#F5F5DC" },
  { name: "Chocolate", hex: "#D2691E" },
  { name: "Sky Blue", hex: "#87CEEB" },
  { name: "Slate Gray", hex: "#708090" },
  { name: "Tomato", hex: "#FF6347" },
  { name: "Violet", hex: "#EE82EE" },
];

type ColorOption = {
  key: string;
  id: string | null;
  name: string;
  hex: string;
};

type CustomColorDraft = {
  name: string;
  hex: string;
};

type SectionProps = {
  siteCode: SiteCode;
  productId: string;
  data: ProductEditDto;
  onUpdated: (next: ProductEditDto) => void;
};

function normalizeHex(hex: string): string {
  return hex.trim().toUpperCase();
}

function isValidHex(hex: string): boolean {
  return /^#[0-9A-Fa-f]{6}$/.test(hex.trim());
}

function mergeColorOptions(catalogColors: CatalogColorDto[]): ColorOption[] {
  const byHex = new Map<string, ColorOption>();

  for (const color of DEFAULT_COLOR_PALETTE) {
    const hex = normalizeHex(color.hex);
    byHex.set(hex, {
      key: `default-${hex}`,
      id: null,
      name: color.name,
      hex,
    });
  }

  for (const color of catalogColors) {
    const hex = normalizeHex(color.hex);
    byHex.set(hex, {
      key: color.id,
      id: color.id,
      name: color.name,
      hex,
    });
  }

  return [...byHex.values()].sort((a, b) => a.name.localeCompare(b.name));
}

export function ColorManagementSection({
  siteCode,
  productId,
  data,
  onUpdated,
}: SectionProps) {
  const [catalogColors, setCatalogColors] = useState(data.catalogColors);
  const [selectedHexes, setSelectedHexes] = useState<string[]>(() =>
    data.colors
      .filter((c) => c.hex)
      .map((c) => normalizeHex(c.hex as string)),
  );
  const [customColors, setCustomColors] = useState<CustomColorDraft[]>(() =>
    data.colors
      .filter((c) => !c.hex)
      .map((c) => ({ name: c.name, hex: "" }))
      .concat(
        data.colors
          .filter((c) => {
            if (!c.hex) return false;
            const hex = normalizeHex(c.hex);
            const inCatalog = data.catalogColors.some(
              (master) => normalizeHex(master.hex) === hex,
            );
            const inDefaults = DEFAULT_COLOR_PALETTE.some(
              (master) => normalizeHex(master.hex) === hex,
            );
            return !inCatalog && !inDefaults;
          })
          .map((c) => ({ name: c.name, hex: normalizeHex(c.hex as string) })),
      ),
  );
  const [customName, setCustomName] = useState("");
  const [customHex, setCustomHex] = useState("#287F79");
  const [editingColorId, setEditingColorId] = useState<string | null>(null);
  const [showAddMaster, setShowAddMaster] = useState(false);
  const [newName, setNewName] = useState("");
  const [newHex, setNewHex] = useState("#287F79");
  const [saving, setSaving] = useState(false);
  const [deletingColorId, setDeletingColorId] = useState<string | null>(null);
  const [addingMaster, setAddingMaster] = useState(false);

  const colorOptions = useMemo(
    () => mergeColorOptions(catalogColors),
    [catalogColors],
  );

  const toggleHex = (hex: string) => {
    const normalized = normalizeHex(hex);
    setSelectedHexes((prev) => {
      const saved = data.colors
        .filter((color) => color.hex)
        .map((color) => normalizeHex(color.hex as string));
      const current = new Set([...saved, ...prev]);
      if (current.has(normalized)) {
        current.delete(normalized);
      } else {
        current.add(normalized);
      }
      return [...current];
    });
  };

  const handleAddCatalogColor = async () => {
    const name = newName.trim();
    const hex = newHex.trim();
    if (!name) {
      showError("Enter a color name");
      return;
    }
    if (!isValidHex(hex)) {
      showError("Hex must be #RRGGBB");
      return;
    }
    setAddingMaster(true);
    try {
      const created = await createCatalogColor(siteCode, {
        name,
        hex: normalizeHex(hex),
      });
      setCatalogColors((prev) => [created, ...prev]);
      setSelectedHexes((prev) => {
        const next = normalizeHex(created.hex);
        return prev.includes(next) ? prev : [...prev, next];
      });
      setNewName("");
      setNewHex("#287F79");
      setShowAddMaster(false);
      showSuccess("Color added to list");
    } catch (error) {
      showError(
        error instanceof ApiError ? error.message : "Failed to add color",
      );
    } finally {
      setAddingMaster(false);
    }
  };

  const addCustomColor = () => {
    const name = customName.trim();
    const hex = customHex.trim();
    if (!name) {
      showError("Enter a custom color name");
      return;
    }
    if (hex && !isValidHex(hex)) {
      showError("Hex must be #RRGGBB");
      return;
    }
    const normalizedHex = hex ? normalizeHex(hex) : "";
    setCustomColors((prev) => {
      const exists = prev.some(
        (row) =>
          row.name.toLowerCase() === name.toLowerCase() &&
          normalizeHex(row.hex || "") === normalizedHex,
      );
      if (exists) return prev;
      return [...prev, { name, hex: normalizedHex }];
    });
    if (normalizedHex) {
      setSelectedHexes((prev) =>
        prev.includes(normalizedHex) ? prev : [...prev, normalizedHex],
      );
    }
    setCustomName("");
    setCustomHex("#287F79");
  };

  const removeColorFromDraft = (color: ProductColorDto) => {
    if (color.hex) {
      const hex = normalizeHex(color.hex);
      setSelectedHexes((hexes) => hexes.filter((value) => value !== hex));
      setCustomColors((colors) =>
        colors.filter((row) => !row.hex || normalizeHex(row.hex) !== hex),
      );
      return;
    }
    setCustomColors((colors) =>
      colors.filter((row) => row.name.toLowerCase() !== color.name.toLowerCase()),
    );
  };

  const handleEditColor = (colorId: string) => {
    const color = data.colors.find((row) => row.id === colorId);
    if (!color) return;
    removeColorFromDraft(color);
    setEditingColorId(color.id);
    setCustomName(color.name);
    setCustomHex(color.hex ?? "");
  };

  const handleDeleteColor = async (colorId: string) => {
    const color = data.colors.find((row) => row.id === colorId);
    if (!color) return;
    setDeletingColorId(colorId);
    try {
      const next = await updateProductColors(siteCode, productId, {
        colors: data.colors
          .filter((row) => row.id !== colorId)
          .map((row) => ({
            colorId: row.colorId,
            name: row.name,
            hex: row.hex,
            active: row.active,
            sortOrder: row.sortOrder,
          })),
      });
      removeColorFromDraft(color);
      if (editingColorId === color.id) {
        setEditingColorId(null);
        setCustomName("");
        setCustomHex("#287F79");
      }
      onUpdated(next);
      showSuccess(`${color.name} deleted`);
    } catch (error) {
      showError(
        error instanceof ApiError ? error.message : "Failed to delete color",
      );
    } finally {
      setDeletingColorId(null);
    }
  };

  const handleCustomColorSubmit = () => {
    if (editingColorId) {
      const name = customName.trim();
      const hex = customHex.trim();
      if (!name) {
        showError("Enter a custom color name");
        return;
      }
      if (hex && !isValidHex(hex)) {
        showError("Hex must be #RRGGBB");
        return;
      }
      const normalizedHex = hex ? normalizeHex(hex) : "";
      const catalogMatch = colorOptions.find(
        (option) => normalizeHex(option.hex) === normalizedHex,
      );
      if (catalogMatch) {
        setSelectedHexes((prev) =>
          prev.includes(normalizedHex) ? prev : [...prev, normalizedHex],
        );
      } else {
        setCustomColors((prev) => [...prev, { name, hex: normalizedHex }]);
        if (normalizedHex) {
          setSelectedHexes((prev) =>
            prev.includes(normalizedHex) ? prev : [...prev, normalizedHex],
          );
        }
      }
      setEditingColorId(null);
      setCustomName("");
      setCustomHex("#287F79");
      return;
    }
    addCustomColor();
  };

  const removeCustomColor = (index: number) => {
    const removed = customColors[index];
    if (removed?.hex) {
      const hex = normalizeHex(removed.hex);
      setSelectedHexes((hexes) => hexes.filter((h) => h !== hex));
    }
    setCustomColors((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const colors: Array<{
        colorId: string | null;
        name: string;
        hex: string | null;
        active: boolean;
        sortOrder: number;
      }> = [];

      selectedHexes.forEach((hex) => {
        const option = colorOptions.find(
          (c) => normalizeHex(c.hex) === normalizeHex(hex),
        );
        const customMatch = customColors.find(
          (c) => c.hex && normalizeHex(c.hex) === normalizeHex(hex),
        );
        colors.push({
          colorId: option?.id ?? null,
          name: option?.name ?? customMatch?.name ?? hex,
          hex: normalizeHex(hex),
          active: true,
          sortOrder: colors.length,
        });
      });

      customColors
        .filter((row) => !row.hex)
        .forEach((row) => {
          colors.push({
            colorId: null,
            name: row.name,
            hex: null,
            active: true,
            sortOrder: colors.length,
          });
        });

      const next = await updateProductColors(siteCode, productId, { colors });
      setSelectedHexes(
        next.colors
          .filter((color) => color.hex)
          .map((color) => normalizeHex(color.hex as string)),
      );
      setCustomColors(
        next.colors
          .filter((color) => {
            if (!color.hex) return true;
            const hex = normalizeHex(color.hex);
            return !colorOptions.some(
              (option) => normalizeHex(option.hex) === hex,
            );
          })
          .map((color) => ({
            name: color.name,
            hex: color.hex ? normalizeHex(color.hex) : "",
          })),
      );
      onUpdated(next);
      showSuccess("Colors saved");
    } catch (error) {
      showError(
        error instanceof ApiError ? error.message : "Failed to save colors",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>Product name</Label>
        <Input value={data.product.name} disabled readOnly />
      </div>
      <p className="text-sm text-muted-foreground">
        Colors are optional. Skip this section to sell a single base price without
        color swatches on the storefront.
      </p>

      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-foreground">
            Choose from Color List (optional)
          </h3>
          <Button
            type="button"
            size="sm"
            onClick={() => setShowAddMaster((prev) => !prev)}
          >
            Add Color
          </Button>
        </div>

        {showAddMaster ? (
          <div className="grid gap-2 rounded-lg border border-border bg-muted/20 p-3 sm:grid-cols-[1fr_140px_auto]">
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Color name"
            />
            <Input
              value={newHex}
              onChange={(e) => setNewHex(e.target.value)}
              placeholder="#RRGGBB"
            />
            <Button
              type="button"
              variant="secondary"
              disabled={addingMaster}
              onClick={() => void handleAddCatalogColor()}
            >
              {addingMaster ? "Adding…" : "Save to list"}
            </Button>
          </div>
        ) : null}

        <div className="max-h-[420px] overflow-y-auto rounded-lg border border-border bg-card p-3">
          {colorOptions.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No colors available. Use Add Color to create one.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {colorOptions.map((color) => {
                const selected = selectedHexes.includes(
                  normalizeHex(color.hex),
                );
                return (
                  <button
                    key={color.key}
                    type="button"
                    onClick={() => toggleHex(color.hex)}
                    className={cn(
                      "flex flex-col items-center gap-1.5 rounded-lg border bg-background px-2 py-3 text-center transition-colors",
                      selected
                        ? "border-primary ring-2 ring-primary/25"
                        : "border-border hover:border-primary/40",
                    )}
                  >
                    <span
                      className="h-8 w-8 rounded-full border border-border shadow-sm"
                      style={{ backgroundColor: color.hex }}
                      aria-hidden
                    />
                    <span className="text-xs font-medium leading-tight text-foreground">
                      {color.name}
                    </span>
                    <span className="font-mono text-[10px] text-muted-foreground">
                      {color.hex}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Or
        </span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground">
          Enter Custom Color Name
        </h3>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
            placeholder="Type color name (e.g. Sky Blue, Olive, etc)"
            className="flex-1"
          />
          <Input
            value={customHex}
            onChange={(e) => setCustomHex(e.target.value)}
            placeholder="#RRGGBB"
            className="sm:w-36"
          />
          <Button type="button" variant="secondary" onClick={handleCustomColorSubmit}>
            {editingColorId ? "Update" : "Add"}
          </Button>
          {editingColorId ? (
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setEditingColorId(null);
                setCustomName("");
                setCustomHex("#287F79");
              }}
            >
              Cancel
            </Button>
          ) : null}
        </div>
        {customColors.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {customColors.map((row, index) => (
              <Button
                key={`${row.name}-${row.hex}-${index}`}
                type="button"
                size="sm"
                variant="outline"
                onClick={() => removeCustomColor(index)}
                className="gap-2"
              >
                {row.hex ? (
                  <span
                    className="inline-block h-3.5 w-3.5 rounded-full border border-border"
                    style={{ backgroundColor: row.hex }}
                  />
                ) : null}
                {row.name}
                {row.hex ? (
                  <span className="font-mono text-[10px] text-muted-foreground">
                    {row.hex}
                  </span>
                ) : null}
                <span aria-hidden>×</span>
              </Button>
            ))}
          </div>
        ) : null}
      </div>

      <div className="flex justify-center">
        <Button
          type="button"
          disabled={saving || deletingColorId !== null}
          onClick={() => void handleSave()}
          className="min-w-[160px]"
        >
          {saving ? "Saving…" : "Data Save"}
        </Button>
      </div>

      <ColorsCurrentTable
        data={data}
        onEdit={handleEditColor}
        onDelete={(colorId) => void handleDeleteColor(colorId)}
      />
    </div>
  );
}
