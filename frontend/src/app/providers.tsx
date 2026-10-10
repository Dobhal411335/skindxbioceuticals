"use client";

import type { ReactNode } from "react";
import { GoogleOAuthProvider } from "@react-oauth/google";

import { AuthBootstrap } from "@/components/auth/auth-bootstrap";
import { env } from "@/config/env";
import { StoreProvider } from "@/store/provider";

type ProvidersProps = {
  children: ReactNode;
};

export function Providers({ children }: ProvidersProps) {
  return (
    <GoogleOAuthProvider clientId={env.googleClientId}>
      <StoreProvider>
        <AuthBootstrap />
        {children}
      </StoreProvider>
    </GoogleOAuthProvider>
  );
}
