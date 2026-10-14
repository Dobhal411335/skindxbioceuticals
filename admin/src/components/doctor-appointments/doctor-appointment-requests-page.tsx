"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
  fetchDoctorAppointments,
  patchDoctorAppointmentStatus,
} from "@/services/api/doctor-appointment";
import { fetchDoctorProfiles } from "@/services/api/doctor-profile";
import { ApiError } from "@/services/api/errors";
import type { SiteCode } from "@/types/auth";
import {
  DOCTOR_APPOINTMENT_STATUSES,
  type DoctorAppointmentDto,
  type DoctorAppointmentStatus,
} from "@/types/doctor-appointment";
import type { DoctorProfileDto } from "@/types/doctor-profile";

function formatDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function statusLabel(status: DoctorAppointmentStatus): string {
  switch (status) {
    case "NEW":
      return "New";
    case "CONTACTED":
      return "Contacted";
    case "CLOSED":
      return "Closed";
    case "CANCELLED":
      return "Cancelled";
    default:
      return status;
  }
}

function statusVariant(
  status: DoctorAppointmentStatus,
): "default" | "secondary" | "outline" | "destructive" {
  if (status === "NEW") return "default";
  if (status === "CONTACTED") return "secondary";
  if (status === "CANCELLED") return "destructive";
  return "outline";
}

