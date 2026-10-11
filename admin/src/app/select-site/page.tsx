"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { RequireAuth } from "@/components/auth/require-auth";
import { SiteSelectorCards } from "@/components/site/site-selector-cards";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { showSuccess } from "@/lib/toast";

function SelectSiteContent() {
  const { sites, user, logout } = useAuth();
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);

  async function handleSignOut() {
    if (isSigningOut) return;
    setIsSigningOut(true);
    try {
      await logout();
      showSuccess("Signed out successfully.", { id: "admin.auth.logout.success" });
      router.replace("/login");
    } finally {
      setIsSigningOut(false);
    }
  }

  return (
    <div className="min-h-screen bg-surface">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-10 sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium tracking-[0.18em] text-primary uppercase">
              SkinDx Bioc Admin
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
              Select a website
            </h1>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground">
              Choose a workspace to manage. SkinDx.in covers ecommerce operations; SkinDx.com covers
              company information, content, banners, and enquiries. Access is verified by the API
              using your assigned permissions.
            </p>
            {user ? (
              <p className="mt-3 text-sm text-muted-foreground">
                Signed in as <span className="font-medium text-foreground">{user.email}</span>
              </p>
            ) : null}
          </div>
          <Button variant="outline" disabled={isSigningOut} onClick={() => void handleSignOut()}>
            {isSigningOut ? "Signing out…" : "Sign out"}
          </Button>
        </div>

        <SiteSelectorCards sites={sites} />
      </div>
    </div>
  );
}

export default function SelectSitePage() {
  return (
    <RequireAuth>
      <SelectSiteContent />
    </RequireAuth>
  );
}
