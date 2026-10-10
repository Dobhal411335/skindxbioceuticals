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
  const [error, setError] = useState<string | null>(null);
  const [statusCode, setStatusCode] = useState<number | null>(null);

  const handleSuccess = async (response: CredentialResponse) => {
    if (!response.credential) {
      setError("Google did not return a valid credential. Please try again.");
      setStatusCode(null);
      return;
    }

    setIsLoading(true);
    setError(null);
    setStatusCode(null);

    try {
      const data = await authService.signInWithGoogle(response.credential);
      dispatch(
        setCredentials({
          user: data.user,
          accessToken: data.accessToken,
        }),
      );

      const redirectTo = getSafeRedirectPath(searchParams.get("redirect"));
      router.replace(redirectTo);
    } catch (err) {
      const apiError = toApiError(err);
      setStatusCode(apiError.statusCode);
      setError(
        getAuthErrorMessage(
          apiError,
          "Unable to sign in with Google. Please try again.",
        ),
      );
    } finally {
      setIsLoading(false);
    }
  };

  const showPasswordHint = statusCode === 409;

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
            setStatusCode(null);
            setError("Google sign-in was cancelled or failed. Please try again.");
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
      {error ? (
        <Alert variant="destructive" className="mt-3" data-testid="google-error">
          <AlertCircle />
          <AlertTitle>
            {statusCode === 409 ? "Account already exists" : "Google sign-in failed"}
          </AlertTitle>
          <AlertDescription>
            <p>{error}</p>
            {showPasswordHint ? (
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
                  <>Use your email and password above, then you can link Google later from account settings.</>
                )}
              </p>
            ) : null}
          </AlertDescription>
        </Alert>
      ) : null}
    </div>
  );
}
