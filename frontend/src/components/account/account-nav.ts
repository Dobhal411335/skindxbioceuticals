import type { LucideIcon } from "lucide-react";
import {
  Heart,
  LayoutDashboard,
  LogOut,
  MapPin,
  Package,
  UserRound,
} from "lucide-react";

export type AccountNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  action?: "logout";
};

export const accountNavItems: AccountNavItem[] = [
  { href: "/account/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/account/orders", label: "Your Orders", icon: Package },
  { href: "/account/wishlist", label: "Wishlist", icon: Heart },
  { href: "/account/addresses", label: "Addresses", icon: MapPin },
  { href: "/account/details", label: "Account Details", icon: UserRound },
  { href: "#logout", label: "Log out", icon: LogOut, action: "logout" },
];
