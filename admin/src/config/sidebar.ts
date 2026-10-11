import type { LucideIcon } from "lucide-react";
import {
  ArrowLeftRight,
  BadgePercent,
  Boxes,
  ClipboardList,
  FileText,
  FolderOpen,
  Globe,
  HelpCircle,
  ImageIcon,
  LayoutDashboard,
  Link2,
  LogOut,
  MessageSquare,
  Newspaper,
  Package,
  Send,
  Share2,
  ShoppingBag,
  Star,
  Stethoscope,
  Truck,
  Users,
  UserRoundPlus,
  Building2,
  GalleryHorizontal,
  Handshake,
  PanelBottom,
} from "lucide-react";

import { moduleHref } from "@/config/admin-modules";
import type { SiteCode } from "@/types/auth";

export type NavItemStatus = "active" | "shell";

export interface SidebarNavItem {
  id: string;
  label: string;
  href?: string;
  icon: LucideIcon;
  status: NavItemStatus;
  children?: SidebarNavItem[];
  restricted?: boolean;
}

export interface SidebarSection {
  id: string;
  label?: string;
  items: SidebarNavItem[];
}

export interface NavBreadcrumb {
  label: string;
  href?: string;
}

function siteDashboardHref(siteCode: SiteCode): string {
  return `/admin/${siteCode.toLowerCase()}/dashboard`;
}

function href(siteCode: SiteCode, slug: string): string {
  return moduleHref(siteCode, slug);
}

function leaf(
  siteCode: SiteCode,
  id: string,
  label: string,
  slug: string,
  icon: LucideIcon,
  extras?: Partial<SidebarNavItem>,
): SidebarNavItem {
  return {
    id,
    label,
    href: href(siteCode, slug),
    icon,
    status: "shell",
    ...extras,
  };
}

function bannerChildren(siteCode: SiteCode): SidebarNavItem[] {
  return [
    leaf(siteCode, "banner-top-advertisement", "Top Advertisement Banner", "banners/top-advertisement", ImageIcon),
    leaf(siteCode, "banner-philosophy", "Philosophy Banner", "banners/philosophy", ImageIcon),
    leaf(siteCode, "banner-promotional", "Promotional Banner", "banners/promotional", ImageIcon),
    leaf(siteCode, "banner-manage", "Manage Banner", "banners/manage", ImageIcon),
    leaf(siteCode, "banner-featured-offered", "Featured Offered Banner", "banners/featured-offered", ImageIcon),
    leaf(siteCode, "banner-offer-details", "Offer Details", "banners/offer-details", FileText),
    leaf(siteCode, "banner-featured-product", "Manage Featured Product", "banners/featured-product", Star),
    leaf(siteCode, "banner-category-advertisement", "Category Advertisement", "banners/category-advertisement", ImageIcon),
    leaf(siteCode, "banner-popup", "PopUp Banner", "banners/popup", ImageIcon),
    leaf(siteCode, "banner-consultancy", "Consultancy Banner", "banners/consultancy", ImageIcon),
    leaf(siteCode, "banner-section-1", "Banner Section 1st", "banners/section-1", ImageIcon),
    leaf(siteCode, "banner-section-2", "Banner Section 2nd", "banners/section-2", ImageIcon),
    leaf(siteCode, "banner-section-3", "Banner Section 3rd", "banners/section-3", ImageIcon),
  ];
}

/**
 * Unified admin sidebar for both .in and .com.
 * Same labels/structure; hrefs stay site-scoped via siteCode.
 */
export function getSharedNav(siteCode: SiteCode): SidebarSection {
  return {
    id: "shared",
    items: [
      {
        id: "dashboard",
        label: "Dashboard Home",
        href: siteDashboardHref(siteCode),
        icon: Globe,
        status: "active",
        children: [
          leaf(siteCode, "company-info", "Company Basic Info", "company-basic-info", Building2, {
            status: "active",
          }),
          leaf(siteCode, "gallery", "Gallery Section", "gallery", GalleryHorizontal, {
            status: "active",
          }),
          leaf(siteCode, "manage-navbar", "Manage Navbar", "manage-navbar", Send, {
            status: "active",
          }),
          leaf(siteCode, "social-media-post", "Social Media Post", "social-media-post", Share2, {
            status: "active",
          }),
          leaf(siteCode, "create-webpages", "Create Webpages", "create-webpages", Link2),
          leaf(siteCode, "manage-footer", "Manage Footer", "manage-footer", PanelBottom, {
            status: "active",
          }),
        ],
      },
      {
        id: "switch-site",
        label: "Website switcher",
        href: "/select-site",
        icon: ArrowLeftRight,
        status: "active",
      },
    ],
  };
}

