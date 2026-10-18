import type { AuthUser } from "@/types/auth";

export function isVendorUser(
  user: Pick<AuthUser, "role"> | null | undefined,
): boolean {
  return user?.role === "VENDOR";
}

export function getUserDisplayName(
  user: Pick<AuthUser, "firstName" | "lastName" | "email" | "username" | "role">,
): string {
  if (isVendorUser(user) && user.username?.trim()) {
    return user.username.trim();
  }
  const parts = [user.firstName, user.lastName]
    .map((part) => (typeof part === "string" ? part.trim() : ""))
    .filter(Boolean);
  if (parts.length > 0) {
    return parts.join(" ");
  }
  return user.email;
}

export function getUserInitial(
  user: Pick<AuthUser, "firstName" | "lastName" | "email" | "username" | "role">,
): string {
  if (isVendorUser(user) && user.username?.trim()) {
    return user.username.trim().charAt(0).toUpperCase();
  }
  const name = [user.firstName, user.lastName]
    .map((part) => (typeof part === "string" ? part.trim() : ""))
    .find(Boolean);
  if (name) {
    return name.charAt(0).toUpperCase();
  }
  if (user.email?.trim()) {
    return user.email.trim().charAt(0).toUpperCase();
  }
  return "?";
}

export function isValidImageUrl(value: string | null | undefined): value is string {
  if (!value || typeof value !== "string") {
    return false;
  }
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}
