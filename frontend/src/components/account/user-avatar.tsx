"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  getUserDisplayName,
  getUserInitial,
  isValidImageUrl,
} from "@/features/auth/auth-user";
import type { AuthUser } from "@/types/auth";
import { cn } from "@/lib/utils";

type UserAvatarProps = {
  user: Pick<AuthUser, "firstName" | "lastName" | "email" | "imageUrl">;
  size?: "default" | "sm" | "lg";
  className?: string;
};

export function UserAvatar({ user, size = "default", className }: UserAvatarProps) {
  const name = getUserDisplayName(user);
  const initial = getUserInitial(user);
  const imageUrl = isValidImageUrl(user.imageUrl) ? user.imageUrl : undefined;

  return (
    <Avatar
      size={size}
      className={cn(className)}
      data-has-image={imageUrl ? "true" : "false"}
    >
      {imageUrl ? (
        <AvatarImage
          src={imageUrl}
          alt={`${name} profile photo`}
          data-testid="user-avatar-image"
        />
      ) : null}
      <AvatarFallback className="bg-primary/10 font-semibold text-primary">
        {initial}
      </AvatarFallback>
    </Avatar>
  );
}
