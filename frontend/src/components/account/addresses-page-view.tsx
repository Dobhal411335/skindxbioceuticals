"use client";

import { useEffect, useState } from "react";
import { MapPin, Plus } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  addressFormSchema,
  type AddressFormValues,
} from "@/features/me/address.validation";
import { meService } from "@/features/me/me.service";
import type { Address } from "@/features/me/me.types";
import { showError, showSuccess } from "@/lib/toast";
import { toApiError } from "@/services/api/errors";

const emptyForm: AddressFormValues = {
  label: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  postalCode: "",
  country: "IN",
  isDefault: false,
};

export function AddressesPageView() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Address | null>(null);
  const [form, setForm] = useState<AddressFormValues>(emptyForm);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [pendingDefaultId, setPendingDefaultId] = useState<string | null>(null);

  const load = async (options?: { showLoading?: boolean }) => {
    if (options?.showLoading !== false) {
      setLoading(true);
    }
    setError(null);
    try {
      const data = await meService.listAddresses();
      setAddresses(data);
    } catch (err) {
      setError(toApiError(err).message || "Unable to load addresses.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;

    void meService
      .listAddresses()
      .then((data) => {
        if (!cancelled) {
          setAddresses(data);
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(toApiError(err).message || "Unable to load addresses.");
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setFieldErrors({});
    setFormOpen(true);
  };

  const openEdit = (address: Address) => {
    setEditing(address);
    setForm({
      label: address.label ?? "",
      line1: address.line1,
      line2: address.line2 ?? "",
      city: address.city,
      state: address.state,
      postalCode: address.postalCode,
      country: address.country,
      isDefault: address.isDefault,
    });
    setFieldErrors({});
    setFormOpen(true);
  };

  const submitForm = async () => {
    setError(null);
    const parsed = addressFormSchema.safeParse(form);
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? "form");
        if (!next[key]) next[key] = issue.message;
      }
      setFieldErrors(next);
      return;
    }

    setSaving(true);
    try {
      const payload = {
        label: parsed.data.label || null,
        line1: parsed.data.line1,
        line2: parsed.data.line2 || null,
        city: parsed.data.city,
        state: parsed.data.state,
        postalCode: parsed.data.postalCode,
        country: parsed.data.country,
        isDefault: parsed.data.isDefault,
      };

      if (editing) {
        await meService.updateAddress(editing.id, payload);
        showSuccess("Address updated.", { id: "account.address.save" });
      } else {
        await meService.createAddress(payload);
        showSuccess("Address added.", { id: "account.address.save" });
      }
      setFormOpen(false);
      await load();
    } catch (err) {
      showError(toApiError(err).message || "Unable to save address.", {
        id: "account.address.error",
      });
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    setSaving(true);
    setError(null);
    try {
      await meService.deleteAddress(deleteId);
      setDeleteId(null);
      showSuccess("Address deleted.", { id: "account.address.delete" });
      await load();
    } catch (err) {
      showError(toApiError(err).message || "Unable to delete address.", {
        id: "account.address.error",
      });
    } finally {
      setSaving(false);
    }
  };

  const setDefault = async (address: Address) => {
    if (address.isDefault || pendingDefaultId) return;
    setPendingDefaultId(address.id);
    setError(null);
    try {
      await meService.updateAddress(address.id, { isDefault: true });
      showSuccess("Default address updated.", { id: "account.address.default" });
      await load();
    } catch (err) {
      showError(toApiError(err).message || "Unable to set default address.", {
        id: "account.address.error",
      });
    } finally {
      setPendingDefaultId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold">Addresses</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage delivery addresses for your orders.
          </p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="size-4" />
          Add Address
        </Button>
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
        </div>
      ) : addresses.length === 0 ? (
        <Card className="border-border shadow-none">
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <MapPin className="size-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No saved addresses yet.</p>
            <Button onClick={openCreate}>Add Address</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {addresses.map((address) => (
            <Card key={address.id} className="border-border shadow-none">
              <CardContent className="space-y-3 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold">
                      {address.label || "Address"}
                      {address.isDefault ? (
                        <span className="ml-2 text-xs font-medium text-primary">
                          Default
                        </span>
                      ) : null}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {address.line1}
                      {address.line2 ? `, ${address.line2}` : ""}
                      <br />
                      {address.city}, {address.state} {address.postalCode}
                      <br />
                      {address.country}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => openEdit(address)}>
                    Edit
                  </Button>
                  {!address.isDefault ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={pendingDefaultId === address.id}
                      onClick={() => void setDefault(address)}
                    >
                      {pendingDefaultId === address.id ? "Saving…" : "Set default"}
                    </Button>
                  ) : null}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setDeleteId(address.id)}
                  >
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit address" : "Add address"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            {(
              [
                ["label", "Label (optional)"],
                ["line1", "Address line 1"],
                ["line2", "Address line 2"],
                ["city", "City"],
                ["state", "State"],
                ["postalCode", "Postal code"],
                ["country", "Country"],
              ] as const
            ).map(([key, label]) => (
              <div key={key} className="space-y-1.5">
                <Label htmlFor={key}>{label}</Label>
                <Input
                  id={key}
                  value={form[key] ?? ""}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, [key]: event.target.value }))
                  }
                />
                {fieldErrors[key] ? (
                  <p className="text-xs text-destructive">{fieldErrors[key]}</p>
                ) : null}
              </div>
            ))}
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={Boolean(form.isDefault)}
                onCheckedChange={(checked) =>
                  setForm((current) => ({ ...current, isDefault: checked === true }))
                }
              />
              Set as default address
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
            <Button disabled={saving} onClick={() => void submitForm()}>
              {saving ? "Saving…" : "Save address"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(deleteId)} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete address?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This cannot be undone. The address will be removed from your account.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={saving}
              onClick={() => void confirmDelete()}
            >
              {saving ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
