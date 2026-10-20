"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";

import { AppointmentDateTimePicker } from "@/components/doctors/appointment-datetime-picker";
import { Button } from "@/components/ui/button";
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
import { Textarea } from "@/components/ui/textarea";
import { createDoctorAppointment } from "@/features/doctors/create-doctor-appointment";
import { showError, showSuccess } from "@/lib/toast";
import { toApiError } from "@/services/api/errors";
import { formatDoctorDisplayName, type DoctorProfile } from "@/types/doctors";

type DoctorAppointmentModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  doctors: DoctorProfile[];
  initialDoctorId: string | null;
};

type FormErrors = Partial<
  Record<
    | "patientName"
    | "email"
    | "phone"
    | "doctorId"
    | "scheduledAt"
    | "problem",
    string
  >
>;

export function DoctorAppointmentModal({
  open,
  onOpenChange,
  doctors,
  initialDoctorId,
}: DoctorAppointmentModalProps) {
  const [patientName, setPatientName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [doctorId, setDoctorId] = useState(initialDoctorId ?? "");
  const [scheduledAt, setScheduledAt] = useState<Date | null>(null);
  const [problem, setProblem] = useState("");
  const [website, setWebsite] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setDoctorId(initialDoctorId ?? doctors[0]?.id ?? "");
    setPatientName("");
    setEmail("");
    setPhone("");
    setScheduledAt(null);
    setProblem("");
    setWebsite("");
    setErrors({});
  }, [open, initialDoctorId, doctors]);

  const selectedDoctor = useMemo(
    () => doctors.find((doctor) => doctor.id === doctorId) ?? null,
    [doctors, doctorId],
  );

  const validate = (): boolean => {
    const next: FormErrors = {};
    if (!patientName.trim()) next.patientName = "Name is required";
    if (!email.trim()) next.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      next.email = "Enter a valid email";
    }

    const cleanPhoneDigits = phone.trim().replace(/[\s-]/g, "");
    if (!cleanPhoneDigits) {
      next.phone = "Phone number is required";
    } else if (!/^[0-9]{7,15}$/.test(cleanPhoneDigits)) {
      next.phone = "Enter a valid phone number";
    }

    if (!doctorId) next.doctorId = "Choose a doctor";
    if (!scheduledAt) next.scheduledAt = "Choose date and time";
    if (!problem.trim()) next.problem = "Please describe your problem";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validate() || !scheduledAt) return;

    setSubmitting(true);
    try {
      const cleanPhoneDigits = phone.trim().replace(/^\+?91\s*/, "");
      const fullPhone = `+91 ${cleanPhoneDigits}`;
      await createDoctorAppointment({
        doctorId,
        patientName: patientName.trim(),
        email: email.trim(),
        phone: fullPhone,
        scheduledAt: scheduledAt.toISOString(),
        problem: problem.trim(),
        website: website || undefined,
      });
      showSuccess(
        "Booking received! We will shortly notify you via email regarding confirmation.",
        {
          id: "doctor.appointment.success",
        },
      );
      onOpenChange(false);
    } catch (error) {
      const apiErr = toApiError(error);
      const fieldErrors =
        apiErr.details &&
        typeof apiErr.details === "object" &&
        "fieldErrors" in (apiErr.details as Record<string, unknown>)
          ? (apiErr.details as { fieldErrors?: Record<string, string[]> })
              .fieldErrors
          : undefined;

      const firstMessage = fieldErrors
        ? Object.values(fieldErrors).flat()[0]
        : null;

      showError(
        firstMessage || apiErr.message || "Could not submit appointment request",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton
        className="max-h-[90vh] overflow-y-auto p-0 sm:max-w-4xl"
      >
        <div className="grid md:grid-cols-[0.9fr_1.1fr]">
          <div className="relative hidden min-h-[420px] overflow-hidden md:block">
            {selectedDoctor?.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- CMS Cloudinary URL
              <img
                src={selectedDoctor.photoUrl}
                alt=""
                className="absolute inset-0 size-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-muted to-background" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
            {selectedDoctor ? (
              <div className="absolute inset-x-0 bottom-0 p-6 text-white">
                <p className="text-lg font-semibold">{selectedDoctor.name}</p>
                <p className="text-sm text-white/85">
                  {selectedDoctor.specialization}
                </p>
              </div>
            ) : null}
          </div>

          <div className="p-6 md:p-8">
            <DialogHeader className="mb-5 space-y-1 text-left">
              <p className="text-sm font-medium text-primary">Make an appointment</p>
              <DialogTitle className="text-2xl font-bold tracking-tight text-foreground">
                Book a consultation with SkinDx clinicians
              </DialogTitle>
              <DialogDescription>
                Share a few details and your preferred time. Our team will follow up
                to confirm.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={(event) => void handleSubmit(event)} className="space-y-4">
              {/* Honeypot — hidden from users */}
              <input
                type="text"
                name="website"
                value={website}
                onChange={(event) => setWebsite(event.target.value)}
                tabIndex={-1}
                autoComplete="off"
                className="absolute left-[-9999px] h-0 w-0 opacity-0"
                aria-hidden
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="appointment-name">Name*</Label>
                  <Input
                    id="appointment-name"
                    value={patientName}
                    placeholder="Name*"
                    className="h-11 rounded-xl"
                    onChange={(event) => setPatientName(event.target.value)}
                  />
                  {errors.patientName ? (
                    <p className="text-sm text-destructive">{errors.patientName}</p>
                  ) : null}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="appointment-email">Email*</Label>
                  <Input
                    id="appointment-email"
                    type="email"
                    value={email}
                    placeholder="Your email*"
                    className="h-11 rounded-xl"
                    onChange={(event) => setEmail(event.target.value)}
                  />
                  {errors.email ? (
                    <p className="text-sm text-destructive">{errors.email}</p>
                  ) : null}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="appointment-phone">Phone number*</Label>
                  <div className="flex h-11 overflow-hidden rounded-xl border border-input bg-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
                    <span className="flex select-none items-center justify-center border-r border-input bg-muted/60 px-3.5 text-sm font-medium text-muted-foreground">
                      +91
                    </span>
                    <Input
                      id="appointment-phone"
                      type="tel"
                      value={phone}
                      placeholder="98765 43210"
                      className="h-full flex-1 rounded-none border-0 px-3 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
                      onChange={(event) =>
                        setPhone(event.target.value.replace(/[^0-9\s-]/g, ""))
                      }
                    />
                  </div>
                  {errors.phone ? (
                    <p className="text-sm text-destructive">{errors.phone}</p>
                  ) : null}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="appointment-doctor">Doctor*</Label>
                  <Select value={doctorId} onValueChange={setDoctorId}>
                    <SelectTrigger
                      id="appointment-doctor"
                      className="h-15 w-full rounded"
                    >
                      <SelectValue placeholder="Choose Doctor..." />
                    </SelectTrigger>
                    <SelectContent>
                      {doctors.map((doctor) => (
                        <SelectItem key={doctor.id} value={doctor.id}>
                          {formatDoctorDisplayName(doctor.name)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.doctorId ? (
                    <p className="text-sm text-destructive">{errors.doctorId}</p>
                  ) : null}
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>Date &amp; time*</Label>
                  <AppointmentDateTimePicker
                    value={scheduledAt}
                    onChange={setScheduledAt}
                    disabled={submitting}
                  />
                  {errors.scheduledAt ? (
                    <p className="text-sm text-destructive">{errors.scheduledAt}</p>
                  ) : null}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="appointment-problem">Describe your problem</Label>
                <Textarea
                  id="appointment-problem"
                  rows={4}
                  value={problem}
                  placeholder="Describe Your Problem"
                  className="rounded-xl"
                  onChange={(event) => setProblem(event.target.value)}
                />
                {errors.problem ? (
                  <p className="text-sm text-destructive">{errors.problem}</p>
                ) : null}
              </div>

              <Button
                type="submit"
                disabled={submitting || doctors.length === 0}
                className="h-12 w-full rounded-full text-base"
              >
                {submitting ? "Submitting…" : "Make an Appointment"}
                {!submitting ? <Plus className="size-4" aria-hidden /> : null}
              </Button>
            </form>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
