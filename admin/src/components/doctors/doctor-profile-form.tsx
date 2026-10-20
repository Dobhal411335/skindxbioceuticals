"use client";

import { useRef, useState } from "react";
import { ImageIcon, Stethoscope, UploadCloud } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
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
import { Textarea } from "@/components/ui/textarea";
import { INDIA_STATES } from "@/lib/india-states";
import { showError, showSuccess } from "@/lib/toast";
import {
  DOCTOR_PREFIX_OPTIONS,
  type DoctorProfileFormErrors,
} from "@/schemas/doctor-profile-schema";
import { uploadDoctorPhoto } from "@/services/api/doctor-profile";
import { ApiError } from "@/services/api/errors";
import type { SiteCode } from "@/types/auth";
import type { DoctorProfileFormValues } from "@/types/doctor-profile";

type DoctorProfileFormProps = {
  siteCode: SiteCode;
  values: DoctorProfileFormValues;
  errors: DoctorProfileFormErrors;
  isSubmitting: boolean;
  isEditing: boolean;
  editingId: string | null;
  onChange: (values: DoctorProfileFormValues) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onReset: () => void;
};

export function DoctorProfileForm({
  siteCode,
  values,
  errors,
  isSubmitting,
  isEditing,
  editingId,
  onChange,
  onSubmit,
  onReset,
}: DoctorProfileFormProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const uploaded = await uploadDoctorPhoto(siteCode, file, editingId);
      onChange({
        ...values,
        photoUrl: uploaded.url,
        photoPublicId: uploaded.publicId,
      });
      showSuccess("Doctor photo uploaded");
    } catch (error) {
      showError(
        error instanceof ApiError ? error.message : "Image upload failed",
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
          <Stethoscope className="h-5 w-5 text-muted-foreground" />
          <CardTitle className="text-lg font-semibold">
            {isEditing ? "Edit Doctor Profile" : "Create Doctor Profile"}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <form onSubmit={onSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="space-y-3">
              <Label className="text-sm font-semibold">
                Photo <span className="text-destructive">*</span>
              </Label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(event) => void handleUpload(event)}
              />
              {!values.photoUrl ? (
                <button
                  type="button"
                  disabled={uploading}
                  onClick={() => fileInputRef.current?.click()}
                  className="flex h-60 w-full flex-col items-center justify-center gap-3 rounded-[14px] border-2 border-dashed border-border bg-muted/30 transition-colors hover:bg-muted/50 disabled:cursor-not-allowed"
                >
                  {uploading ? (
                    <>
                      <div className="size-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                      <p className="text-sm font-medium text-muted-foreground">
                        Uploading...
                      </p>
                    </>
                  ) : (
                    <>
                      <div className="flex size-12 items-center justify-center rounded-full bg-background shadow-sm">
                        <UploadCloud className="size-5 text-primary" />
                      </div>
                      <div className="px-4 text-center">
                        <p className="text-sm font-medium">Upload doctor photo</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          JPG, PNG, or WebP
                        </p>
                      </div>
                    </>
                  )}
                </button>
              ) : (
                <div className="relative overflow-hidden rounded-[14px] border border-border">
                  {/* eslint-disable-next-line @next/next/no-img-element -- admin Cloudinary preview */}
                  <img
                    src={values.photoUrl}
                    alt=""
                    className="h-60 w-full object-cover"
                  />
                  <div className="absolute inset-x-0 bottom-0 flex gap-2 bg-black/50 p-3">
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      disabled={uploading}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Replace
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      onClick={() =>
                        onChange({ ...values, photoUrl: "", photoPublicId: "" })
                      }
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              )}
              {errors.photoUrl ? (
                <p className="text-sm text-destructive">{errors.photoUrl}</p>
              ) : null}
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="doctor-name">
                  Doctor name <span className="text-destructive">*</span>
                </Label>
                <div className="flex gap-2">
                  <div className="w-36 shrink-0">
                    <Select
                      value={values.prefix || "Dr."}
                      onValueChange={(prefix) =>
                        onChange({ ...values, prefix })
                      }
                    >
                      <SelectTrigger id="doctor-prefix" aria-label="Doctor title prefix" className="w-full">
                        <SelectValue placeholder="Prefix" />
                      </SelectTrigger>
                      <SelectContent>
                        {DOCTOR_PREFIX_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1">
                    <Input
                      id="doctor-name"
                      value={values.name}
                      placeholder="Daisy Bins"
                      onChange={(event) =>
                        onChange({ ...values, name: event.target.value })
                      }
                    />
                  </div>
                </div>
                {errors.name ? (
                  <p className="text-sm text-destructive">{errors.name}</p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Saved as{" "}
                    <span className="font-medium text-foreground">
                      {values.prefix || "Dr."} {values.name.trim() || "…"}
                    </span>
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="doctor-specialization">
                  Specialization <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="doctor-specialization"
                  value={values.specialization}
                  placeholder="Dermatology"
                  onChange={(event) =>
                    onChange({ ...values, specialization: event.target.value })
                  }
                />
                {errors.specialization ? (
                  <p className="text-sm text-destructive">{errors.specialization}</p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="doctor-experience">
                  Experience (years) <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="doctor-experience"
                  type="number"
                  min={0}
                  max={80}
                  value={values.experienceYears}
                  onChange={(event) =>
                    onChange({ ...values, experienceYears: event.target.value })
                  }
                />
                {errors.experienceYears ? (
                  <p className="text-sm text-destructive">{errors.experienceYears}</p>
                ) : null}
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="doctor-state">
                    State <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={values.state || undefined}
                    onValueChange={(value) =>
                      onChange({
                        ...values,
                        state: value,
                      })
                    }
                  >
                    <SelectTrigger id="doctor-state" className="w-full">
                      <SelectValue placeholder="Select state" />
                    </SelectTrigger>
                    <SelectContent>
                      {INDIA_STATES.map((state) => (
                        <SelectItem key={state} value={state}>
                          {state}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.state ? (
                    <p className="text-sm text-destructive">{errors.state}</p>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="doctor-city">
                    City <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="doctor-city"
                    value={values.city}
                    placeholder="Mumbai"
                    onChange={(event) =>
                      onChange({ ...values, city: event.target.value })
                    }
                  />
                  {errors.city ? (
                    <p className="text-sm text-destructive">{errors.city}</p>
                  ) : null}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="doctor-about">
                  About <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="doctor-about"
                  rows={5}
                  value={values.about}
                  placeholder="Short description shown on doctor cards"
                  onChange={(event) =>
                    onChange({ ...values, about: event.target.value })
                  }
                />
                {errors.about ? (
                  <p className="text-sm text-destructive">{errors.about}</p>
                ) : null}
              </div>

              <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                <div className="flex items-center gap-2">
                  <ImageIcon className="h-4 w-4 text-muted-foreground" />
                  <Label htmlFor="doctor-active">Active</Label>
                </div>
                <Switch
                  id="doctor-active"
                  checked={values.active}
                  onCheckedChange={(checked) =>
                    onChange({ ...values, active: checked })
                  }
                />
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={isSubmitting || uploading}>
              {isSubmitting
                ? "Saving…"
                : isEditing
                  ? "Update profile"
                  : "Create profile"}
            </Button>
            {isEditing ? (
              <Button type="button" variant="outline" onClick={onReset}>
                Cancel edit
              </Button>
            ) : null}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