export function DoctorAppointmentRequestsPage({
  siteCode,
}: {
  siteCode: SiteCode;
}) {
  const [appointments, setAppointments] = useState<DoctorAppointmentDto[]>([]);
  const [doctors, setDoctors] = useState<DoctorProfileDto[]>([]);
  const [doctorId, setDoctorId] = useState<string>("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selected, setSelected] = useState<DoctorAppointmentDto | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const loadDoctors = useCallback(async () => {
    try {
      const data = await fetchDoctorProfiles(siteCode);
      setDoctors(data);
    } catch {
      setDoctors([]);
    }
  }, [siteCode]);

  const loadAppointments = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const data = await fetchDoctorAppointments(siteCode, {
        doctorId: doctorId === "all" ? undefined : doctorId,
        from: from ? new Date(`${from}T00:00:00`).toISOString() : undefined,
        to: to ? new Date(`${to}T23:59:59.999`).toISOString() : undefined,
      });
      setAppointments(data);
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : "Failed to load appointment requests";
      setLoadError(message);
      showError(message);
    } finally {
      setIsLoading(false);
    }
  }, [siteCode, doctorId, from, to]);

  useEffect(() => {
    // Intentional site-scoped doctor list for filter options.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- doctor filter options
    void loadDoctors();
  }, [loadDoctors]);

  useEffect(() => {
    // Intentional filtered appointment list fetch.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- appointment list fetch
    void loadAppointments();
  }, [loadAppointments]);

  const doctorOptions = useMemo(
    () =>
      [...doctors].sort((left, right) =>
        left.name.localeCompare(right.name, undefined, { sensitivity: "base" }),
      ),
    [doctors],
  );

  const handleStatusChange = async (status: DoctorAppointmentStatus) => {
    if (!selected || selected.status === status) return;

    setIsUpdatingStatus(true);
    try {
      const updated = await patchDoctorAppointmentStatus(
        siteCode,
        selected.id,
        { status },
      );
      setSelected(updated);
      setAppointments((current) =>
        current.map((row) => (row.id === updated.id ? updated : row)),
      );
      showSuccess("Appointment status updated");
    } catch (error) {
      showError(
        error instanceof ApiError
          ? error.message
          : "Failed to update appointment status",
      );
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  return (
    <AdminAppShell
      siteCode={siteCode}
      title="Doctor's Profile Contact Request"
      description="Appointment requests submitted from storefront doctor cards."
    >
      <div className="mx-auto w-full max-w-[1400px] space-y-6">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-foreground">
            Appointment requests
          </h2>
          <p className="text-sm text-muted-foreground">
            Site-scoped requests for {siteCode === "IN" ? ".in" : ".com"}.
          </p>
        </div>

        <Card className="border-border shadow-sm">
          <CardHeader className="border-b border-border/70 pb-5">
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-lg font-semibold">Filters</CardTitle>
            </div>
            <CardDescription>
              Filter by doctor and scheduled date range.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 pt-6 md:grid-cols-4">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="filter-doctor">Doctor</Label>
              <Select value={doctorId} onValueChange={setDoctorId}>
                <SelectTrigger id="filter-doctor" className="w-full">
                  <SelectValue placeholder="All doctors" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All doctors</SelectItem>
                  {doctorOptions.map((doctor) => (
                    <SelectItem key={doctor.id} value={doctor.id}>
                      {doctor.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="filter-from">From</Label>
              <Input
                id="filter-from"
                type="date"
                value={from}
                onChange={(event) => setFrom(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="filter-to">To</Label>
              <Input
                id="filter-to"
                type="date"
                value={to}
                onChange={(event) => setTo(event.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {loadError ? (
          <Alert variant="destructive">
            <AlertTitle>Could not load appointment requests</AlertTitle>
            <AlertDescription className="flex items-center justify-between gap-3">
              <span>{loadError}</span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => void loadAppointments()}
              >
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        ) : null}

        <Card className="overflow-hidden border-border shadow-sm">
          <CardHeader className="border-b border-border/70 pb-5">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-lg font-semibold">Requests</CardTitle>
            </div>
            <CardDescription>
              {isLoading
                ? "Loading…"
                : `${appointments.length} request${appointments.length === 1 ? "" : "s"}`}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="h-64 animate-pulse bg-muted/40" />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Scheduled</TableHead>
                    <TableHead>Doctor</TableHead>
                    <TableHead>Patient</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">View</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {appointments.length > 0 ? (
                    appointments.map((appointment) => (
                      <TableRow key={appointment.id}>
                        <TableCell>
                          {formatDateTime(appointment.scheduledAt)}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium text-foreground">
                              {appointment.doctorName}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {appointment.doctorSpecialization}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>{appointment.patientName}</TableCell>
                        <TableCell>{appointment.email}</TableCell>
                        <TableCell>
                          <Badge variant={statusVariant(appointment.status)}>
                            {statusLabel(appointment.status)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            aria-label="View appointment details"
                            onClick={() => setSelected(appointment)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="py-12 text-center text-muted-foreground"
                      >
                        No appointment requests match the current filters.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
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
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Appointment details</DialogTitle>
            <DialogDescription>
              Full request submitted from the storefront doctors page.
            </DialogDescription>
          </DialogHeader>
          {selected ? (
            <div className="space-y-3 text-sm">
              <DetailRow label="Scheduled" value={formatDateTime(selected.scheduledAt)} />
              <DetailRow label="Doctor" value={selected.doctorName} />
              <DetailRow
                label="Specialization"
                value={selected.doctorSpecialization}
              />
              <DetailRow label="Patient" value={selected.patientName} />
              <DetailRow label="Email" value={selected.email} />
              <div className="grid grid-cols-[120px_1fr] items-center gap-3">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Status
                </p>
                <Select
                  value={selected.status}
                  disabled={isUpdatingStatus}
                  onValueChange={(value) =>
                    void handleStatusChange(value as DoctorAppointmentStatus)
                  }
                >
                  <SelectTrigger
                    id="appointment-status"
                    aria-label="Appointment status"
                    className="w-full"
                  >
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {DOCTOR_APPOINTMENT_STATUSES.map((status) => (
                      <SelectItem key={status} value={status}>
                        {statusLabel(status)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <DetailRow
                label="Submitted"
                value={formatDateTime(selected.createdAt)}
              />
              <div className="space-y-1">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Description
                </p>
                <p className="whitespace-pre-wrap rounded-lg border border-border bg-muted/30 p-3 text-foreground">
                  {selected.problem}
                </p>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </AdminAppShell>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[120px_1fr] gap-3">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="text-foreground">{value}</p>
    </div>
  );
}