/** Main module tree shared by IN and COM (screenshot union). */
export function getUnifiedNav(siteCode: SiteCode): SidebarSection[] {
  return [
    {
      id: "main",
      items: [
        {
          id: "manage-banners",
          label: "Manage Banners",
          icon: ImageIcon,
          status: "shell",
          children: bannerChildren(siteCode),
        },
        {
          id: "sub-dashboard",
          label: "Sub-Dashboard",
          icon: LayoutDashboard,
          status: "shell",
          children: [
            leaf(siteCode, "stock-management", "Stock Management", "stock-management", Boxes),
            leaf(siteCode, "website-faq", "Website FAQ Section", "website-faq", HelpCircle),
            leaf(siteCode, "create-person-profile", "Create Person Profile", "create-person-profile", UserRoundPlus),
          ],
        },
        {
          id: "vendor-partner",
          label: "Vendor / Partner Section",
          icon: Handshake,
          status: "shell",
          children: [
            leaf(siteCode, "become-partner", "Become Partner", "vendor/become-partner", Handshake),
            leaf(siteCode, "partner-login-details", "Partner Login Details", "vendor/partner-login-details", Users),
          ],
        },
        leaf(siteCode, "add-direct-product", "Add Direct Product", "products/add-direct", Package),
        {
          id: "create-product",
          label: "Create Product",
          icon: Package,
          status: "shell",
          children: [
            leaf(siteCode, "create-tax-provision", "Create Tax Provision", "products/create-tax-provision", ClipboardList),
            leaf(siteCode, "create-menu", "Create Menu", "products/create-menu", FolderOpen),
            leaf(siteCode, "create-sub-menu", "Create Sub Menu", "products/create-sub-menu", FolderOpen),
            leaf(siteCode, "manage-products-category", "Manage Products & Category", "products/manage-category", Boxes),
            leaf(siteCode, "create-combo-product", "Create Combo Product", "products/create-combo", Package),
            leaf(siteCode, "view-all-products", "View All Products", "products/view-all", Package),
            leaf(siteCode, "create-price-list-increase", "Create Price List Increase", "products/price-list-increase", BadgePercent),
          ],
        },
        {
          id: "create-discount",
          label: "Create Discount",
          icon: BadgePercent,
          status: "shell",
          children: [
            leaf(siteCode, "create-discount-coupon", "Create Discount Coupon", "marketing/create-discount-coupon", BadgePercent),
          ],
        },
        {
          id: "approve-reject-reviews-group",
          label: "Approve/Reject Reviews",
          icon: Star,
          status: "shell",
          children: [
            leaf(siteCode, "create-reviews", "Create Reviews", "reviews/create", Star),
            leaf(siteCode, "approve-reject-reviews", "Approve/Reject Section", "reviews/approve-reject", ClipboardList),
          ],
        },
        {
          id: "news-or-notice",
          label: "News or Notice",
          icon: Newspaper,
          status: "shell",
          children: [
            leaf(siteCode, "create-news-promotion", "Create News Or Promotion", "news/create", Newspaper),
          ],
        },
        {
          id: "doctors-profile",
          label: "Create Doctor's Profile",
          icon: Stethoscope,
          status: "shell",
          children: [
            leaf(siteCode, "create-doctor-profile", "Create Profile", "doctors/create-profile", Stethoscope),
            leaf(siteCode, "view-doctor-profiles", "View Profile List", "doctors/view-list", Users),
          ],
        },
        {
          id: "order-report",
          label: "Order Report",
          icon: ShoppingBag,
          status: "shell",
          children: [
            leaf(siteCode, "order-enquiry", "Enquiry Order", "orders/enquiry", ClipboardList),
            leaf(siteCode, "order-cod-log", "COD Order Log", "orders/cod-log", ClipboardList),
            leaf(siteCode, "order-online-log", "Online Order Log", "orders/online-log", ClipboardList),
            leaf(siteCode, "order-vendor", "Vendor Order", "orders/vendor", Truck),
            leaf(siteCode, "order-cancel", "Cancel Order", "orders/cancel", ClipboardList),
            leaf(
              siteCode,
              "order-doctor-contact",
              "Doctor's Profile Contact Request",
              "orders/doctor-contact-request",
              MessageSquare,
            ),
          ],
        },
      ],
    },
  ];
}

/** @deprecated Use getUnifiedNav — kept as aliases so both sites share one tree. */
export function getInNav(siteCode: SiteCode = "IN"): SidebarSection[] {
  return getUnifiedNav(siteCode);
}

