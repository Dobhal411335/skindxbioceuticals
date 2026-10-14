"use client";

import { useRef, useState } from "react";
import { Eye, EyeOff, Upload } from "lucide-react";

import { UserAvatar } from "@/components/account/user-avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getUserDisplayName, isValidImageUrl } from "@/features/auth/auth-user";
import { authService } from "@/features/auth/auth.service";
import { strongPasswordSchema } from "@/features/auth/auth.validation";
import { meService } from "@/features/me/me.service";
import { useAppDispatch } from "@/hooks/useAppDispatch";
import { useAuth } from "@/hooks/useAuth";
import { showError, showSuccess } from "@/lib/toast";
import { toApiError } from "@/services/api/errors";
import { setCredentials } from "@/store/slices/authSlice";
import type { AuthUser } from "@/types/auth";
import { z } from "zod";

const profileSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required").max(100),
  lastName: z.string().trim().max(100).optional().or(z.literal("")),
});

const MAX_AVATAR_BYTES = 10 * 1024 * 1024;
const ALLOWED_AVATAR_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export function AccountDetailsView() {
  const { user, accessToken } = useAuth();
  const dispatch = useAppDispatch();
  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const [firstName, setFirstName] = useState(user?.firstName ?? "");
  const [lastName, setLastName] = useState(user?.lastName ?? "");
  const [profileSaving, setProfileSaving] = useState(false);
  const [avatarSaving, setAvatarSaving] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordFieldErrors, setPasswordFieldErrors] = useState<Record<string, string>>(
    {},
  );

  if (!user) {
    return null;
  }

  const hasPassword = Boolean(user.hasPassword);
  const createdAt = user.createdAt
    ? new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(
        new Date(user.createdAt),
      )
    : null;

  const applyUpdatedUser = (nextUser: AuthUser) => {
    if (!accessToken) return;
    dispatch(
      setCredentials({
        user: nextUser,
        accessToken,
      }),
    );
  };

  const saveProfile = async () => {
    const parsed = profileSchema.safeParse({ firstName, lastName });
    if (!parsed.success) {
      showError(parsed.error.issues[0]?.message ?? "Invalid profile details.", {
        id: "account.profile.error",
      });
      return;
    }

    setProfileSaving(true);
    try {
      const result = await meService.updateProfile({
        firstName: parsed.data.firstName,
        lastName: parsed.data.lastName || null,
      });
      applyUpdatedUser(result.user);
      showSuccess("Profile updated.", { id: "account.profile.success" });
    } catch (err) {
      showError(toApiError(err).message || "Unable to update profile.", {
        id: "account.profile.error",
      });
    } finally {
      setProfileSaving(false);
    }
  };

  const uploadAvatar = async (file: File) => {
    if (!ALLOWED_AVATAR_TYPES.has(file.type)) {
      showError("Use a JPG, PNG, or WebP image.", { id: "account.avatar.error" });
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      showError("Image must be 10MB or smaller.", { id: "account.avatar.error" });
      return;
    }

    setAvatarSaving(true);
    try {
      const result = await meService.uploadAvatar(file);
      applyUpdatedUser(result.user);
      showSuccess("Profile photo updated.", { id: "account.avatar.success" });
    } catch (err) {
      showError(toApiError(err).message || "Unable to upload photo.", {
        id: "account.avatar.error",
      });
    } finally {
      setAvatarSaving(false);
    }
  };

  const clearAvatar = async () => {
    setAvatarSaving(true);
    try {
      const result = await meService.clearAvatar();
      applyUpdatedUser(result.user);
      showSuccess("Profile photo removed.", { id: "account.avatar.clear" });
    } catch (err) {
      showError(toApiError(err).message || "Unable to remove photo.", {
        id: "account.avatar.error",
      });
    } finally {
      setAvatarSaving(false);
    }
  };

  const savePassword = async () => {
    setPasswordFieldErrors({});

    const schema = z
      .object({
        currentPassword: hasPassword
          ? z.string().min(1, "Current password is required")
          : z.string().optional(),
        newPassword: strongPasswordSchema,
        confirmPassword: z.string().min(1, "Confirm password is required"),
      })
      .refine((data) => data.newPassword === data.confirmPassword, {
        message: "Passwords do not match",
        path: ["confirmPassword"],
      });

    const parsed = schema.safeParse({
      currentPassword: hasPassword ? currentPassword : undefined,
      newPassword,
      confirmPassword,
    });

    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? "form");
        if (!next[key]) next[key] = issue.message;
      }
      setPasswordFieldErrors(next);
      return;
    }

    setPasswordSaving(true);
    try {
      const result = await authService.changePassword({
        ...(hasPassword ? { currentPassword: parsed.data.currentPassword } : {}),
        newPassword: parsed.data.newPassword,
        confirmPassword: parsed.data.confirmPassword,
      });
      dispatch(
        setCredentials({
          user: result.user,
          accessToken: result.accessToken,
        }),
      );
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      showSuccess(
        hasPassword ? "Password changed successfully." : "Password set successfully.",
        { id: "account.password.success" },
      );
    } catch (err) {
      showError(toApiError(err).message || "Unable to update password.", {
        id: "account.password.error",
      });
    } finally {
      setPasswordSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Account Details</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your profile information and password.
        </p>
      </div>

      <Card className="border-border shadow-none">
        <CardHeader>
          <CardTitle className="text-base">Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <UserAvatar user={user} size="lg" />
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{getUserDisplayName(user)}</p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
              {createdAt ? (
                <p className="text-xs text-muted-foreground">Member since {createdAt}</p>
              ) : null}
              <div className="mt-3 flex flex-wrap gap-2">
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="sr-only"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) void uploadAvatar(file);
                    event.target.value = "";
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  disabled={avatarSaving || profileSaving}
                  onClick={() => avatarInputRef.current?.click()}
                >
                  <Upload className="size-4" />
                  {avatarSaving ? "Uploading…" : "Change photo"}
                </Button>
                {isValidImageUrl(user.imageUrl) ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={avatarSaving || profileSaving}
                    onClick={() => void clearAvatar()}
                  >
                    Remove photo
                  </Button>
                ) : null}
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                JPG, PNG, or WebP up to 10MB.
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="firstName">First name</Label>
              <Input
                id="firstName"
                value={firstName}
                onChange={(event) => setFirstName(event.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lastName">Last name</Label>
              <Input
                id="lastName"
                value={lastName}
                onChange={(event) => setLastName(event.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" value={user.email} disabled readOnly />
            <p className="text-xs text-muted-foreground">
              Email changes require a secure verification flow and are not available here yet.
            </p>
          </div>

          <Button disabled={profileSaving} onClick={() => void saveProfile()}>
            {profileSaving ? "Saving…" : "Save profile"}
          </Button>
        </CardContent>
      </Card>

      <Card className="border-border shadow-none">
        <CardHeader>
          <CardTitle className="text-base">
            {hasPassword ? "Change password" : "Set a password"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!hasPassword ? (
            <p className="text-sm text-muted-foreground">
              This account signs in with Google and does not have a password yet. You can
              optionally set a password to also sign in with email.
            </p>
          ) : null}

          {hasPassword ? (
            <div className="space-y-1.5">
              <Label htmlFor="currentPassword">Current password</Label>
              <div className="relative">
                <Input
                  id="currentPassword"
                  type={showCurrent ? "text" : "password"}
                  value={currentPassword}
                  onChange={(event) => setCurrentPassword(event.target.value)}
                  autoComplete="current-password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute top-1/2 right-1 -translate-y-1/2"
                  onClick={() => setShowCurrent((value) => !value)}
                  aria-label={showCurrent ? "Hide current password" : "Show current password"}
                >
                  {showCurrent ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </Button>
              </div>
              {passwordFieldErrors.currentPassword ? (
                <p className="text-xs text-destructive">
                  {passwordFieldErrors.currentPassword}
                </p>
              ) : null}
            </div>
          ) : null}

          <div className="space-y-1.5">
            <Label htmlFor="newPassword">New password</Label>
            <div className="relative">
              <Input
                id="newPassword"
                type={showNew ? "text" : "password"}
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                autoComplete="new-password"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute top-1/2 right-1 -translate-y-1/2"
                onClick={() => setShowNew((value) => !value)}
                aria-label={showNew ? "Hide new password" : "Show new password"}
              >
                {showNew ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </Button>
            </div>
            {passwordFieldErrors.newPassword ? (
              <p className="text-xs text-destructive">{passwordFieldErrors.newPassword}</p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="confirmPassword">Confirm new password</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              autoComplete="new-password"
            />
            {passwordFieldErrors.confirmPassword ? (
              <p className="text-xs text-destructive">
                {passwordFieldErrors.confirmPassword}
              </p>
            ) : null}
          </div>

          <Button disabled={passwordSaving} onClick={() => void savePassword()}>
            {passwordSaving
              ? "Saving…"
              : hasPassword
                ? "Update password"
                : "Set password"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
