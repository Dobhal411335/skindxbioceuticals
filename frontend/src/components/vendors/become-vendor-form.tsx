"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CheckCircle2, FileText, HomeIcon,LogInIcon,  Loader2, Upload, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  vendorService,
  type VendorDocumentRef,
} from "@/features/vendors/vendor.service";
import { showError, showSuccess } from "@/lib/toast";
import { toApiError } from "@/services/api/errors";
import { cn } from "@/lib/utils";
import { INDIA_STATES } from "@/utils/state";
const TOTAL_SECTIONS = 6;

type FormState = {
  businessName: string;
  businessType: string;
  industryCategory: string;
  yearOfEstablishment: string;
  legalStructure: string;
  isGstRegistered: boolean;
  gstNumber: string;
  panNumber: string;
  msmeNumber: string;
  gstCertificate: VendorDocumentRef | null;
  panCard: VendorDocumentRef | null;
  msmeCertificate: VendorDocumentRef | null;
  cancelledCheque: VendorDocumentRef | null;
  productCatalog: VendorDocumentRef | null;
  businessCard: VendorDocumentRef | null;
  aadhaarUpload: VendorDocumentRef | null;
  authorizedPersonPhoto: VendorDocumentRef | null;
  contactPerson: string;
  designation: string;
  mobile: string;
  alternateMobile: string;
  email: string;
  whatsappNumber: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  deliveryCapability: string;
  bankName: string;
  accountHolderName: string;
  accountNumber: string;
  ifscCode: string;
  branch: string;
  qualityCertifications: string;
  returnPolicy: string;
  aadhaarNumber: string;
  referredBy: string;
  additionalNotes: string;
};

const initialFormState: FormState = {
  businessName: "",
  businessType: "",
  industryCategory: "",
  yearOfEstablishment: "",
  legalStructure: "",
  isGstRegistered: false,
  gstNumber: "",
  panNumber: "",
  msmeNumber: "",
  gstCertificate: null,
  panCard: null,
  msmeCertificate: null,
  cancelledCheque: null,
  productCatalog: null,
  businessCard: null,
  aadhaarUpload: null,
  authorizedPersonPhoto: null,
  contactPerson: "",
  designation: "",
  mobile: "",
  alternateMobile: "",
  email: "",
  whatsappNumber: "",
  address: "",
  city: "",
  state: "",
  pincode: "",
  country: "India",
  deliveryCapability: "",
  bankName: "",
  accountHolderName: "",
  accountNumber: "",
  ifscCode: "",
  branch: "",
  qualityCertifications: "",
  returnPolicy: "",
  aadhaarNumber: "",
  referredBy: "",
  additionalNotes: "",
};

function isLikelyPdfUrl(url: string): boolean {
  return /\.pdf(\?|$)/i.test(url) || url.includes("/raw/upload/");
}

