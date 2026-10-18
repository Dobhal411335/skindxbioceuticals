"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, Copy, Eye, EyeOff, Filter, KeyRound } from "lucide-react";

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
  fetchVendorCredentials,
  patchVendorCredentialActive,
  regenerateVendorPassword,
} from "@/services/api/vendors";
import type { SiteCode } from "@/types/auth";
import type { VendorCredential, VendorGeneratedCredentials } from "@/types/vendors";

async function copyText(value: string, label: string) {
  try {
    await navigator.clipboard.writeText(value);
    showSuccess(`${label} copied`);
  } catch {
    showError(`Could not copy ${label.toLowerCase()}`);
  }
}

function CopyIconButton({
  value,
  label,
}: {
  value: string;
  label: string;
}) {
  const [copied, setCopied] = useState(false);
  if (!value) return null;
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      aria-label={`Copy ${label}`}
      onClick={() => {
        void copyText(value, label).then(() => {
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1500);
        });
      }}
    >
      {copied ? <Check className="size-4 text-emerald-600" /> : <Copy className="size-4" />}
    </Button>
  );
}

export function VendorLoginDetailsPage({ siteCode }: { siteCode: SiteCode }) {
  const [rows, setRows] = useState<VendorCredential[]>([]);
  const [q, setQ] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "true" | "false">("all");
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [revealPayload, setRevealPayload] = useState<{
    businessName: string;
    credentials: VendorGeneratedCredentials;
  } | null>(null);
  const [revealOpen, setRevealOpen] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const data = await fetchVendorCredentials(siteCode, {
        q: q.trim() || undefined,
        isActive: activeFilter,
      });
      setRows(data);
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : "Failed to load vendor credentials";
      setLoadError(message);
      showError(message);
    } finally {
      setIsLoading(false);
    }
  }, [siteCode, q, activeFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  const toggleReveal = (id: string) => {
    setRevealed((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleActiveToggle = async (row: VendorCredential, isActive: boolean) => {
    setBusyId(row.id);
    try {
      const updated = await patchVendorCredentialActive(siteCode, row.id, isActive);
      setRows((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      showSuccess(isActive ? "Vendor account activated" : "Vendor account deactivated");
    } catch (error) {
      showError(
        error instanceof ApiError ? error.message : "Failed to update account status",
      );
    } finally {
      setBusyId(null);
    }
  };

  const handleRegenerate = async (row: VendorCredential) => {
    setBusyId(row.id);
    try {
      const result = await regenerateVendorPassword(siteCode, row.id);
      setRows((current) =>
        current.map((item) => (item.id === result.credential.id ? result.credential : item)),
      );
      setRevealed((prev) => ({ ...prev, [row.id]: true }));
      if (result.emailSent) {
        showSuccess("Vendor password regenerated and credentials are sent via email");
      } else {
        showSuccess(
          "Password regenerated. Email could not be sent — copy credentials below.",
        );
      }
      setRevealPayload({
        businessName: result.credential.businessName,
        credentials: {
          username: result.credential.username,
          password: result.credential.passwordPlain,
          email: result.credential.email,
        },
      });
      setRevealOpen(true);
    } catch (error) {
      showError(
        error instanceof ApiError ? error.message : "Failed to regenerate password",
      );
    } finally {
      setBusyId(null);
    }
  };

  return (
    <AdminAppShell
      siteCode={siteCode}
      title="Vendor Partner Login Details"
      description="Active vendor usernames and passwords for partner login."
    >
      <div className="mx-auto w-full max-w-[1400px] space-y-6">
        <Card className="border-border shadow-sm">
          <CardHeader className="border-b border-border/70 pb-5">
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-lg font-semibold">Filters</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4 pt-6 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Account status</Label>
              <Select
                value={activeFilter}
                onValueChange={(value) =>
                  setActiveFilter(value as "all" | "true" | "false")
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="true">Active</SelectItem>
                  <SelectItem value="false">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="cred-q">Search</Label>
              <Input
                id="cred-q"
                placeholder="Username, business, email…"
                value={q}
                onChange={(event) => setQ(event.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {loadError ? (
          <Alert variant="destructive">
            <AlertTitle>Could not load credentials</AlertTitle>
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
              <KeyRound className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-lg font-semibold">Login details</CardTitle>
            </div>
            <CardDescription>
              {isLoading
                ? "Loading…"
                : `${rows.length} vendor account${rows.length === 1 ? "" : "s"}`}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="h-64 animate-pulse bg-muted/40" />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">S.No</TableHead>
                    <TableHead>Business</TableHead>
                    <TableHead>Username</TableHead>
                    <TableHead>Password</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                        No approved vendor credentials yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    rows.map((row, index) => {
                      const showPlain = Boolean(revealed[row.id]);
                      return (
                        <TableRow key={row.id}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell>
                            <div className="font-medium">{row.businessName}</div>
                            <div className="text-xs text-muted-foreground">{row.email}</div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <span className="font-mono text-sm">{row.username}</span>
                              <CopyIconButton value={row.username} label="Username" />
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <span className="font-mono text-sm">
                                {showPlain ? row.passwordPlain || "—" : "••••••••"}
                              </span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon-sm"
                                aria-label={showPlain ? "Hide password" : "Show password"}
                                onClick={() => toggleReveal(row.id)}
                              >
                                {showPlain ? (
                                  <EyeOff className="size-4" />
                                ) : (
                                  <Eye className="size-4" />
                                )}
                              </Button>
                              {row.passwordPlain ? (
                                <CopyIconButton
                                  value={row.passwordPlain}
                                  label="Password"
                                />
                              ) : null}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={row.isActive ? "default" : "secondary"}>
                              {row.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Select
                                value={row.isActive ? "active" : "inactive"}
                                disabled={busyId === row.id}
                                onValueChange={(value) =>
                                  void handleActiveToggle(row, value === "active")
                                }
                              >
                                <SelectTrigger className="w-[120px]">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="active">Active</SelectItem>
                                  <SelectItem value="inactive">Inactive</SelectItem>
                                </SelectContent>
                              </Select>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={busyId === row.id}
                                onClick={() => void handleRegenerate(row)}
                              >
                                Regenerate
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {revealPayload ? (
        <VendorCredentialsDialog
          mode="reveal"
          open={revealOpen}
          onOpenChange={(open) => {
            setRevealOpen(open);
            if (!open) setRevealPayload(null);
          }}
          businessName={revealPayload.businessName}
          credentials={revealPayload.credentials}
          title="Password regenerated"
          description="Copy the new credentials if needed. They were emailed to the vendor when sending succeeded."
        />
      ) : null}
    </AdminAppShell>
  );
}
