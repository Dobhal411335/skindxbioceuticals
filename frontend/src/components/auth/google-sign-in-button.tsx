"use client";

import Link from "next/link";
import { useState } from "react";
import { GoogleLogin, type CredentialResponse } from "@react-oauth/google";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertCircle } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { getAuthErrorMessage } from "@/features/auth/auth-errors";
import { authService } from "@/features/auth/auth.service";
import { getSafeRedirectPath } from "@/features/auth/auth.validation";
import { useAppDispatch } from "@/hooks/useAppDispatch";
import { showError, showSuccess } from "@/lib/toast";
import { toApiError } from "@/services/api/errors";
import { setCredentials } from "@/store/slices/authSlice";

type GoogleSignInButtonProps = {
  /** Google Identity Services button text mode */
  text?: "signin_with" | "signup_with" | "continue_with" | "signin";
  className?: string;
  /** Where the user is (affects helper links in conflict messages) */
  context?: "login" | "register";
};

/**
 * Reusable Continue-with-Google control.
 * Frontend Google success is incomplete until the backend verifies the ID token
 * and establishes the application session.
 */
export function GoogleSignInButton({
  text = "continue_with",
  className,
  context = "login",
}: GoogleSignInButtonProps) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [conflictError, setConflictError] = useState<string | null>(null);

  const handleSuccess = async (response: CredentialResponse) => {
    if (!response.credential) {
      showError("Google did not return a valid credential. Please try again.", {
        id: "auth.google.error",
      });
      setConflictError(null);
      return;
    }

    setIsLoading(true);
    setConflictError(null);

    try {
      const data = await authService.signInWithGoogle(response.credential);
      dispatch(
        setCredentials({
          user: data.user,
          accessToken: data.accessToken,
        }),
      );

      showSuccess("Signed in with Google.", { id: "auth.google.success" });
      const redirectTo = getSafeRedirectPath(searchParams.get("redirect"));
      router.replace(redirectTo);
    } catch (err) {
      const apiError = toApiError(err);
      const message = getAuthErrorMessage(
        apiError,
        "Unable to sign in with Google. Please try again.",
      );

      // Keep rich inline guidance for account conflicts; toast for other failures.
      if (apiError.statusCode === 409) {
        setConflictError(message);
        return;
      }

      showError(message, { id: "auth.google.error" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={className} data-testid="google-sign-in">
      <div
        className={isLoading ? "pointer-events-none opacity-60" : undefined}
        aria-busy={isLoading}
      >
        <GoogleLogin
          onSuccess={(credentialResponse) => {
            void handleSuccess(credentialResponse);
          }}
          onError={() => {
            setConflictError(null);
            showError("Google sign-in was cancelled or failed. Please try again.", {
              id: "auth.google.error",
            });
          }}
          useOneTap={false}
          text={text}
          shape="pill"
          width="100%"
          theme="outline"
          size="large"
          logo_alignment="left"
        />
      </div>
      {isLoading ? (
        <p className="mt-2 text-center text-xs text-muted-foreground" data-testid="google-loading">
          Completing sign-in…
        </p>
      ) : null}
      {conflictError ? (
        <Alert variant="destructive" className="mt-3" data-testid="google-error">
          <AlertCircle />
          <AlertTitle>Account already exists</AlertTitle>
          <AlertDescription>
            <p>{conflictError}</p>
            <p className="mt-2">
              {context === "register" ? (
                <>
                  Already registered with email and password?{" "}
                  <Link href="/account/login" className="font-medium text-foreground">
                    Sign in here
                  </Link>
                  .
                </>
              ) : (
                <>
                  Use your email and password above, then you can link Google later from
                  account settings.
                </>
              )}
            </p>
          </AlertDescription>
        </Alert>
      ) : null}
    </div>
  );
}
