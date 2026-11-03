"use client";

import { useCallback, useEffect, useState } from "react";
import { Eye, Filter, MessageSquare } from "lucide-react";

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
import { showError, showSuccess } from "@/lib/toast";
import {
  fetchEnquiries,
  patchEnquiryStatus,
} from "@/services/api/enquiry";
import { ApiError } from "@/services/api/errors";
import type { SiteCode } from "@/types/auth";
import {
  ENQUIRY_STATUSES,
  type EnquiryDto,
  type EnquiryStatus,
} from "@/types/enquiry";

function formatDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function statusLabel(status: EnquiryStatus): string {
  switch (status) {
    case "NEW":
      return "New";
    case "IN_PROGRESS":
      return "In progress";
    case "RESOLVED":
      return "Resolved";
    case "CLOSED":
      return "Closed";
    default:
      return status;
  }
}

function statusVariant(
  status: EnquiryStatus,
): "default" | "secondary" | "outline" | "destructive" {
  if (status === "NEW") return "default";
  if (status === "IN_PROGRESS") return "secondary";
  if (status === "CLOSED") return "outline";
  return "outline";
}

function truncate(value: string, max = 72): string {
  const trimmed = value.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 1)}…`;
}

export function ContactPageEnquiryPage({ siteCode }: { siteCode: SiteCode }) {
  const [enquiries, setEnquiries] = useState<EnquiryDto[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [debouncedName, setDebouncedName] = useState("");
  const [debouncedEmail, setDebouncedEmail] = useState("");
  const [debouncedPhone, setDebouncedPhone] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selected, setSelected] = useState<EnquiryDto | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedName(name.trim());
      setDebouncedEmail(email.trim());
      setDebouncedPhone(phone.trim());
    }, 300);
    return () => window.clearTimeout(timer);
  }, [name, email, phone]);

  const loadEnquiries = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const data = await fetchEnquiries(siteCode, {
        name: debouncedName || undefined,
        email: debouncedEmail || undefined,
        phone: debouncedPhone || undefined,
        from: from ? new Date(`${from}T00:00:00`).toISOString() : undefined,
        to: to ? new Date(`${to}T23:59:59.999`).toISOString() : undefined,
      });
      setEnquiries(data);
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : "Failed to load contact enquiries";
      setLoadError(message);
      showError(message);
    } finally {
      setIsLoading(false);
    }
  }, [siteCode, debouncedName, debouncedEmail, debouncedPhone, from, to]);

  useEffect(() => {
    // Intentional filter-driven enquiry list fetch.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- enquiry list fetch
    void loadEnquiries();
  }, [loadEnquiries]);

  const handleStatusChange = async (status: EnquiryStatus) => {
    if (!selected || selected.status === status) return;

    setIsUpdatingStatus(true);
    try {
      const updated = await patchEnquiryStatus(siteCode, selected.id, {
        status,
      });
      setSelected(updated);
      setEnquiries((current) =>
        current.map((row) => (row.id === updated.id ? updated : row)),
      );
      showSuccess("Enquiry status updated");
    } catch (error) {
      showError(
        error instanceof ApiError
          ? error.message
          : "Failed to update enquiry status",
      );
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  return (
    <AdminAppShell
      siteCode={siteCode}
      title="Contact Page Enquiry"
      description="Enquiries submitted from the storefront Contact Us form."
    >
      <div className="mx-auto w-full max-w-[1400px] space-y-6">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-foreground">
            Contact page enquiries
          </h2>
          <p className="text-sm text-muted-foreground">
            Filter by name, email, phone, or submitted date for{" "}
            {siteCode === "IN" ? ".in" : ".com"}.
          </p>
        </div>

        <Card className="border-border shadow-sm">
          <CardHeader className="border-b border-border/70 pb-5">
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-muted-foreground" />
              <div>
                <CardTitle className="text-base">Filters</CardTitle>
                <CardDescription>
                  Search by contact details and narrow by date range.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4 pt-5 md:grid-cols-2 xl:grid-cols-5">
            <div className="space-y-2">
              <Label htmlFor="enquiry-filter-name">Name</Label>
              <Input
                id="enquiry-filter-name"
                placeholder="Search name"
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="enquiry-filter-email">Email</Label>
              <Input
                id="enquiry-filter-email"
                placeholder="Search email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="enquiry-filter-phone">Number</Label>
              <Input
                id="enquiry-filter-phone"
                placeholder="Search phone"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="enquiry-filter-from">From date</Label>
              <Input
                id="enquiry-filter-from"
                type="date"
                value={from}
                onChange={(event) => setFrom(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="enquiry-filter-to">To date</Label>
              <Input
                id="enquiry-filter-to"
                type="date"
                value={to}
                onChange={(event) => setTo(event.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {loadError ? (
          <Alert variant="destructive">
            <AlertTitle>Unable to load enquiries</AlertTitle>
            <AlertDescription className="flex flex-wrap items-center justify-between gap-3">
              <span>{loadError}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => void loadEnquiries()}
              >
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        ) : null}

        <Card className="border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between gap-3 pb-3">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-base">Enquiries</CardTitle>
            </div>
            <p className="text-sm text-muted-foreground">
              {enquiries.length} result{enquiries.length === 1 ? "" : "s"}
            </p>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="py-10 text-sm text-muted-foreground">
                Loading enquiries…
              </p>
            ) : enquiries.length === 0 ? (
              <p className="py-8 text-sm text-muted-foreground">
                No enquiries found for this filter.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Message</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {enquiries.map((enquiry) => (
                      <TableRow key={enquiry.id}>
                        <TableCell className="font-medium">
                          {enquiry.name}
                        </TableCell>
                        <TableCell>{enquiry.email}</TableCell>
                        <TableCell>{enquiry.phone ?? "—"}</TableCell>
                        <TableCell className="max-w-[280px]">
                          {truncate(enquiry.message)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusVariant(enquiry.status)}>
                            {statusLabel(enquiry.status)}
                          </Badge>
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-muted-foreground">
                          {formatDateTime(enquiry.createdAt)}
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setSelected(enquiry)}
                            >
                              <Eye className="size-3.5" />
                              View
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog
        open={Boolean(selected)}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Enquiry details</DialogTitle>
            <DialogDescription>
              Full contact submission for this site.
            </DialogDescription>
          </DialogHeader>

          {selected ? (
            <div className="space-y-4 py-1">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">
                    Name
                  </p>
                  <p className="text-sm">{selected.name}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">
                    Email
                  </p>
                  <p className="text-sm">{selected.email}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">
                    Phone
                  </p>
                  <p className="text-sm">{selected.phone ?? "—"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">
                    Subject
                  </p>
                  <p className="text-sm">{selected.subject ?? "—"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">
                    Source
                  </p>
                  <p className="text-sm">{selected.source}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">
                    Submitted
                  </p>
                  <p className="text-sm">
                    {formatDateTime(selected.createdAt)}
                  </p>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">
                  Message
                </p>
                <p className="whitespace-pre-wrap rounded-lg border border-border bg-muted/20 p-3 text-sm">
                  {selected.message}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="enquiry-status">Status</Label>
                <Select
                  value={selected.status}
                  disabled={isUpdatingStatus}
                  onValueChange={(value) => {
                    if (
                      value === "NEW" ||
                      value === "IN_PROGRESS" ||
                      value === "RESOLVED" ||
                      value === "CLOSED"
                    ) {
                      void handleStatusChange(value);
                    }
                  }}
                >
                  <SelectTrigger id="enquiry-status" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ENQUIRY_STATUSES.map((status) => (
                      <SelectItem key={status} value={status}>
                        {statusLabel(status)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </AdminAppShell>
  );
}