function DocumentUploadField({
  label,
  required,
  value,
  uploading,
  onUpload,
  onRemove,
}: {
  label: string;
  required?: boolean;
  value: VendorDocumentRef | null;
  uploading: boolean;
  onUpload: (file: File) => void;
  onRemove: () => void;
}) {
  const [localPreview, setLocalPreview] = useState<{
    url: string;
    isImage: boolean;
  } | null>(null);

  useEffect(() => {
    if (!localPreview) return;
    if (value) {
      URL.revokeObjectURL(localPreview.url);
      setLocalPreview(null);
      return;
    }
    if (!uploading) {
      // Upload failed — drop the local preview.
      URL.revokeObjectURL(localPreview.url);
      setLocalPreview(null);
    }
  }, [value, uploading, localPreview]);

  useEffect(() => {
    return () => {
      if (localPreview) URL.revokeObjectURL(localPreview.url);
    };
  }, [localPreview]);

  const previewUrl = value?.url ?? localPreview?.url ?? null;
  const showAsImage = value
    ? !isLikelyPdfUrl(value.url)
    : Boolean(localPreview?.isImage);
  const showPreviewBox = Boolean(uploading || value || localPreview);

  return (
    <div className="space-y-2">
      <Label>
        {label} {required ? <span className="text-destructive">*</span> : null}
      </Label>
      {showPreviewBox ? (
        <div className="relative aspect-[5/2] overflow-hidden rounded-lg border border-border bg-muted/30">
          {previewUrl && showAsImage ? (
            // eslint-disable-next-line @next/next/no-img-element -- Cloudinary / blob preview URLs
            <img
              src={previewUrl}
              alt={`${label} preview`}
              className="size-full object-contain"
            />
          ) : (
            <div className="flex size-full flex-col items-center justify-center gap-2 px-3 text-muted-foreground">
              <FileText className="size-8" />
              <span className="text-center text-xs">
                {uploading ? "Uploading document…" : "Document uploaded"}
              </span>
            </div>
          )}

          {uploading ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-background/70">
              <Loader2 className="size-8 animate-spin text-primary" />
              <span className="text-xs font-medium text-foreground">
                Uploading…
              </span>
            </div>
          ) : null}

          {value && !uploading ? (
            <Button
              type="button"
              variant="secondary"
              size="icon-sm"
              className="absolute top-2 right-2 shadow-sm"
              aria-label={`Remove ${label}`}
              onClick={onRemove}
            >
              <X className="size-4" />
            </Button>
          ) : null}
        </div>
      ) : (
        <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-black px-3 py-3 text-sm text-black hover:bg-muted/40">
          <Upload className="size-4" />
          Choose file
          <input
            type="file"
            className="hidden"
            accept="image/*,application/pdf"
            disabled={uploading}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              const isImage = file.type.startsWith("image/");
              const url = URL.createObjectURL(file);
              setLocalPreview((prev) => {
                if (prev) URL.revokeObjectURL(prev.url);
                return { url, isImage };
              });
              onUpload(file);
              event.target.value = "";
            }}
          />
        </label>
      )}
    </div>
  );
}

