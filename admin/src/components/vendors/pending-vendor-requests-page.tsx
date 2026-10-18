"use client";

import { useCallback, useEffect, useState } from "react";
import { Eye, FileText, Filter, Handshake } from "lucide-react";

import { AdminAppShell } from "@/components/layout/admin-app-shell";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { VendorCredentialsDialog } from "@/components/vendors/vendor-credentials-dialog";
import { showError, showSuccess } from "@/lib/toast";
import { ApiError } from "@/services/api/errors";
import {
  fetchVendorApplication,
  fetchVendorApplications,
  patchVendorApplicationStatus,
} from "@/services/api/vendors";
import type { SiteCode } from "@/types/auth";
import type {
  VendorApplicationDetail,
  VendorApplicationListItem,
  VendorApplicationStatus,
  VendorDocumentRef,
  VendorGeneratedCredentials,
} from "@/types/vendors";

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-3 gap-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="col-span-2 break-words text-foreground">
        {value == null || value === "" ? "—" : value}
      </span>
    </div>
  );
}

function isLikelyPdfUrl(url: string): boolean {
  return /\.pdf(\?|$)/i.test(url) || url.includes("/raw/upload/");
}

function DocPreview({
  label,
  doc,
}: {
  label: string;
  doc: VendorDocumentRef | null;
}) {
  if (!doc?.url) {
    return (
      <div className="space-y-1.5">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <div className="flex aspect-[4/3] items-center justify-center rounded-lg border border-dashed border-border bg-muted/20 text-xs text-muted-foreground">
          Not uploaded
        </div>
      </div>
    );
  }

  const isPdf = isLikelyPdfUrl(doc.url);

  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <a
        href={doc.url}
        target="_blank"
        rel="noreferrer"
        className="relative block aspect-[4/3] overflow-hidden rounded-lg border border-border bg-muted/30 transition-opacity hover:opacity-90"
      >
        {isPdf ? (
          <div className="flex size-full flex-col items-center justify-center gap-2 text-muted-foreground">
            <FileText className="size-8" />
            <span className="text-xs">Open PDF</span>
          </div>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element -- Cloudinary vendor document URLs
          <img
            src={doc.url}
            alt={label}
            className="size-full object-contain"
          />
        )}
      </a>
    </div>
  );
}

function formatDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function PendingVendorRequestsPage({ siteCode }: { siteCode: SiteCode }) {
  const [rows, setRows] = useState<VendorApplicationListItem[]>([]);
  const [statusFilter, setStatusFilter] = useState<VendorApplicationStatus | "all">(
    "PENDING",
  );
  const [q, setQ] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [detail, setDetail] = useState<VendorApplicationDetail | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [approveTarget, setApproveTarget] =
    useState<VendorApplicationListItem | null>(null);
  const [approveConfirmOpen, setApproveConfirmOpen] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [revealedCredentials, setRevealedCredentials] = useState<{
    businessName: string;
    credentials: VendorGeneratedCredentials;
  } | null>(null);
  const [revealOpen, setRevealOpen] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const data = await fetchVendorApplications(siteCode, {
        status: statusFilter,
        q: q.trim() || undefined,
      });
      setRows(data);
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : "Failed to load vendor applications";
      setLoadError(message);
      showError(message);
    } finally {
      setIsLoading(false);
    }
  }, [siteCode, statusFilter, q]);

  useEffect(() => {
    void load();
  }, [load]);

  const openDetail = async (id: string) => {
    try {
      const data = await fetchVendorApplication(siteCode, id);
      setDetail(data);
      setDetailOpen(true);
    } catch (error) {
      showError(
        error instanceof ApiError ? error.message : "Failed to load application detail",
      );
    }
  };

  const handleStatusChange = async (
    row: VendorApplicationListItem,
    status: VendorApplicationStatus,
  ) => {
    if (status === "APPROVED") {
      setApproveTarget(row);
      setApproveConfirmOpen(true);
      return;
    }

    setUpdatingId(row.id);
    try {
      await patchVendorApplicationStatus(siteCode, row.id, { status });
      showSuccess(`Status updated to ${status.toLowerCase()}`);
      await load();
      if (detail?.id === row.id) {
        const refreshed = await fetchVendorApplication(siteCode, row.id);
        setDetail(refreshed);
      }
    } catch (error) {
      showError(
        error instanceof ApiError ? error.message : "Failed to update status",
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const handleApproveAndSend = async () => {
    if (!approveTarget) return;
    setIsApproving(true);
    setUpdatingId(approveTarget.id);
    try {
      const result = await patchVendorApplicationStatus(siteCode, approveTarget.id, {
        status: "APPROVED",
      });
      const applicationId = approveTarget.id;
      const businessName = approveTarget.businessName;
      setApproveConfirmOpen(false);
      setApproveTarget(null);
      if (result.emailSent) {
        showSuccess("Vendor is approved and credentials are sent via email");
      } else {
        showSuccess(
          "Vendor is approved. Email could not be sent — copy credentials below.",
        );
      }
      if (result.credentials) {
        setRevealedCredentials({
          businessName,
          credentials: result.credentials,
        });
        setRevealOpen(true);
      }
      await load();
      if (detail?.id === applicationId) {
        setDetail(result.application);
      }
    } catch (error) {
      showError(
        error instanceof ApiError ? error.message : "Failed to approve vendor",
      );
    } finally {
      setIsApproving(false);
      setUpdatingId(null);
    }
  };

  return (
    <AdminAppShell
      siteCode={siteCode}
      title="Pending Vendor Request"
      description="Review and approve vendor partner applications."
    >
      <div className="mx-auto w-full max-w-[1400px] space-y-6">
        <Card className="border-border shadow-sm">
          <CardHeader className="border-b border-border/70 pb-5">
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-lg font-semibold">Filters</CardTitle>
            </div>
            <CardDescription>Filter by status and search business details.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 pt-6 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={statusFilter}
                onValueChange={(value) =>
                  setStatusFilter(value as VendorApplicationStatus | "all")
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="APPROVED">Approved</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="vendor-q">Search</Label>
              <Input
                id="vendor-q"
                placeholder="Business name, contact, GST, mobile…"
                value={q}
                onChange={(event) => setQ(event.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {loadError ? (
          <Alert variant="destructive">
            <AlertTitle>Could not load applications</AlertTitle>
            <AlertDescription className="flex items-center justify-between gap-3">
              <span>{loadError}</span>
              <Button type="button" variant="outline" size="sm" onClick={() => void load()}>
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        ) : null}

        <Card className="overflow-hidden border-border shadow-sm">
          <CardHeader className="border-b border-border/70 pb-5">
            <div className="flex items-center gap-2">
              <Handshake className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-lg font-semibold">Vendor applications</CardTitle>
            </div>
            <CardDescription>
              {isLoading ? "Loading…" : `${rows.length} application${rows.length === 1 ? "" : "s"}`}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="h-64 animate-pulse bg-muted/40" />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow >
                    <TableHead className="w-16">S.No</TableHead>
                    <TableHead>Business Name</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>GST Number</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                        No vendor applications found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    rows.map((row, index) => (
                      <TableRow key={row.id}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell className="font-medium">{row.businessName}</TableCell>
                        <TableCell>
                          <div className="text-sm">{row.contactPerson}</div>
                          <div className="text-xs text-muted-foreground">{row.mobile}</div>
                          <div className="text-xs text-muted-foreground">{row.email}</div>
                        </TableCell>
                        <TableCell>{row.gstNumber || "—"}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{row.status}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => void openDetail(row.id)}
                            >
                              <Eye className="mr-1 size-4" />
                              View
                            </Button>
                            <Select
                              value={row.status}
                              disabled={updatingId === row.id}
                              onValueChange={(value) =>
                                void handleStatusChange(
                                  row,
                                  value as VendorApplicationStatus,
                                )
                              }
                            >
                              <SelectTrigger className="w-[140px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="PENDING">Pending</SelectItem>
                                <SelectItem value="APPROVED">Approved</SelectItem>
                                <SelectItem value="REJECTED">Rejected</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <VendorCredentialsDialog
        mode="confirm"
        open={approveConfirmOpen}
        onOpenChange={(open) => {
          setApproveConfirmOpen(open);
          if (!open) setApproveTarget(null);
        }}
        businessName={approveTarget?.businessName ?? ""}
        email={approveTarget?.email ?? ""}
        contactPerson={approveTarget?.contactPerson}
        confirming={isApproving}
        onConfirm={() => void handleApproveAndSend()}
      />

      {revealedCredentials ? (
        <VendorCredentialsDialog
          mode="reveal"
          open={revealOpen}
          onOpenChange={(open) => {
            setRevealOpen(open);
            if (!open) setRevealedCredentials(null);
          }}
          businessName={revealedCredentials.businessName}
          credentials={revealedCredentials.credentials}
          title="Vendor approved"
          description="Copy these credentials if needed. They were emailed to the vendor when sending succeeded."
        />
      ) : null}

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="flex max-h-[90vh] max-w-5xl flex-col gap-0 overflow-hidden p-0 sm:max-w-5xl">
          <DialogHeader className="shrink-0 border-b border-border px-6 py-4">
            <DialogTitle>{detail?.businessName ?? "Vendor application"}</DialogTitle>
            <DialogDescription>
              Full application details and uploaded documents.
            </DialogDescription>
          </DialogHeader>
          {detail ? (
            <div className="grid min-h-0 flex-1 gap-0 overflow-y-auto lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
              <div className="space-y-5 border-b border-border px-6 py-5 lg:border-r lg:border-b-0">
                <section className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold">Status</h3>
                    <Badge variant="secondary">{detail.status}</Badge>
                    <Badge variant={detail.isActive ? "default" : "outline"}>
                      {detail.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <InfoRow label="Submitted" value={formatDateTime(detail.createdAt)} />
                  <InfoRow label="Updated" value={formatDateTime(detail.updatedAt)} />
                  <InfoRow label="Username" value={detail.username} />
                  <InfoRow label="User ID" value={detail.userId} />
                  <InfoRow label="Admin notes" value={detail.notes} />
                </section>

                <section className="space-y-2">
                  <h3 className="font-semibold">Business</h3>
                  <InfoRow label="Business name" value={detail.businessName} />
                  <InfoRow label="Type" value={detail.businessType} />
                  <InfoRow label="Industry" value={detail.industryCategory} />
                  <InfoRow label="Established" value={detail.yearOfEstablishment} />
                  <InfoRow label="Legal structure" value={detail.legalStructure} />
                  <InfoRow
                    label="GST registered"
                    value={detail.isGstRegistered ? "Yes" : "No"}
                  />
                  <InfoRow label="PAN" value={detail.panNumber} />
                  <InfoRow label="GST" value={detail.gstNumber} />
                  <InfoRow label="MSME" value={detail.msmeNumber} />
                </section>

                <section className="space-y-2">
                  <h3 className="font-semibold">Contact</h3>
                  <InfoRow label="Person" value={detail.contactPerson} />
                  <InfoRow label="Designation" value={detail.designation} />
                  <InfoRow label="Mobile" value={detail.mobile} />
                  <InfoRow label="Alternate mobile" value={detail.alternateMobile} />
                  <InfoRow label="Email" value={detail.email} />
                  <InfoRow label="WhatsApp" value={detail.whatsappNumber} />
                </section>

                <section className="space-y-2">
                  <h3 className="font-semibold">Address</h3>
                  <InfoRow label="Address" value={detail.address} />
                  <InfoRow label="City" value={detail.city} />
                  <InfoRow label="State" value={detail.state} />
                  <InfoRow label="Pincode" value={detail.pincode} />
                  <InfoRow label="Country" value={detail.country} />
                </section>

                <section className="space-y-2">
                  <h3 className="font-semibold">Bank</h3>
                  <InfoRow label="Bank" value={detail.bankName} />
                  <InfoRow label="Holder" value={detail.accountHolderName} />
                  <InfoRow label="Account" value={detail.accountNumber} />
                  <InfoRow label="IFSC" value={detail.ifscCode} />
                  <InfoRow label="Branch" value={detail.branch} />
                </section>

                <section className="space-y-2">
                  <h3 className="font-semibold">Supply & compliance</h3>
                  <InfoRow label="Delivery" value={detail.deliveryCapability} />
                  <InfoRow label="Return policy" value={detail.returnPolicy} />
                  <InfoRow
                    label="Certifications"
                    value={detail.qualityCertifications}
                  />
                  <InfoRow label="Aadhaar" value={detail.aadhaarNumber} />
                  <InfoRow label="Referred by" value={detail.referredBy} />
                  <InfoRow label="Additional notes" value={detail.additionalNotes} />
                </section>
              </div>

              <div className="space-y-3 px-6 py-5">
                <h3 className="font-semibold">Documents</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <DocPreview label="PAN Card" doc={detail.panCard} />
                  <DocPreview label="GST Certificate" doc={detail.gstCertificate} />
                  <DocPreview label="Cancelled Cheque" doc={detail.cancelledCheque} />
                  <DocPreview label="Product Catalog" doc={detail.productCatalog} />
                  <DocPreview
                    label="Authorized Photo"
                    doc={detail.authorizedPersonPhoto}
                  />
                  <DocPreview label="MSME Certificate" doc={detail.msmeCertificate} />
                  <DocPreview label="Business Card" doc={detail.businessCard} />
                  <DocPreview label="Aadhaar Upload" doc={detail.aadhaarUpload} />
                </div>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </AdminAppShell>
  );
}
