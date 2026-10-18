"use client";

import { Handshake } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  getUserDisplayName,
  getUserInitial,
  isValidImageUrl,
  isVendorUser,
} from "@/features/auth/auth-user";
import type { AuthUser } from "@/types/auth";
import { cn } from "@/lib/utils";

type UserAvatarProps = {
  user: Pick<
    AuthUser,
    "firstName" | "lastName" | "email" | "imageUrl" | "username" | "role"
  >;
  size?: "default" | "sm" | "lg" | "xl";
  className?: string;
  /** Show a small Handshake badge for vendor sessions. */
  showVendorBadge?: boolean;
};

export function UserAvatar({
  user,
  size = "default",
  className,
  showVendorBadge = true,
}: UserAvatarProps) {
  const name = getUserDisplayName(user);
  const initial = getUserInitial(user);
  const imageUrl = isValidImageUrl(user.imageUrl) ? user.imageUrl : undefined;
  const vendor = isVendorUser(user);

  return (
    <span className={cn("relative inline-flex", className)}>
      <Avatar
        size={size}
        className={cn(vendor && "ring-2 ring-[#f3a827]/60")}
        data-has-image={imageUrl ? "true" : "false"}
      >
        {imageUrl ? (
          <AvatarImage
            src={imageUrl}
            alt={`${name} profile photo`}
            data-testid="user-avatar-image"
          />
        ) : null}
        <AvatarFallback
          className={cn(
            "font-semibold",
            vendor
              ? "bg-[#f3a827]/15 text-[#c4820f]"
              : "bg-primary/10 text-primary",
          )}
        >
          {initial}
        </AvatarFallback>
      </Avatar>
      {vendor && showVendorBadge ? (
        <span
          className="absolute -right-0.5 -bottom-0.5 flex size-3.5 items-center justify-center rounded-full bg-[#f3a827] text-white shadow-sm ring-2 ring-background"
          aria-hidden
        >
          <Handshake className="size-2" />
        </span>
      ) : null}
    </span>
  );
}