export function BecomeVendorForm() {
  const [formData, setFormData] = useState<FormState>(initialFormState);
  const [currentSection, setCurrentSection] = useState(1);
  const [uploadingField, setUploadingField] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showThankYou, setShowThankYou] = useState(false);
  const [termsChecked, setTermsChecked] = useState(false);
  const [privacyChecked, setPrivacyChecked] = useState(false);

  const patch = (partial: Partial<FormState>) =>
    setFormData((prev) => ({ ...prev, ...partial }));

  const handleUpload = async (
    field: keyof FormState,
    file: File,
  ) => {
    setUploadingField(String(field));
    try {
      const doc = await vendorService.uploadDocument(file);
      patch({ [field]: doc } as Partial<FormState>);
      showSuccess("File uploaded.", { id: `vendor.upload.${String(field)}` });
    } catch (error) {
      showError(toApiError(error).message || "Upload failed.", {
        id: `vendor.upload.error.${String(field)}`,
      });
    } finally {
      setUploadingField("");
    }
  };

  const validateCurrentSection = (): boolean => {
    if (currentSection === 1) {
      if (
        !formData.businessName ||
        !formData.businessType ||
        !formData.industryCategory ||
        !formData.yearOfEstablishment ||
        !formData.legalStructure ||
        !formData.panNumber
      ) {
        showError("Please fill all required business fields.", {
          id: "vendor.form.s1",
        });
        return false;
      }
      if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(formData.panNumber.toUpperCase())) {
        showError("Please enter a valid PAN number.", { id: "vendor.form.pan" });
        return false;
      }
      if (
        formData.isGstRegistered &&
        !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(
          formData.gstNumber.toUpperCase(),
        )
      ) {
        showError("Please enter a valid GST number.", { id: "vendor.form.gst" });
        return false;
      }
    }
    if (currentSection === 2) {
      if (
        !formData.contactPerson ||
        !formData.designation ||
        !formData.mobile ||
        !formData.email ||
        !formData.address ||
        !formData.city ||
        !formData.state ||
        !formData.pincode ||
        !formData.country
      ) {
        showError("Please fill all required contact and address fields.", {
          id: "vendor.form.s2",
        });
        return false;
      }
      if (!/^[6-9]\d{9}$/.test(formData.mobile)) {
        showError("Enter a valid 10-digit mobile number.", {
          id: "vendor.form.mobile",
        });
        return false;
      }
      if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
        showError("Enter a valid email address.", { id: "vendor.form.email" });
        return false;
      }
      if (!/^\d{6}$/.test(formData.pincode)) {
        showError("Enter a valid 6-digit pincode.", { id: "vendor.form.pin" });
        return false;
      }
    }
    if (currentSection === 3) {
      if (!formData.deliveryCapability) {
        showError("Please enter delivery capability.", { id: "vendor.form.s3a" });
        return false;
      }
      if (!formData.panCard || !formData.cancelledCheque || !formData.productCatalog) {
        showError("Please upload required documents (PAN, cheque, catalog).", {
          id: "vendor.form.s3b",
        });
        return false;
      }
    }
    if (currentSection === 4) {
      if (
        !formData.bankName ||
        !formData.accountHolderName ||
        !formData.accountNumber ||
        !formData.ifscCode ||
        !formData.branch
      ) {
        showError("Please fill all bank details.", { id: "vendor.form.s4" });
        return false;
      }
    }
    if (currentSection === 5) {
      if (!formData.returnPolicy) {
        showError("Please enter return policy.", { id: "vendor.form.s5a" });
        return false;
      }
      if (!formData.authorizedPersonPhoto) {
        showError("Please upload authorized person photo.", {
          id: "vendor.form.s5b",
        });
        return false;
      }
    }
    return true;
  };

  const nextSection = () => {
    if (validateCurrentSection()) {
      setCurrentSection((prev) => Math.min(prev + 1, TOTAL_SECTIONS));
    }
  };

  const handleSubmit = async () => {
    if (!validateCurrentSection()) return;
    if (!termsChecked || !privacyChecked) {
      showError("Please accept terms and privacy policy.", {
        id: "vendor.form.terms",
      });
      return;
    }
    if (!formData.panCard || !formData.cancelledCheque || !formData.productCatalog || !formData.authorizedPersonPhoto) {
      showError("Required documents are missing.", { id: "vendor.form.docs" });
      return;
    }

    setIsSubmitting(true);
    try {
      await vendorService.submitApplication({
        businessName: formData.businessName,
        businessType: formData.businessType,
        industryCategory: formData.industryCategory,
        yearOfEstablishment: formData.yearOfEstablishment,
        legalStructure: formData.legalStructure,
        isGstRegistered: formData.isGstRegistered,
        gstNumber: formData.isGstRegistered ? formData.gstNumber.toUpperCase() : null,
        panNumber: formData.panNumber.toUpperCase(),
        msmeNumber: formData.msmeNumber || null,
        gstCertificate: formData.gstCertificate,
        panCard: formData.panCard,
        msmeCertificate: formData.msmeCertificate,
        cancelledCheque: formData.cancelledCheque,
        productCatalog: formData.productCatalog,
        businessCard: formData.businessCard,
        aadhaarUpload: formData.aadhaarUpload,
        authorizedPersonPhoto: formData.authorizedPersonPhoto,
        contactPerson: formData.contactPerson,
        designation: formData.designation,
        mobile: formData.mobile,
        alternateMobile: formData.alternateMobile || null,
        email: formData.email,
        whatsappNumber: formData.whatsappNumber || null,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        pincode: formData.pincode,
        country: formData.country,
        deliveryCapability: formData.deliveryCapability,
        bankName: formData.bankName,
        accountHolderName: formData.accountHolderName,
        accountNumber: formData.accountNumber,
        ifscCode: formData.ifscCode,
        branch: formData.branch,
        qualityCertifications: formData.qualityCertifications || null,
        returnPolicy: formData.returnPolicy,
        aadhaarNumber: formData.aadhaarNumber || null,
        referredBy: formData.referredBy || null,
        additionalNotes: formData.additionalNotes || null,
        website: "",
      });
      setShowThankYou(true);
      setFormData(initialFormState);
      setCurrentSection(1);
      setTermsChecked(false);
      setPrivacyChecked(false);
      showSuccess("Application submitted successfully.", {
        id: "vendor.form.success",
      });
    } catch (error) {
      showError(toApiError(error).message || "Failed to submit application.", {
        id: "vendor.form.error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!showThankYou) {
    return (
      <div className="mx-auto max-w-xl rounded-xl border border-border bg-background p-8 text-center shadow-sm motion-safe:animate-[fade-up_0.55s_ease-out_both] motion-reduce:animate-none">
        <div className="relative mx-auto mb-5 flex size-24 items-center justify-center">
          <span
            className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-500/25 opacity-75 duration-1000 motion-reduce:animate-none"
            aria-hidden
          />
          <span
            className="absolute inline-flex size-20 animate-pulse rounded-full bg-emerald-500/20 duration-700 motion-reduce:animate-none"
            aria-hidden
          />
          <span
            className="absolute inline-flex size-28 animate-pulse rounded-full border border-emerald-500/25 motion-reduce:animate-none"
            aria-hidden
          />
          <div className="relative flex size-16 items-center justify-center rounded-full bg-gradient-to-tr from-emerald-600 to-green-500 text-white shadow-xl shadow-emerald-500/30 ring-4 ring-emerald-50 motion-safe:animate-[vendor-thank-you-heartbeat_1.2s_ease-in-out_infinite] motion-reduce:animate-none">
            <CheckCircle2 className="size-9 stroke-[2.4]" aria-hidden />
          </div>
        </div>
        <h2 className="text-2xl font-semibold">Thank you</h2>
        <p className="mt-2 text-muted-foreground">
          Your vendor application has been received. Our team will review it and
          email you once it is approved.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button asChild variant="outline" className="bg-primary text-white p-6">
            <Link href="/"><HomeIcon className="size-4 mr-2" />Home</Link>
          </Button>
          <Button asChild className="bg-[#f3a827] text-white hover:bg-[#e0981f] p-6">
            <Link href="/vendor/login"><LogInIcon className="size-4 mr-2" />Vendor Login</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl rounded-xl border border-border bg-background p-6 shadow-sm sm:p-8">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-semibold">Become a Vendor</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Apply for a SkinDx Bioceuticals vendor partner account.
        </p>
      </div>

      <div className="mb-8 h-2.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-[#f3a827] transition-all"
          style={{ width: `${(currentSection / TOTAL_SECTIONS) * 100}%` }}
        />
      </div>
      <p className="mb-6 text-center text-xs text-muted-foreground">
        Step {currentSection} of {TOTAL_SECTIONS}
      </p>

      <div className="space-y-6">
        {currentSection === 1 ? (
          <section className="space-y-4">
            <h2 className="text-lg font-medium">Business Information</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Business / Company Name *</Label>
                <Input
                  value={formData.businessName}
                  onChange={(e) => patch({ businessName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Business Type *</Label>
                <Select
                  value={formData.businessType}
                  onValueChange={(value) => patch({ businessType: value })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select business type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manufacturer">Manufacturer</SelectItem>
                    <SelectItem value="wholesaler">Wholesaler</SelectItem>
                    <SelectItem value="distributor">Distributor</SelectItem>
                    <SelectItem value="supplier">Supplier</SelectItem>
                    <SelectItem value="agency">Agency</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Industry / Product Category *</Label>
                <Input
                  value={formData.industryCategory}
                  onChange={(e) => patch({ industryCategory: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Year of Establishment *</Label>
                <Input
                  type="number"
                  min={1900}
                  max={new Date().getFullYear()}
                  value={formData.yearOfEstablishment}
                  onChange={(e) => patch({ yearOfEstablishment: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Legal Structure *</Label>
                <Select
                  value={formData.legalStructure}
                  onValueChange={(value) => patch({ legalStructure: value })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select legal structure" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sole_proprietorship">Sole Proprietorship</SelectItem>
                    <SelectItem value="partnership">Partnership</SelectItem>
                    <SelectItem value="llp">LLP</SelectItem>
                    <SelectItem value="pvt_ltd">Private Limited</SelectItem>
                    <SelectItem value="public_ltd">Public Limited</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>PAN Number *</Label>
                <Input
                  value={formData.panNumber}
                  onChange={(e) =>
                    patch({ panNumber: e.target.value.toUpperCase() })
                  }
                  maxLength={10}
                />
              </div>
              <div className="flex items-center gap-2 md:col-span-2">
                <Checkbox
                  id="gst-registered"
                  checked={formData.isGstRegistered}
                  onCheckedChange={(checked) =>
                    patch({ isGstRegistered: checked === true })
                  }
                />
                <Label htmlFor="gst-registered" className="font-normal">
                  GST registered
                </Label>
              </div>
              {formData.isGstRegistered ? (
                <div className="space-y-2">
                  <Label>GST Number *</Label>
                  <Input
                    value={formData.gstNumber}
                    onChange={(e) =>
                      patch({ gstNumber: e.target.value.toUpperCase() })
                    }
                    maxLength={15}
                  />
                </div>
              ) : null}
              <div className="space-y-2">
                <Label>MSME Number</Label>
                <Input
                  value={formData.msmeNumber}
                  onChange={(e) => patch({ msmeNumber: e.target.value })}
                />
              </div>
            </div>
          </section>
        ) : null}

        {currentSection === 2 ? (
          <section className="space-y-4">
            <h2 className="text-lg font-medium">Contact & Address</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Contact Person *</Label>
                <Input
                  value={formData.contactPerson}
                  onChange={(e) => patch({ contactPerson: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Designation *</Label>
                <Input
                  value={formData.designation}
                  onChange={(e) => patch({ designation: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Mobile *</Label>
                <Input
                  value={formData.mobile}
                  onChange={(e) =>
                    patch({
                      mobile: e.target.value.replace(/\D/g, "").slice(0, 10),
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Alternate Mobile</Label>
                <Input
                  value={formData.alternateMobile}
                  onChange={(e) =>
                    patch({
                      alternateMobile: e.target.value.replace(/\D/g, "").slice(0, 10),
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Email *</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => patch({ email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>WhatsApp Number</Label>
                <Input
                  value={formData.whatsappNumber}
                  onChange={(e) =>
                    patch({
                      whatsappNumber: e.target.value.replace(/\D/g, "").slice(0, 10),
                    })
                  }
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Address *</Label>
                <Textarea
                  value={formData.address}
                  onChange={(e) => patch({ address: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>City *</Label>
                <Input
                  value={formData.city}
                  onChange={(e) => patch({ city: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>State *</Label>
                <Select
                  value={formData.state}
                  onValueChange={(value) => patch({ state: value })}
                >
                  <SelectTrigger className="w-full">
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
              </div>
              <div className="space-y-2">
                <Label>Pincode *</Label>
                <Input
                  value={formData.pincode}
                  onChange={(e) =>
                    patch({
                      pincode: e.target.value.replace(/\D/g, "").slice(0, 6),
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Country *</Label>
                <Input
                  value={formData.country}
                  onChange={(e) => patch({ country: e.target.value })}
                />
              </div>
            </div>
          </section>
        ) : null}

        {currentSection === 3 ? (
          <section className="space-y-4">
            <h2 className="text-lg font-medium">Supply & Documents</h2>
            <div className="space-y-2">
              <Label>Delivery Capability *</Label>
              <Textarea
                value={formData.deliveryCapability}
                onChange={(e) => patch({ deliveryCapability: e.target.value })}
                placeholder="Regions / capacity details"
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <DocumentUploadField
                label="PAN Card"
                required
                value={formData.panCard}
                uploading={uploadingField === "panCard"}
                onUpload={(file) => void handleUpload("panCard", file)}
                onRemove={() => patch({ panCard: null })}
              />
              <DocumentUploadField
                label="Cancelled Cheque"
                required
                value={formData.cancelledCheque}
                uploading={uploadingField === "cancelledCheque"}
                onUpload={(file) => void handleUpload("cancelledCheque", file)}
                onRemove={() => patch({ cancelledCheque: null })}
              />
              <DocumentUploadField
                label="Product Catalog"
                required
                value={formData.productCatalog}
                uploading={uploadingField === "productCatalog"}
                onUpload={(file) => void handleUpload("productCatalog", file)}
                onRemove={() => patch({ productCatalog: null })}
              />
              <DocumentUploadField
                label="GST Certificate"
                value={formData.gstCertificate}
                uploading={uploadingField === "gstCertificate"}
                onUpload={(file) => void handleUpload("gstCertificate", file)}
                onRemove={() => patch({ gstCertificate: null })}
              />
              <DocumentUploadField
                label="MSME Certificate"
                value={formData.msmeCertificate}
                uploading={uploadingField === "msmeCertificate"}
                onUpload={(file) => void handleUpload("msmeCertificate", file)}
                onRemove={() => patch({ msmeCertificate: null })}
              />
              <DocumentUploadField
                label="Business Card"
                value={formData.businessCard}
                uploading={uploadingField === "businessCard"}
                onUpload={(file) => void handleUpload("businessCard", file)}
                onRemove={() => patch({ businessCard: null })}
              />
            </div>
          </section>
        ) : null}

        {currentSection === 4 ? (
          <section className="space-y-4">
            <h2 className="text-lg font-medium">Bank Details</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Bank Name *</Label>
                <Input
                  value={formData.bankName}
                  onChange={(e) => patch({ bankName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Account Holder Name *</Label>
                <Input
                  value={formData.accountHolderName}
                  onChange={(e) => patch({ accountHolderName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Account Number *</Label>
                <Input
                  value={formData.accountNumber}
                  onChange={(e) => patch({ accountNumber: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>IFSC Code *</Label>
                <Input
                  value={formData.ifscCode}
                  onChange={(e) =>
                    patch({ ifscCode: e.target.value.toUpperCase() })
                  }
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Branch *</Label>
                <Input
                  value={formData.branch}
                  onChange={(e) => patch({ branch: e.target.value })}
                />
              </div>
            </div>
          </section>
        ) : null}

        {currentSection === 5 ? (
          <section className="space-y-4">
            <h2 className="text-lg font-medium">Compliance & Verification</h2>
            <div className="space-y-2">
              <Label>Quality Certifications</Label>
              <Textarea
                value={formData.qualityCertifications}
                onChange={(e) => patch({ qualityCertifications: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Return Policy *</Label>
              <Textarea
                value={formData.returnPolicy}
                onChange={(e) => patch({ returnPolicy: e.target.value })}
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Aadhaar Number</Label>
                <Input
                  value={formData.aadhaarNumber}
                  onChange={(e) =>
                    patch({
                      aadhaarNumber: e.target.value.replace(/\D/g, "").slice(0, 12),
                    })
                  }
                />
              </div>
              <DocumentUploadField
                label="Aadhaar Upload"
                value={formData.aadhaarUpload}
                uploading={uploadingField === "aadhaarUpload"}
                onUpload={(file) => void handleUpload("aadhaarUpload", file)}
                onRemove={() => patch({ aadhaarUpload: null })}
              />
              <DocumentUploadField
                label="Authorized Person Photo"
                required
                value={formData.authorizedPersonPhoto}
                uploading={uploadingField === "authorizedPersonPhoto"}
                onUpload={(file) => void handleUpload("authorizedPersonPhoto", file)}
                onRemove={() => patch({ authorizedPersonPhoto: null })}
              />
            </div>
          </section>
        ) : null}

        {currentSection === 6 ? (
          <section className="space-y-4">
            <h2 className="text-lg font-medium">Review & Submit</h2>
            <div className="space-y-2">
              <Label>Referred By</Label>
              <Input
                value={formData.referredBy}
                onChange={(e) => patch({ referredBy: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Additional Notes</Label>
              <Textarea
                value={formData.additionalNotes}
                onChange={(e) => patch({ additionalNotes: e.target.value })}
              />
            </div>
            <div className="space-y-3 rounded-lg border border-border p-4">
              <div className="flex items-start gap-2">
                <Checkbox
                  id="terms"
                  checked={termsChecked}
                  onCheckedChange={(checked) => setTermsChecked(checked === true)}
                />
                <Label htmlFor="terms" className="font-normal leading-snug">
                  I agree to the vendor partnership terms and confirm the information
                  provided is accurate.
                </Label>
              </div>
              <div className="flex items-start gap-2">
                <Checkbox
                  id="privacy"
                  checked={privacyChecked}
                  onCheckedChange={(checked) => setPrivacyChecked(checked === true)}
                />
                <Label htmlFor="privacy" className="font-normal leading-snug">
                  I consent to processing of my business data for onboarding.
                </Label>
              </div>
            </div>
          </section>
        ) : null}

        <div className="flex flex-wrap justify-between gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            className="px-5 py-5 border border-black"
            disabled={currentSection === 1 || isSubmitting}
            onClick={() => setCurrentSection((prev) => Math.max(1, prev - 1))}
          >
            Previous
          </Button>
          {currentSection < TOTAL_SECTIONS ? (
            <Button
              type="button"
              className={cn("bg-[#f3a827] px-5 py-5 border text-md text-white hover:bg-[#e0981f]")}
              onClick={nextSection}
            >
              Next
            </Button>
          ) : (
            <Button
              type="button"
              className="bg-[#f3a827] text-white hover:bg-[#e0981f]"
              disabled={isSubmitting}
              onClick={() => void handleSubmit()}
            >
              {isSubmitting ? "Submitting…" : "Submit application"}
            </Button>
          )}
        </div>

        <p className="text-center text-sm text-muted-foreground">
          Already approved?{" "}
          <Link href="/vendor/login" className="text-[#f3a827] hover:underline">
            Vendor login
          </Link>
        </p>
      </div>
    </div>
  );
}