/** @deprecated Use getUnifiedNav — kept as aliases so both sites share one tree. */
export function getComNav(siteCode: SiteCode = "COM"): SidebarSection[] {
  return getUnifiedNav(siteCode);
}

export function getSidebarConfig(siteCode: SiteCode): SidebarSection[] {
  return [getSharedNav(siteCode), ...getUnifiedNav(siteCode)];
}

/** Fixed footer logout item — not rendered inside the scrollable nav list. */
export function getLogoutNavItem(): SidebarNavItem {
  return {
    id: "logout",
    label: "User Logout",
    icon: LogOut,
    status: "active",
  };
}

/** Flatten leaf nav items that have hrefs (excludes logout and group-only parents). */
export function getClickableNavItems(siteCode: SiteCode): SidebarNavItem[] {
  const result: SidebarNavItem[] = [];

  function walk(items: SidebarNavItem[]) {
    for (const item of items) {
      if (item.id === "logout") continue;
      if (item.href) result.push(item);
      if (item.children?.length) walk(item.children);
    }
  }

  for (const section of getSidebarConfig(siteCode)) {
    walk(section.items);
  }

  return result;
}

export function filterSidebarForRole(
  sections: SidebarSection[],
  role: string | undefined,
): SidebarSection[] {
  const allowRestricted = role === "SUPER_ADMIN";

  function filterItems(items: SidebarNavItem[]): SidebarNavItem[] {
    return items
      .filter((item) => (item.restricted ? allowRestricted : true))
      .map((item) =>
        item.children?.length ? { ...item, children: filterItems(item.children) } : item,
      );
  }

  return sections
    .map((section) => ({ ...section, items: filterItems(section.items) }))
    .filter((section) => section.items.length > 0);
}

function pathMatches(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function findNavTrail(
  siteCode: SiteCode,
  pathname: string,
): { section?: SidebarSection; ancestors: SidebarNavItem[]; item?: SidebarNavItem } {
  const sections = getSidebarConfig(siteCode);
  let best:
    | { section: SidebarSection; ancestors: SidebarNavItem[]; item: SidebarNavItem; score: number }
    | undefined;

  function consider(
    section: SidebarSection,
    ancestors: SidebarNavItem[],
    item: SidebarNavItem,
  ) {
    if (!item.href || !pathMatches(pathname, item.href)) return;
    const score = item.href.length;
    if (!best || score > best.score) {
      best = { section, ancestors, item, score };
    }
  }

  for (const section of sections) {
    for (const item of section.items) {
      if (item.children?.length) {
        for (const child of item.children) {
          consider(section, [item], child);
        }
      }
      consider(section, [], item);
    }
  }

  if (best) {
    return { section: best.section, ancestors: best.ancestors, item: best.item };
  }

  if (pathname === siteDashboardHref(siteCode)) {
    const shared = sections[0];
    const dashboard = shared?.items.find((item) => item.id === "dashboard");
    return { section: shared, ancestors: [], item: dashboard };
  }

  return { ancestors: [] };
}

export function getBreadcrumbs(siteCode: SiteCode, pathname: string): NavBreadcrumb[] {
  const crumbs: NavBreadcrumb[] = [
    { label: "Sites", href: "/select-site" },
    { label: siteCode === "IN" ? "SkinDx.in" : "SkinDx.com", href: siteDashboardHref(siteCode) },
  ];

  const trail = findNavTrail(siteCode, pathname);
  if (trail.section?.label) {
    crumbs.push({ label: trail.section.label });
  }
  for (const ancestor of trail.ancestors) {
    crumbs.push({ label: ancestor.label, href: ancestor.href });
  }
  if (trail.item && trail.item.id !== "dashboard") {
    crumbs.push({ label: trail.item.label, href: trail.item.href });
  } else if (pathname.endsWith("/dashboard")) {
    crumbs.push({ label: "Dashboard Home" });
  }

  return crumbs;
}

export function getActiveAncestorIds(siteCode: SiteCode, pathname: string): string[] {
  const trail = findNavTrail(siteCode, pathname);
  return trail.ancestors.map((item) => item.id);
}

export function resolvePageMeta(
  siteCode: SiteCode,
  pathname: string,
): { title: string; description?: string } {
  if (pathname === siteDashboardHref(siteCode) || pathname.endsWith("/dashboard")) {
    return {
      title: "Dashboard Home",
      description: "Review live statistics and manage site modules for the selected website.",
    };
  }

  const trail = findNavTrail(siteCode, pathname);
  if (trail.item) {
    return { title: trail.item.label };
  }

  return { title: "Administration" };
}
