import { redirect } from "next/navigation";

/** Prefer the public guest-accessible wishlist route (plan §O). */
export default function AccountWishlistPage() {
  redirect("/wishlist");
}
