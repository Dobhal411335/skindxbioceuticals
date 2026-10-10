"use client";

import { RequireAuth } from "@/components/auth/require-auth";
import { SiteSelectorCards } from "@/components/site/site-selector-cards";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";

function SelectSiteContent() {
  const { sites, user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-surface">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-10 sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium tracking-[0.18em] text-primary uppercase">
              SkinDx Bioc Admin
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">Select a website</h1>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground">
              Choose which site workspace to manage. Access is verified by the API using your
              assigned permissions — not the labels on this page.
            </p>
            {user ? (
              <p className="mt-3 text-sm text-muted-foreground">
                Signed in as <span className="font-medium text-foreground">{user.email}</span>
              </p>
            ) : null}
          </div>
          <Button variant="outline" onClick={() => void logout()}>
            Sign out
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
