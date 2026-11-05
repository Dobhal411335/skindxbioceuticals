"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Eye, Filter } from "lucide-react";

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
  fetchCareerApplications,
  patchCareerApplicationStatus,
} from "@/services/api/career-application";
import { ApiError } from "@/services/api/errors";
import type { SiteCode } from "@/types/auth";
import {
  CAREER_APPLICATION_STATUSES,
  type CareerApplicationDto,
  type CareerApplicationStatus,
} from "@/types/career-application";

const POSITIONS = [
  "Sales",
  "Marketing",
  "Research",
  "Quality control",
  "Operations",
  "Customer support",
  "Other",
];

function formatDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function statusLabel(status: CareerApplicationStatus): string {
  switch (status) {
    case "PENDING":
      return "Pending";
    case "IN_REVIEW":
      return "In review";
    case "SHORTLISTED":
      return "Shortlisted";
    case "REJECTED":
      return "Rejected";
    case "HIRED":
      return "Hired";
    default:
      return status;
  }
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
        {label}
      </dt>
      <dd className="mt-1 text-sm text-foreground">{value || "—"}</dd>
    </div>
  );
}

export function CareerApplicationsPage({ siteCode }: { siteCode: SiteCode }) {
  const [applications, setApplications] = useState<CareerApplicationDto[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [position, setPosition] = useState("all");
  const [status, setStatus] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<CareerApplicationDto | null>(null);
  const [savingStatus, setSavingStatus] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const rows = await fetchCareerApplications(siteCode, {
        name: name.trim() || undefined,
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        position: position === "all" ? undefined : position,
        status: status === "all" ? undefined : (status as CareerApplicationStatus),
        from: from || undefined,
        to: to || undefined,
      });
      setApplications(rows);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load applications");
    } finally {
      setLoading(false);
    }
  }, [siteCode, name, email, phone, position, status, from, to]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
    }, 250);
    return () => window.clearTimeout(timer);
  }, [load]);

  async function updateStatus(next: CareerApplicationStatus) {
    if (!selected) return;
    setSavingStatus(true);
    try {
      const updated = await patchCareerApplicationStatus(siteCode, selected.id, next);
      setSelected(updated);
      setApplications((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      );
      showSuccess("Application status updated");
    } catch (err) {
      showError(err instanceof ApiError ? err.message : "Failed to update status");
    } finally {
      setSavingStatus(false);
    }
  }

  return (
    <AdminAppShell title="Career Applications" siteCode={siteCode}>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Filter className="size-4" aria-hidden />
              Filter applications
            </CardTitle>
            <CardDescription>
              Search by applicant, contact details, position, status, or date.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="career-filter-name">Name</Label>
              <Input id="career-filter-name" value={name} onChange={(event) => setName(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="career-filter-email">Email</Label>
              <Input id="career-filter-email" value={email} onChange={(event) => setEmail(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="career-filter-phone">Phone</Label>
              <Input id="career-filter-phone" value={phone} onChange={(event) => setPhone(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Position</Label>
              <Select value={position} onValueChange={setPosition}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All positions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All positions</SelectItem>
                  {POSITIONS.map((item) => (
                    <SelectItem key={item} value={item}>
                      {item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  {CAREER_APPLICATION_STATUSES.map((item) => (
                    <SelectItem key={item} value={item}>
                      {statusLabel(item)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="career-filter-from">From</Label>
                <Input id="career-filter-from" type="date" value={from} onChange={(event) => setFrom(event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="career-filter-to">To</Label>
                <Input id="career-filter-to" type="date" value={to} onChange={(event) => setTo(event.target.value)} />
              </div>
            </div>
          </CardContent>
        </Card>

        {error ? (
          <Alert variant="destructive">
            <AlertTitle>Could not load applications</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Applications</CardTitle>
            <CardDescription>
              {loading ? "Loading..." : `${applications.length} application${applications.length === 1 ? "" : "s"}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Applicant</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Applied</TableHead>
                  <TableHead className="text-right">View</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {applications.map((application) => (
                  <TableRow key={application.id}>
                    <TableCell className="font-medium">{application.fullName}</TableCell>
                    <TableCell>{application.email}</TableCell>
                    <TableCell>{application.positionApplied}</TableCell>
                    <TableCell>
                      <Badge variant={application.status === "PENDING" ? "default" : "secondary"}>
                        {statusLabel(application.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDateTime(application.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      <Button type="button" size="sm" variant="outline" className="gap-2" onClick={() => setSelected(application)}>
                        <Eye className="size-4" aria-hidden />
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {!loading && applications.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                      No applications match these filters.
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Dialog open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
          {selected ? (
            <>
              <DialogHeader>
                <DialogTitle>{selected.fullName}</DialogTitle>
                <DialogDescription>
                  Applied {formatDateTime(selected.createdAt)} for {selected.positionApplied}
                </DialogDescription>
              </DialogHeader>
              <dl className="grid gap-4 sm:grid-cols-2">
                <Detail label="Email" value={selected.email} />
                <Detail label="Phone" value={selected.phone} />
                <Detail label="Birth date" value={`${selected.birthDay}/${selected.birthMonth}/${selected.birthYear}`} />
                <Detail label="Available start" value={selected.availableStartDate} />
                <Detail label="Address" value={[selected.streetAddress, selected.streetAddressLine2, selected.city, selected.state, selected.postalCode].filter(Boolean).join(", ")} />
                <Detail label="LinkedIn" value={selected.linkedIn} />
                <Detail label="Heard about us" value={selected.heardAbout} />
                <Detail label="Resume file" value={selected.resumeFileName} />
              </dl>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={selected.status}
                  onValueChange={(value) => void updateStatus(value as CareerApplicationStatus)}
                  disabled={savingStatus}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CAREER_APPLICATION_STATUSES.map((item) => (
                      <SelectItem key={item} value={item}>
                        {statusLabel(item)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="rounded-lg border border-border bg-muted/40 p-4">
                <p className="text-sm font-medium">Resume</p>
                <p className="mt-1 text-sm text-muted-foreground">{selected.resumeFileName}</p>
                <Button type="button" className="mt-3" asChild>
                  <Link href={`/admin/${siteCode.toLowerCase()}/career-applications/${selected.id}/resume`}>
                    View full resume
                  </Link>
                </Button>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </AdminAppShell>
  );
}
