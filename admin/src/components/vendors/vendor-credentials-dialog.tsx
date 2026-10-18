"use client";

import { useState } from "react";
import { Check, Copy, KeyRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { showError, showSuccess } from "@/lib/toast";
import type { VendorGeneratedCredentials } from "@/types/vendors";

async function copyText(value: string, label: string) {
  try {
    await navigator.clipboard.writeText(value);
    showSuccess(`${label} copied`);
  } catch {
    showError(`Could not copy ${label.toLowerCase()}`);
  }
}

function CopyableField({
  label,
  value,
  mono = true,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2">
        <span className={`min-w-0 flex-1 break-all text-sm ${mono ? "font-mono" : ""}`}>
          {value}
        </span>
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
      </div>
    </div>
  );
}

type ConfirmProps = {
  mode: "confirm";
  open: boolean;
  onOpenChange: (open: boolean) => void;
  businessName: string;
  email: string;
  contactPerson?: string;
  confirming: boolean;
  onConfirm: () => void;
};

type RevealProps = {
  mode: "reveal";
  open: boolean;
  onOpenChange: (open: boolean) => void;
  businessName: string;
  credentials: VendorGeneratedCredentials;
  title?: string;
  description?: string;
};

export type VendorCredentialsDialogProps = ConfirmProps | RevealProps;

/**
 * Approve confirmation (email preview) or post-approve / regenerate credential reveal with copy.
 */
export function VendorCredentialsDialog(props: VendorCredentialsDialogProps) {
  if (props.mode === "confirm") {
    return (
      <Dialog open={props.open} onOpenChange={props.onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="size-5" />
              Approve vendor
            </DialogTitle>
            <DialogDescription>
              Approve <span className="font-medium text-foreground">{props.businessName}</span> and
              email login credentials to the contact below.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {props.contactPerson ? (
              <div className="text-sm">
                <span className="text-muted-foreground">Contact: </span>
                {props.contactPerson}
              </div>
            ) : null}
            <CopyableField label="Email" value={props.email} mono={false} />
            <p className="text-xs text-muted-foreground">
              A username and password will be generated, stored (hash for login + plain for admin
              view), and sent to this email.
            </p>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={props.confirming}
              onClick={() => props.onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={props.confirming}
              onClick={() => props.onConfirm()}
            >
              {props.confirming ? "Approving…" : "Approve and send to email"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="size-5" />
            {props.title ?? "Vendor credentials"}
          </DialogTitle>
          <DialogDescription>
            {props.description ?? (
              <>
                Login details for{" "}
                <span className="font-medium text-foreground">{props.businessName}</span>.
              </>
            )}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <CopyableField label="Email" value={props.credentials.email} mono={false} />
          <CopyableField label="Username" value={props.credentials.username} />
          <CopyableField label="Password" value={props.credentials.password} />
        </div>
        <DialogFooter>
          <Button type="button" onClick={() => props.onOpenChange(false)}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
